use crate::mpq;
use crate::types::structs::SharedAppState;
use std::path::PathBuf;

#[tauri::command]
pub async fn create_dir(
    state: tauri::State<'_, SharedAppState>,
    id: u32,
    path: PathBuf,
) -> Result<(), String> {
    let state = state.inner().clone();
    mpq::create_dir(state, id, path).await
}
