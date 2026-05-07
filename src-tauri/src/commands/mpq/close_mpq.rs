use crate::types::structs::SharedAppState;
use tauri::State;
use tracing::info;

#[tauri::command]
pub async fn close_mpq(state: State<'_, SharedAppState>, id: u32) -> Result<(), String> {
    info!(id=%id, "close_mpq called");
    let mut mpqs = state.mpqs.write().await;
    mpqs.remove(&id).ok_or("Invalid MPQ id")?;

    info!(id=%id, "close_mpq success");
    Ok(())
}
