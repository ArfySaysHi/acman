use crate::mpq;
use crate::types::structs::SharedAppState;

#[tauri::command]
pub async fn delete_files(
    state: tauri::State<'_, SharedAppState>,
    id: u32,
    paths: Vec<String>,
) -> Result<(), String> {
    let state = state.inner().clone();
    mpq::delete_files(state, id, paths).await
}
