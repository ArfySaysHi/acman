use crate::commands::deploy::get_steps;

#[tauri::command]
pub async fn get_pipeline_steps() -> Vec<String> {
    get_steps().iter().map(|s| s.name().to_owned()).collect()
}
