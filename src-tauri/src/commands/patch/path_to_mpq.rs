use crate::helpers::patch_helper;
use crate::types::structs::SharedAppState;
use std::path::PathBuf;

#[tauri::command]
pub async fn path_to_mpq(
    state: tauri::State<'_, SharedAppState>,
    path: PathBuf,
) -> Result<(), String> {
    let output_path = {
        let settings = state.settings.lock().await;
        settings
            .output_path
            .clone()
            .ok_or("No output path configured in settings")?
    };

    let archive_name = path
        .file_name()
        .map(|n| format!("{}.mpq", n.to_string_lossy()))
        .unwrap_or_else(|| "output.mpq".to_string());

    let output_file = output_path.join(archive_name);

    patch_helper::path_to_mpq(path, output_file)
}
