use crate::types::structs::SharedAppState;
use std::path::PathBuf;
use wow_mpq::MutableArchive;

#[tauri::command]
pub async fn add_files(
    state: tauri::State<'_, SharedAppState>,
    id: u32,
    paths: Vec<PathBuf>,
    archive_paths: Vec<String>,
) -> Result<(), String> {
    let preloaded_files: Vec<(Vec<u8>, String)> = paths
        .iter()
        .zip(archive_paths)
        .map(|(path, archive_path)| {
            std::fs::read(path)
                .map(|bytes| (bytes, archive_path))
                .map_err(|e| format!("Failed to read file {}: {e}", path.display()))
        })
        .collect::<Result<_, _>>()?;

    let instance_mutex = {
        let guard = state.mpqs.read().await;
        guard.get(&id).cloned().ok_or("Failed to get MPQInstance")?
    };
    let mut instance = instance_mutex.lock().await;

    for (bytes, archive_path) in preloaded_files {
        let mut tmp = tempfile::NamedTempFile::new()
            .map_err(|e| format!("Failed to create temp file: {e}"))?;
        std::io::Write::write_all(&mut tmp, &bytes)
            .map_err(|e| format!("Failed to write temp file: {e}"))?;
        instance
            .archive
            .add_file(tmp.path(), &archive_path, Default::default())
            .map_err(|e| format!("Failed to add file to MPQ: {e}"))?;
    }

    instance
        .archive
        .flush()
        .map_err(|e| format!("Failed to flush files to disc: {e}"))?;

    let archive_path_buf = instance.path.clone();
    instance.archive = MutableArchive::open(&archive_path_buf)
        .map_err(|e| format!("Failed to reopen archive after write: {e}"))?;

    Ok(())
}
