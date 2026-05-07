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
    let path_len = paths.len();
    let temps = tokio::task::spawn_blocking(move || {
        paths
            .iter()
            .zip(archive_paths)
            .map(|(path, archive_path)| {
                let bytes = std::fs::read(path)
                    .map_err(|e| format!("Failed to read {}: {e}", path.display()))?;
                let mut tmp = tempfile::NamedTempFile::new()
                    .map_err(|e| format!("Failed to create temp file: {e}"))?;
                std::io::Write::write_all(&mut tmp, &bytes)
                    .map_err(|e| format!("Failed to write temp file: {e}"))?;
                Ok::<_, String>((tmp, archive_path))
            })
            .collect::<Result<Vec<_>, _>>()
    })
    .await
    .map_err(|e| format!("spawn_blocking failed: {e}"))??;

    let instance_mutex = {
        let guard = state.mpqs.read().await;
        guard.get(&id).cloned().ok_or("Failed to get MPQInstance")?
    };

    println!("add_files called, id={}, file_count={}", id, path_len);
    tokio::task::spawn_blocking(move || {
        println!("spawn_blocking entered");
        let mut instance = instance_mutex.blocking_lock();
        println!("lock acquired");
        for (i, (tmp, archive_path)) in temps.iter().enumerate() {
            println!("adding file {}/{}: {}", i + 1, temps.len(), archive_path);
            instance
                .archive
                .add_file(tmp.path(), archive_path, Default::default())
                .map_err(|e| format!("Failed to add file to MPQ: {e}"))?;
        }
        println!("all files added, flushing");

        instance
            .archive
            .flush()
            .map_err(|e| format!("Failed to flush: {e}"))?;

        instance.archive = MutableArchive::open(&instance.path)
            .map_err(|e| format!("Failed to reopen archive: {e}"))?;

        Ok::<_, String>(())
    })
    .await
    .map_err(|e| format!("spawn_blocking failed: {e}"))?
}
