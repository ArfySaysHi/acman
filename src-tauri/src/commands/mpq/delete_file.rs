use crate::mpq;
use crate::types::structs::SharedAppState;

#[tauri::command]
pub async fn delete_file(
    state: tauri::State<'_, SharedAppState>,
    id: u32,
    path: String,
) -> Result<(), String> {
    let state = state.inner().clone();
    mpq::delete_file(state, id, path).await
}
