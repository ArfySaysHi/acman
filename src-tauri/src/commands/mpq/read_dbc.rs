use crate::{mpq::extract_file::extract_file, types::structs::SharedAppState};
use serde::Serialize;
use wow_cdbc::{DbcParser, RecordSet, SchemaDiscoverer, Value};

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
        .last()
        .unwrap_or("unknown.dbc")
        .trim_end_matches(".dbc")
}

fn parse_dbc_bytes(bytes: &[u8]) -> Result<DbcParser, String> {
    DbcParser::parse_bytes(bytes).map_err(|e| format!("Failed to parse DBC: {e}"))
}

fn discover_schema<'a>(
    parser: &'a DbcParser,
    raw_records: &'a wow_cdbc::RecordSet,
    dbc_name: &str,
) -> Result<wow_cdbc::Schema, String> {
    if let Some(schema) = crate::dbc::schema::get_known_schema(dbc_name) {
        return Ok(schema);
    }

    SchemaDiscoverer::new(parser.header(), parser.data(), raw_records.string_block())
        .with_detect_key(true)
        .with_validate_strings(true)
        .generate_schema(dbc_name)
        .map_err(|e| format!("Failed to discover schema: {e}"))
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
    id: u32,
    path: String,
) -> Result<DbcResponse, String> {
    let state = state.inner().clone();
    let dbc_raw = extract_file(state, id, path.clone()).await?;

    let dbc_name = extract_dbc_name(&path);

    let parser = parse_dbc_bytes(&dbc_raw)?;
    let raw_records = parser
        .parse_records()
        .map_err(|e| format!("Failed to parse records: {e}"))?;

    let schema = discover_schema(&parser, &raw_records, dbc_name)?;
    let columns = schema.fields.iter().map(|f| f.name.clone()).collect();

    let record_set = parse_records_with_schema(&dbc_raw, schema)?;

    Ok(build_response(record_set, columns))
}
