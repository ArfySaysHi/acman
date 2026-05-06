use crate::{
    dbc::load_dbd::load_dbd,
    mpq::extract_file,
    types::structs::{DbcEdit, MpqInstance, SharedAppState},
};
use std::{
    path::{Path, PathBuf},
    sync::Arc,
};
use tokio::sync::Mutex;
use wow_cdbc::{DbcParser, FieldType};
use wow_mpq::MutableArchive;

const DBC_HEADER_SIZE: usize = 20;
const STRING_BLOCK_SIZE_OFFSET: usize = 16;

#[tauri::command]
pub async fn update_dbc(
    state: tauri::State<'_, SharedAppState>,
    app_handle: tauri::AppHandle,
    id: u32,
    archive_path: PathBuf,
    edits: Vec<DbcEdit>,
) -> Result<(), String> {
    let state = state.inner().clone();

    let file_name = archive_path
        .file_name()
        .ok_or("Failed to read file name")?
        .to_string_lossy()
        .to_string();

    let table_name = file_name
        .strip_suffix(".dbc")
        .ok_or("Failed to strip .dbc suffix")?;

    let mut dbc_raw = extract_file::extract_file(
        state.clone(),
        id,
        archive_path.to_string_lossy().to_string(),
    )
    .await?;

    let schema = load_dbd(app_handle, table_name)?;

    let parser =
        DbcParser::parse_bytes(&dbc_raw).map_err(|e| format!("Failed to parse DBC header: {e}"))?;

    let record_size = parser.header().record_size as usize;
    let record_count = parser.header().record_count as usize;
    let string_block_offset = DBC_HEADER_SIZE + record_count * record_size;

    apply_numeric_edits(&mut dbc_raw, &edits, &schema.fields, record_size)?;
    apply_string_edits(
        &mut dbc_raw,
        &edits,
        &schema.fields,
        record_size,
        string_block_offset,
    )?;

    write_to_mpq(&state, id, &archive_path, &dbc_raw).await
}

fn field_byte_offset(fields: &[wow_cdbc::SchemaField], col: usize) -> usize {
    fields[..col].iter().map(|f| f.size()).sum()
}

fn record_byte_offset(
    row: usize,
    col: usize,
    record_size: usize,
    fields: &[wow_cdbc::SchemaField],
) -> usize {
    DBC_HEADER_SIZE + row * record_size + field_byte_offset(fields, col)
}

fn apply_numeric_edits(
    dbc_raw: &mut Vec<u8>,
    edits: &[DbcEdit],
    fields: &[wow_cdbc::SchemaField],
    record_size: usize,
) -> Result<(), String> {
    for edit in edits {
        let field = fields
            .get(edit.col)
            .ok_or_else(|| format!("Col {} out of bounds", edit.col))?;

        if field.field_type == FieldType::String {
            continue;
        }

        let byte_offset = record_byte_offset(edit.row, edit.col, record_size, fields);
        let field_size = field.field_type.size();

        if byte_offset + field_size > dbc_raw.len() {
            return Err(format!(
                "Edit at row={} col={} exceeds file bounds",
                edit.row, edit.col
            ));
        }

        let bytes = value_to_bytes(&edit.value, field.field_type)?;
        dbc_raw[byte_offset..byte_offset + field_size].copy_from_slice(&bytes);
    }

    Ok(())
}

fn apply_string_edits(
    dbc_raw: &mut Vec<u8>,
    edits: &[DbcEdit],
    fields: &[wow_cdbc::SchemaField],
    record_size: usize,
    string_block_offset: usize,
) -> Result<(), String> {
    let string_edits: Vec<&DbcEdit> = edits
        .iter()
        .filter(|e| {
            fields
                .get(e.col)
                .map(|f| f.field_type == FieldType::String)
                .unwrap_or(false)
        })
        .collect();

    if string_edits.is_empty() {
        return Ok(());
    }

    let mut string_block = dbc_raw[string_block_offset..].to_vec();

    for edit in string_edits {
        let byte_offset = record_byte_offset(edit.row, edit.col, record_size, fields);

        let str_offset = find_or_append_string(&mut string_block, &edit.value);
        dbc_raw[byte_offset..byte_offset + 4].copy_from_slice(&str_offset.to_le_bytes());
    }

    // Rebuild: header + records + updated string block
    dbc_raw.truncate(string_block_offset);
    dbc_raw.extend_from_slice(&string_block);

    // Patch string_block_size in the header
    let new_size = string_block.len() as u32;
    dbc_raw[STRING_BLOCK_SIZE_OFFSET..STRING_BLOCK_SIZE_OFFSET + 4]
        .copy_from_slice(&new_size.to_le_bytes());

    Ok(())
}

fn find_or_append_string(block: &mut Vec<u8>, value: &str) -> u32 {
    if value.is_empty() {
        return 0; // offset 0 is always the empty string
    }

    let bytes = value.as_bytes();

    // Search for an existing null-terminated match
    if let Some(offset) = block
        .windows(bytes.len() + 1)
        .position(|w| &w[..bytes.len()] == bytes && w[bytes.len()] == 0)
    {
        return offset as u32;
    }

    // Append new string
    let offset = block.len() as u32;
    block.extend_from_slice(bytes);
    block.push(0);
    offset
}

async fn write_to_mpq(
    state: &SharedAppState,
    id: u32,
    archive_path: &Path,
    data: &[u8],
) -> Result<(), String> {
    let instance_guard = {
        let guard = state.mpqs.read().await;
        guard
            .get(&id)
            .cloned()
            .ok_or("Failed to find MPQ instance")?
    };

    let mut instance = instance_guard.lock().await;

    instance
        .archive
        .add_file_data(data, &archive_path.to_string_lossy(), Default::default())
        .map_err(|e| format!("Failed to write file to MPQ: {e}"))?;

    instance
        .archive
        .flush()
        .map_err(|e| format!("Failed to flush MPQ: {e}"))?;

    drop(instance);
    drop(instance_guard);

    reopen_mpq(state, id).await
}

async fn reopen_mpq(state: &SharedAppState, id: u32) -> Result<(), String> {
    let path = {
        let guard = state.mpqs.read().await;
        let instance = guard.get(&id).ok_or("Failed to find MPQ instance")?;
        let mpq = instance.lock().await;
        mpq.path.clone()
    };

    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("Unknown filename")?
        .to_string();

    let archive = MutableArchive::open(&path).map_err(|e| e.to_string())?;

    {
        let mut mpqs = state.mpqs.write().await;
        mpqs.insert(
            id,
            Arc::new(Mutex::new(MpqInstance {
                archive,
                path,
                name,
            })),
        );
    }

    Ok(())
}

fn value_to_bytes(s: &str, field_type: FieldType) -> Result<Vec<u8>, String> {
    match field_type {
        FieldType::Int32 => s
            .parse::<i32>()
            .map(|v| v.to_le_bytes().to_vec())
            .map_err(|e| format!("Invalid i32 '{s}': {e}")),
        FieldType::UInt32 => s
            .parse::<u32>()
            .map(|v| v.to_le_bytes().to_vec())
            .map_err(|e| format!("Invalid u32 '{s}': {e}")),
        FieldType::Float32 => s
            .parse::<f32>()
            .map(|v| v.to_le_bytes().to_vec())
            .map_err(|e| format!("Invalid f32 '{s}': {e}")),
        FieldType::Bool => {
            let v: u32 = if s == "true" || s == "1" { 1 } else { 0 };
            Ok(v.to_le_bytes().to_vec())
        }
        FieldType::UInt8 => s
            .parse::<u8>()
            .map(|v| vec![v])
            .map_err(|e| format!("Invalid u8 '{s}': {e}")),
        FieldType::Int8 => s
            .parse::<i8>()
            .map(|v| vec![v as u8])
            .map_err(|e| format!("Invalid i8 '{s}': {e}")),
        FieldType::UInt16 => s
            .parse::<u16>()
            .map(|v| v.to_le_bytes().to_vec())
            .map_err(|e| format!("Invalid u16 '{s}': {e}")),
        FieldType::Int16 => s
            .parse::<i16>()
            .map(|v| v.to_le_bytes().to_vec())
            .map_err(|e| format!("Invalid i16 '{s}': {e}")),
        FieldType::String => unreachable!("String fields are handled in apply_string_edits"),
    }
}
