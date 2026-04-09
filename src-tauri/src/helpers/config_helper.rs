use std::path::PathBuf;

use crate::types::structs::Settings;
use serde_json::from_str;
use tauri::{AppHandle, Manager};

fn get_settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;

    if !config_dir.exists() {
        std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }

    Ok(config_dir.join("settings.json"))
}

pub fn load_settings(app: &AppHandle) -> Result<Settings, String> {
    let file_path = get_settings_path(app)?;

    if !file_path.exists() {
        return Ok(Settings::default());
    }

    let raw = std::fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let settings: Settings = from_str(&raw).map_err(|e| e.to_string())?;

    Ok(settings)
}

pub fn save_settings(app: &AppHandle, new_settings: &Settings) -> Result<(), String> {
    let file_path = get_settings_path(app)?;
    let json = serde_json::to_string_pretty(&new_settings).map_err(|e| e.to_string())?;
    std::fs::write(file_path, json).map_err(|e| e.to_string())?;
    Ok(())
}
