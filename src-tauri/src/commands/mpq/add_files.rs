use crate::types::structs::SharedAppState;
use std::path::PathBuf;
use wow_mpq::MutableArchive;

// TODO: Major bug, this function deadlocks due to keeping mutex lock for an excessive amount of
// time, fix it me >:(
#[tauri::command]
pub async fn add_files(
    state: tauri::State<'_, SharedAppState>,
    id: u32,
    paths: Vec<PathBuf>,
    archive_paths: Vec<String>,
) -> Result<(), String> {
    let guard = state.mpqs.read().await;
    let instance_mutex = guard.get(&id).ok_or("Failed to get MPQInstance")?;
    let mut instance = instance_mutex.lock().await;

    for (path, archive_path) in paths.iter().zip(archive_paths) {
        instance
            .archive
            .add_file(path, &archive_path, Default::default())
            .map_err(|e| format!("Failed to add file to MPQ: {e}"))?;
    }

    instance
        .archive
        .flush()
        .map_err(|e| format!("Failed to flush files to disc: {e}"))?;

    let archive_path_buf = instance.path.clone();
    instance.archive = MutableArchive::open(&archive_path_buf)
        .map_err(|e| format!("Failed to reopen archive after write: {e}"))?;

    // TODO: Emit the added files to the frontend to update values

    Ok(())
}
