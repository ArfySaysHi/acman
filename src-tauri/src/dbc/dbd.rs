#[derive(Clone, Debug)]
pub enum ColType {
    Int,
    Uint,
    Float,
    String,
    LocString,
}

pub struct DbdFile {
    columns: Vec<ColumnDef>,
    definitions: Vec<VersionDef>,
}

pub struct ColumnDef {
    col_type: ColType,
    name: String,
    foreign: Option<(String, String)>,
    is_confirmed: bool,
    comment: Option<String>,
}

pub struct VersionDef {
    builds: Vec<BuildRange>,
    layouts: Vec<String>,
    entries: Vec<EntryDef>,
}

pub struct BuildRange {
    min: BuildVersion,
    max: Option<BuildVersion>,
}

impl BuildRange {
    pub fn contains(&self, v: &BuildVersion) -> bool {
        match &self.max {
            Some(max) => v >= &self.min && v <= max,
            None => v == &self.min,
        }
    }
}

#[derive(PartialEq, Eq, PartialOrd, Ord)]
pub struct BuildVersion {
    major: u16,
    minor: u16,
    patch: u16,
    build: u32,
}

pub struct EntryDef {
    column: String,
    annotations: Vec<String>,
    int_width: Option<u8>,
    is_unsigned: bool,
    array_size: Option<usize>,
    comment: Option<String>,
}

pub fn parse_build_version(input: &str) -> Result<BuildVersion, String> {
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

pub fn parse_build_line(input: &str) -> Result<Vec<BuildRange>, String> {
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

pub fn parse(input: &str) -> Result<DbdFile, String> {
    todo!()
}
