#[tauri::command]
pub async fn get_pipeline_steps() -> Vec<String> {
    vec![
        "Pack MPQ".to_owned(),
        "Deploy Noggit Project To Client".to_owned(),
        "Deploy Dbc To Server".to_owned(),
        "Restart Worldserver".to_owned(),
    ]
}
