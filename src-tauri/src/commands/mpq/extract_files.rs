use crate::types::structs::SharedAppState;
use std::path::PathBuf;

#[tauri::command]
pub async fn extract_files(
    state: tauri::State<'_, SharedAppState>,
    id: u32,
    path: PathBuf,
    file_paths: Vec<PathBuf>,
) -> Result<(), String> {
    let instance_guard = {
        let guard = state.mpqs.read().await;
        guard
            .get(&id)
            .cloned()
            .ok_or("Failed to open MPQInstance.")?
    };
    let mut instance = instance_guard.lock().await;

    let files_to_write: Vec<(PathBuf, Vec<u8>)> = file_paths
        .iter()
        .map(|file_path| {
            let bytes = instance
                .archive
                .read_file(&file_path.to_string_lossy())
                .map_err(|e| format!("Failed to read file from MPQ: {e}"))?;
            Ok((file_path.clone(), bytes))
        })
        .collect::<Result<Vec<_>, String>>()?;

    for (file_path, bytes) in files_to_write {
        let normalized: PathBuf = file_path
            .to_string_lossy()
            .replace('\\', "/")
            .split('/')
            .filter(|s| !s.is_empty())
            .collect();
        let dest = path.join(normalized);
        if let Some(parent) = dest.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directories: {e}"))?;
        }
        std::fs::write(&dest, &bytes).map_err(|e| format!("Failed to write file: {e}"))?;
    }

    Ok(())
}
