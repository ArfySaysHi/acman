use crate::types::structs::*;
use tokio::io::AsyncWriteExt;

#[tauri::command]
pub async fn send_ws_command(
    command: String,
    state: tauri::State<'_, SharedAppState>,
) -> Result<(), String> {
    let maybe_writer = {
        let guard = state.worldserver.lock().await;
        guard.input.clone()
    };

    let writer = maybe_writer.ok_or_else(|| "Not connected to worldserver".to_string())?;

    {
        let mut locked = writer.lock().await;
        locked
            .write_all(format!("{}\n", command).as_bytes())
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
