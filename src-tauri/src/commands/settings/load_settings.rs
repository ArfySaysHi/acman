use crate::helpers::config_helper;
use serde_json::to_string;
use tauri::AppHandle;

#[tauri::command]
pub fn load_settings(app: AppHandle) -> Result<String, String> {
    let settings = config_helper::load_settings(&app)?;
    let settings_string = to_string(&settings).map_err(|e| e.to_string())?;

    Ok(settings_string)
}
