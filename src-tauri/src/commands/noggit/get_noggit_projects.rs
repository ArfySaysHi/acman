use crate::types::structs::SharedAppState;

#[tauri::command]
pub async fn get_noggit_projects(
    state: tauri::State<'_, SharedAppState>,
) -> Result<Vec<String>, String> {
    let path = {
        let guard = state.settings.lock().await;
        guard
            .noggit_projects_path
            .clone()
            .ok_or("No noggit projects path configured")
    }
    .map_err(|e| e.to_string())?;

    let reader = std::fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory at set noggit projects path: {e}"))?;

    reader
        .map(|entry| {
            entry
                .map_err(|e| format!("Failed to read directory entry: {e}"))
                .map(|e| path.join(e.file_name()).to_string_lossy().to_string())
        })
        .collect()
}
