#[derive(Clone, Debug)]
pub enum ColType {
    Int,
    Uint,
    Float,
    String,
    LocString,
}

impl TryFrom<&str> for ColType {
    type Error = String;

    fn try_from(value: &str) -> Result<Self, String> {
        match value {
            "int" => Ok(ColType::Int),
            "uint" => Ok(ColType::Uint),
            "float" => Ok(ColType::Float),
            "string" => Ok(ColType::String),
            "locstring" => Ok(ColType::LocString),
            _ => Err(format!("Unknown column type: {value}")),
        }
    }
}

#[derive(Debug)]
pub struct DbdFile {
    pub columns: Vec<ColumnDef>,
    pub definitions: Vec<VersionDef>,
}

#[derive(Debug)]
pub struct ColumnDef {
    pub col_type: ColType,
    pub name: String,
    pub foreign: Option<(String, String)>,
    pub is_confirmed: bool,
    pub comment: Option<String>,
}

#[derive(Debug)]
pub struct VersionDef {
    pub builds: Vec<BuildRange>,
    pub layouts: Vec<String>,
    pub entries: Vec<EntryDef>,
}

#[derive(Debug)]
pub struct BuildRange {
    pub min: BuildVersion,
    pub max: Option<BuildVersion>,
}

impl BuildRange {
    pub fn contains(&self, v: &BuildVersion) -> bool {
        match &self.max {
            Some(max) => v >= &self.min && v <= max,
            None => v == &self.min,
        }
    }
}

#[derive(PartialEq, Eq, PartialOrd, Ord, Debug)]
pub struct BuildVersion {
    pub major: u16,
    pub minor: u16,
    pub patch: u16,
    pub build: u32,
}

#[derive(Debug)]
pub struct EntryDef {
    pub column: String,
    pub annotations: Vec<String>,
    pub int_width: Option<u8>,
    pub is_unsigned: bool,
    pub array_size: Option<usize>,
    pub comment: Option<String>,
}

fn parse_build_version(input: &str) -> Result<BuildVersion, String> {
    let mut parts = input.split('.');

    let bv = BuildVersion {
        major: parts
            .next()
            .ok_or("Missing major version")?
            .parse::<u16>()
            .map_err(|e| e.to_string())?,
        minor: parts
            .next()
            .ok_or("Missing minor version")?
            .parse::<u16>()
            .map_err(|e| e.to_string())?,
        patch: parts
            .next()
            .ok_or("Missing patch version")?
            .parse::<u16>()
            .map_err(|e| e.to_string())?,
        build: parts
            .next()
            .ok_or("Missing build version")?
            .parse::<u32>()
            .map_err(|e| e.to_string())?,
    };

    if parts.next().is_some() {
        return Err(format!(
            "Unexpected extra components in build version: {input}"
        ));
    }

    Ok(bv)
}

fn parse_build_line(input: &str) -> Result<Vec<BuildRange>, String> {
    let clean = input
        .strip_prefix("BUILD ")
        .ok_or("Failed to strip BUILD prefix from line")?;
    let build_ranges = clean
        .split(", ")
        .map(|range| {
            if range.contains('-') {
                let mut range_split = range.splitn(2, '-');
                Ok(BuildRange {
                    min: parse_build_version(
                        range_split.next().ok_or("Failed to read build min")?,
                    )?,
                    max: Some(parse_build_version(
                        range_split.next().ok_or("Failed to read build max")?,
                    )?),
                })
            } else {
                let min = parse_build_version(range)?;
                Ok(BuildRange { min, max: None })
            }
        })
        .collect::<Result<Vec<_>, String>>()?;
    Ok(build_ranges)
}

fn parse_column_type(input: &str) -> Result<(ColType, Option<(String, String)>), String> {
    if input.contains('<') {
        let mut col_split = input.split('<');
        let col_type = col_split.next().ok_or("Failed to read column type")?;
        let col_name = col_split
            .next()
            .ok_or("Failed to read column name")?
            .strip_suffix('>')
            .ok_or("Failed to strip suffix")?;
        match col_name.split("::").collect::<Vec<&str>>().as_slice() {
            [table, col] => Ok((
                col_type.try_into()?,
                Some((table.to_string(), col.to_string())),
            )),
            _ => Err(format!("Invalid foreign key format: {col_name}")),
        }
    } else {
        Ok((input.try_into()?, None))
    }
}

fn parse_column_name(input: &str) -> Result<(String, Option<String>, bool), String> {
    let mut name_split = input.splitn(2, "//");
    let col_name = name_split.next().ok_or("Failed to read column name")?;
    let col_comment = name_split.next().to_owned();
    let col_unconfirmed = col_name.contains('?');

    let col_name = if col_unconfirmed {
        col_name.replacen("?", "", 1).trim().to_string()
    } else {
        col_name.trim().to_string()
    };

    if let Some(comment) = col_comment {
        Ok((col_name, Some(comment.trim().to_string()), col_unconfirmed))
    } else {
        Ok((col_name, None, col_unconfirmed))
    }
}

fn parse_column_def(input: &str) -> Result<ColumnDef, String> {
    let mut col_split = input.splitn(2, ' ');
    let col_type = parse_column_type(col_split.next().ok_or("Failed to read column type")?)?;
    let col_name = parse_column_name(col_split.next().ok_or("Failed to read column name")?)?;

    Ok(ColumnDef {
        col_type: col_type.0,
        name: col_name.0,
        foreign: col_type.1,
        is_confirmed: !col_name.2,
        comment: col_name.1,
    })
}

fn parse_annotations(s: &str) -> Result<(Vec<String>, &str), String> {
    if s.starts_with('$') {
        let mut s_split = s.splitn(3, '$');
        s_split.next(); // Hi future me, annotations begin and end with $ so we skip the empty string
        let annotations = s_split
            .next()
            .ok_or("Failed to read annotations")?
            .split(',')
            .map(|s| s.to_string())
            .collect::<Vec<String>>();
        let remaining = s_split
            .next()
            .ok_or("Failed to get the rest of the string back")?;

        Ok((annotations, remaining))
    } else {
        Ok((vec![], s))
    }
}

fn parse_entry_column_name(s: &str) -> Result<(String, &str), String> {
    let end = s.find(['<', '[']).unwrap_or(s.len());
    let (name, remaining) = s.split_at(end);

    if name.trim().is_empty() {
        return Err("Columns may not have an empty name".to_string());
    }

    Ok((name.to_string(), remaining))
}

fn parse_entry_width(s: &str) -> Result<(Option<u8>, bool, &str), String> {
    if !s.starts_with('<') {
        return Ok((None::<u8>, false, s));
    }

    let mut is_unsigned = false;

    let mut s_split = s.splitn(2, '>');
    let mut width_str = s_split
        .next()
        .ok_or("Failed to get entry width")?
        .strip_prefix('<')
        .ok_or("Failed to strip < from entry width")?;
    let remaining = s_split
        .next()
        .ok_or("Failed to get the remainder of the string")?;

    if width_str.starts_with('f') {
        return Ok((None::<u8>, false, remaining));
    }

    if width_str.starts_with('u') {
        is_unsigned = true;
        width_str = width_str
            .strip_prefix('u')
            .ok_or("Failed to strip unsigned character from entry width")?;
    }

    Ok((
        Some(
            width_str
                .parse::<u8>()
                .map_err(|e| format!("Failed to parse entry width as u8: {e}"))?,
        ),
        is_unsigned,
        remaining,
    ))
}

fn parse_entry_array(s: &str) -> Result<(Option<usize>, &str), String> {
    if !s.starts_with('[') {
        Ok((None, s))
    } else {
        let mut s_split = s.splitn(2, ']');
        let array_val = s_split
            .next()
            .ok_or("Failed to parse array size")?
            .trim_start_matches('[')
            .parse::<usize>()
            .map_err(|e| format!("Failed to parse the content of entry array into usize: {e}"))?;

        Ok((
            Some(array_val),
            s_split
                .next()
                .ok_or("Failed to retrieve the remainder of the string")?,
        ))
    }
}

fn parse_inline_comment(s: &str) -> Result<Option<String>, String> {
    if s.starts_with("//") {
        let mut s_split = s.splitn(2, "//");
        s_split.next(); // Empty string

        Ok(Some(
            s_split
                .next()
                .ok_or("Failed to parse inline comment")?
                .trim()
                .to_string(),
        ))
    } else {
        Ok(None)
    }
}

fn parse_entry_def(input: &str) -> Result<EntryDef, String> {
    let s = input;

    let (annotations, s) = parse_annotations(s)?;
    let (column, s) = parse_entry_column_name(s)?;
    let (int_width, is_unsigned, s) = parse_entry_width(s)?;
    let (array_size, s) = parse_entry_array(s)?;
    let comment = parse_inline_comment(s.trim())?;

    Ok(EntryDef {
        column,
        annotations,
        int_width,
        is_unsigned,
        array_size,
        comment,
    })
}

fn line_type(line: &str) -> &str {
    if line.is_empty() {
        "blank"
    } else if line.starts_with("BUILD ") {
        "build"
    } else if line.starts_with("LAYOUT ") {
        "layout"
    } else if line.starts_with("COMMENT ") {
        "comment"
    } else if line.starts_with("COLUMNS") {
        "columns"
    } else if ["int ", "uint ", "float ", "string ", "locstring "]
        .iter()
        .any(|p| line.starts_with(p))
    {
        "columndef"
    } else {
        "entry"
    }
}

fn parse_column_block<'a, I>(lines: &mut std::iter::Peekable<I>) -> Result<Vec<ColumnDef>, String>
where
    I: Iterator<Item = &'a str>,
{
    let mut columns: Vec<ColumnDef> = vec![];
    let header = lines.next().ok_or("Expected COLUMNS header")?;

    if header != "COLUMNS" {
        return Err(format!("Expected COLUMNS header, got: {header}"));
    }

    while let Some(&line) = lines.peek() {
        if line.is_empty() {
            lines.next();
            break;
        }

        columns.push(parse_column_def(line)?);
        lines.next();
    }

    Ok(columns)
}

fn parse_version_block<'a, I>(lines: &mut std::iter::Peekable<I>) -> Result<VersionDef, String>
where
    I: Iterator<Item = &'a str>,
{
    let mut builds: Vec<BuildRange> = vec![];
    let mut layouts: Vec<String> = vec![];
    let mut entries: Vec<EntryDef> = vec![];

    while let Some(&line) = lines.peek() {
        let line_category = line_type(line);
        if line_category == "blank" {
            lines.next();
            break;
        }

        match line_category {
            "build" => {
                builds.extend(parse_build_line(line)?);
                lines.next();
            }
            "layout" => {
                layouts.extend(
                    line.strip_prefix("LAYOUT ")
                        .ok_or("Failed to strip prefix from LAYOUT")?
                        .split(", ")
                        .map(|s| s.to_string()),
                );
                lines.next();
            }
            "entry" => {
                entries.push(parse_entry_def(line)?);
                lines.next();
            }
            _ => break,
        }
    }

    if builds.is_empty() && layouts.is_empty() && entries.is_empty() {
        return Err("Empty version definition".to_string());
    }

    Ok(VersionDef {
        builds,
        layouts,
        entries,
    })
}

pub fn parse(input: &str) -> Result<DbdFile, String> {
    let mut lines = input.lines().map(str::trim).peekable();

    let columns = parse_column_block(&mut lines)?;
    let mut definitions: Vec<VersionDef> = vec![];

    while lines.peek().is_some() {
        // skip blank lines between version blocks
        while lines.peek().map(|l| l.is_empty()) == Some(true) {
            lines.next();
        }
        if lines.peek().is_none() {
            break;
        }
        definitions.push(parse_version_block(&mut lines)?);
    }

    Ok(DbdFile {
        columns,
        definitions,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_build_version() {
        let result = parse_build_version("3.3.5.12340").unwrap();
        assert_eq!(result.major, 3);
        assert_eq!(result.minor, 3);
        assert_eq!(result.patch, 5);
        assert_eq!(result.build, 12340);
    }

    #[test]
    fn test_parse_build_version_extra_component() {
        assert!(parse_build_version("3.3.5.12340.extra").is_err());
    }

    #[test]
    fn test_parse_simple_block() {
        let input = "\
COLUMNS
int ID
locstring Name_lang

BUILD 3.3.5.12340
$id$ID<32>
Name_lang
";
        let result = parse(input).unwrap();
        assert_eq!(result.columns.len(), 2);
        assert_eq!(result.definitions.len(), 1);
        assert_eq!(result.definitions[0].entries.len(), 2);
        assert_eq!(result.definitions[0].builds.len(), 1);
    }
}
