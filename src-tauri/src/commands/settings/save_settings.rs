use crate::helpers::config_helper;
use crate::types::structs::Settings;
use tauri::AppHandle;

#[tauri::command]
pub fn save_settings(app: AppHandle, new_settings: Settings) -> Result<(), String> {
    config_helper::save_settings(&app, &new_settings)
}
