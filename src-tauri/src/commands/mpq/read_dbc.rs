use crate::helpers::dbc::dbc_name_map;
use serde::Serialize;
use wow_cdbc::{DbcParser, RecordSet, Value};

use crate::{
    dbc::load_dbd::load_dbd, mpq::extract_file::extract_file, types::structs::SharedAppState,
};

#[derive(Serialize)]
pub struct DbcResponse {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<DbcValue>>,
}

#[derive(Serialize)]
#[serde(untagged)]
pub enum DbcValue {
    Int(i32),
    UInt(u32),
    Float(f32),
    Str(String),
}

fn extract_dbc_name(path: &str) -> &str {
    path.split(['/', '\\'])
        .next_back()
        .unwrap_or("unknown.dbc")
        .trim_end_matches(".dbc")
}

fn parse_dbc_bytes(bytes: &[u8]) -> Result<DbcParser, String> {
    DbcParser::parse_bytes(bytes).map_err(|e| format!("Failed to parse DBC: {e}"))
}

fn parse_records_with_schema(bytes: &[u8], schema: wow_cdbc::Schema) -> Result<RecordSet, String> {
    parse_dbc_bytes(bytes)?
        .with_schema(schema)
        .map_err(|e| format!("Failed to apply schema: {e}"))?
        .parse_records()
        .map_err(|e| format!("Failed to parse records with schema: {e}"))
}

fn convert_value(v: &Value, record_set: &RecordSet) -> DbcValue {
    match v {
        Value::Int32(n) => DbcValue::Int(*n),
        Value::Int8(n) => DbcValue::Int(*n as i32),
        Value::Int16(n) => DbcValue::Int(*n as i32),
        Value::UInt32(n) => DbcValue::UInt(*n),
        Value::UInt8(n) => DbcValue::UInt(*n as u32),
        Value::UInt16(n) => DbcValue::UInt(*n as u32),
        Value::Float32(f) => DbcValue::Float(*f),
        Value::Bool(b) => DbcValue::UInt(*b as u32),
        Value::StringRef(s) => DbcValue::Str(record_set.get_string(*s).unwrap_or("").to_string()),
        Value::Array(arr) => DbcValue::Str(
            arr.iter()
                .map(|v| v.to_string())
                .collect::<Vec<_>>()
                .join(", "),
        ),
    }
}

fn build_response(record_set: RecordSet, columns: Vec<String>) -> DbcResponse {
    let rows = record_set
        .records()
        .iter()
        .map(|record| {
            record
                .values()
                .iter()
                .map(|v| convert_value(v, &record_set))
                .collect()
        })
        .collect();

    DbcResponse { columns, rows }
}

#[tauri::command]
pub async fn read_dbc(
    state: tauri::State<'_, SharedAppState>,
    app_handle: tauri::AppHandle,
    id: u32,
    path: String,
) -> Result<DbcResponse, String> {
    let state = state.inner().clone();
    let file_name = extract_dbc_name(&path);
    let name_map = dbc_name_map();
    let table_name = name_map.get(&file_name);

    let dbc_raw = extract_file(state, id, path.clone()).await?;

    // Getting the schema for the given dbc name
    let parsed_schema = {
        if let Some(name) = &table_name {
            load_dbd(app_handle, name)?
        } else {
            load_dbd(app_handle, file_name)?
        }
    };
    let columns = parsed_schema
        .fields
        .iter()
        .map(|f| f.name.clone())
        .collect();

    // Providing context to DBC columns and shipping it out
    let dbc_records = parse_records_with_schema(&dbc_raw, parsed_schema)
        .map_err(|e| format!("Failed to parse dbc_bytes: {e}"))?;
    let response = build_response(dbc_records, columns);

    Ok(response)
}
