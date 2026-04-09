use crate::helpers::patch_helper;

#[tauri::command]
pub fn path_to_mpq(path: std::path::PathBuf) -> Result<(), String> {
    patch_helper::path_to_mpq(path)
}
