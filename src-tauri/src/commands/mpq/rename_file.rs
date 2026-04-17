use crate::mpq;
use crate::types::structs::SharedAppState;
use tauri::State;

#[tauri::command]
pub async fn rename_file(
    state: State<'_, SharedAppState>,
    id: u32,
    old_name: String,
    new_name: String,
) -> Result<(), String> {
    let state = state.inner().clone();
    mpq::rename_file(state, id, old_name, new_name).await?;
    Ok(())
}
