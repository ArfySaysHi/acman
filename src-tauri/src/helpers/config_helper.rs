use crate::types::structs::Settings;
use serde_json::from_str;
use tauri::{AppHandle, Manager};

pub fn load_settings(app: &AppHandle) -> Result<Settings, String> {
    let config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;

    if !config_dir.exists() {
        std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }

    let file_path = config_dir.join("settings.json");

    if !file_path.exists() {
        return Ok(Settings::default());
    }

    let raw = std::fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let settings: Settings = from_str(&raw).map_err(|e| e.to_string())?;

    Ok(settings)
}
