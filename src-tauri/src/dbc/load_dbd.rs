use crate::dbc::parse_dbd::{
    parse, BuildVersion, ColType, ColumnDef, DbdFile, EntryDef, VersionDef,
};
use tauri::Manager;
use wow_cdbc::{FieldType, Schema, SchemaField};

pub fn load_dbd_from_path(path: &std::path::Path) -> Result<DbdFile, String> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| format!("Failed to read {}: {e}", path.display()))?;

    parse(&content)
}

fn map_field_type(col: &ColumnDef, entry: &EntryDef) -> Result<FieldType, String> {
    match col.col_type {
        ColType::Float => Ok(FieldType::Float32),
        ColType::String => Ok(FieldType::String),
        ColType::LocString => Ok(FieldType::String),
        ColType::Int | ColType::Uint => {
            let unsigned = entry.is_unsigned || matches!(col.col_type, ColType::Uint);
            match (entry.int_width, unsigned) {
                (Some(8), false) => Ok(FieldType::Int8),
                (Some(8), true) => Ok(FieldType::UInt8),
                (Some(16), false) => Ok(FieldType::Int16),
                (Some(16), true) => Ok(FieldType::UInt16),
                (Some(32), false) | (None, false) => Ok(FieldType::Int32),
                (Some(32), true) | (None, true) => Ok(FieldType::UInt32),
                (Some(w), _) => Err(format!("Unexpected int width: {w}")),
            }
        }
    }
}

fn build_schema(
    dbd: &DbdFile,
    version: &VersionDef,
    build: &BuildVersion,
    table_name: &str,
) -> Result<Schema, String> {
    let mut schema = Schema::new(table_name);
    let cata = BuildVersion {
        major: 4,
        minor: 0,
        patch: 0,
        build: 11792,
    };

    for entry in &version.entries {
        let col_def = dbd
            .columns
            .iter()
            .find(|c| c.name == entry.column)
            .ok_or_else(|| format!("No column def found for: {}", entry.column))?;

        // handle id annotation
        if entry.annotations.iter().any(|a| a == "id") {
            schema.set_key_field(&entry.column);
        }

        if matches!(col_def.col_type, ColType::LocString) && build < &cata {
            let locales = [
                "enUS", "enGB", "koKR", "frFR", "deDE", "enCN", "zhCN", "enTW", "zhTW", "esES",
                "esMX", "ruRU", "ptPT", "ptBR", "itIT", "unk",
            ];
            for locale in locales {
                schema.add_field(SchemaField::new(
                    format!("{}_{}", entry.column, locale),
                    FieldType::String,
                ));
            }
            schema.add_field(SchemaField::new(
                format!("{}_flags", entry.column),
                FieldType::UInt32,
            ));
            continue;
        }

        let field_type = map_field_type(col_def, entry)?;
        let field = match entry.array_size {
            Some(size) => SchemaField::new_array(&entry.column, field_type, size),
            None => SchemaField::new(&entry.column, field_type),
        };
        schema.add_field(field);
    }

    Ok(schema)
}

pub fn load_dbd(app_handle: tauri::AppHandle, table_name: String) -> Result<(), String> {
    let wotlk_version = BuildVersion {
        major: 3,
        minor: 3,
        patch: 5,
        build: 12340,
    };
    let path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("definitions")
        .join(format!("{}.dbd", table_name));

    let dbd_file = load_dbd_from_path(&path)?;
    let version_def = dbd_file
        .definitions
        .iter()
        .find(|v| {
            v.builds
                .iter()
                .find(|x| x.contains(&wotlk_version))
                .is_some()
        })
        .ok_or("Failed to find a matching version definition for the provided patch")?;

    let mut schema = build_schema(&dbd_file, version_def, &wotlk_version, &table_name);
    todo!()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_load() {
        let dir = std::env::temp_dir();
        let file_path = dir.join("test.dbd");

        let content = r#"COLUMNS
int ID
string Name

BUILD 1.0.0.1
LAYOUT test
ID
Name
"#;

        fs::write(&file_path, content).unwrap();

        let res = load_dbd_from_path(&file_path);

        assert!(res.is_ok());

        let dbd = res.unwrap();
        println!("{:#?}", dbd);
        assert_eq!(dbd.columns.len(), 2);
        assert_eq!(dbd.definitions.len(), 1);

        let _ = fs::remove_file(file_path);
    }
}
