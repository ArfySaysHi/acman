use crate::types::structs::SharedAppState;
use tauri::State;

#[tauri::command]
pub async fn close_mpq(state: State<'_, SharedAppState>, id: u32) -> Result<(), String> {
    let mut mpqs = state.mpqs.write().await;
    mpqs.remove(&id).ok_or("Invalid MPQ id")?;

    Ok(())
}
