use std::path::PathBuf;

use crate::helpers::patch_helper;
use crate::types::structs::SharedAppState;

#[tauri::command]
pub async fn deploy_to_client(
    state: tauri::State<'_, SharedAppState>,
    input_dir: PathBuf,
    patch_name: String,
) -> Result<(), String> {
    let output_path = {
        let settings = state.settings.lock().await;
        settings
            .client_path
            .clone()
            .ok_or("No output path configured in settings")?
    };
    let output_file = output_path.join(format!("Data/{}", patch_name));

    patch_helper::path_to_mpq(input_dir, output_file)
}
