use crate::types::structs::SharedAppState;
use wow_mpq::MutableArchive;

#[tauri::command]
pub async fn add_file(
    state: tauri::State<'_, SharedAppState>,
    id: u32,
    path: String,
    archive_path: String,
) -> Result<(), String> {
    let instance_mutex = {
        let guard = state.mpqs.read().await;
        guard.get(&id).cloned().ok_or("Failed to get MPQInstance")?
    };

    let mut instance = instance_mutex.lock().await;

    instance
        .archive
        .add_file(&path, &archive_path, Default::default())
        .map_err(|e| format!("Faileds to add file: {e}"))?;

    instance
        .archive
        .flush()
        .map_err(|e| format!("Failed to flush archive: {e}"))?;

    let archive_path_buf = instance.path.clone();
    instance.archive = MutableArchive::open(&archive_path_buf)
        .map_err(|e| format!("Failed to reopen archive after write: {e}"))?;

    Ok(())
}
