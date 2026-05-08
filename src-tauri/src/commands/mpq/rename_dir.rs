use crate::types::structs::SharedAppState;
use tauri::State;

#[tauri::command]
pub async fn rename_dir(
    state: State<'_, SharedAppState>,
    id: u32,
    old_prefix: String,
    new_prefix: String,
) -> Result<(), String> {
    let instance_mutex = {
        let guard = state.mpqs.read().await;
        guard.get(&id).cloned().ok_or("Failed to get MPQInstance")?
    };

    let mut instance = instance_mutex.lock().await;

    let files_to_rename: Vec<String> = instance
        .archive
        .list()
        .map_err(|e| e.to_string())?
        .into_iter()
        .filter(|entry| entry.name.starts_with(&old_prefix))
        .map(|entry| entry.name)
        .collect();

    for old_name in files_to_rename {
        let new_name = format!("{}{}", new_prefix, &old_name[old_prefix.len()..]);
        instance
            .archive
            .rename_file(&old_name, &new_name)
            .map_err(|e| format!("Failed to rename {old_name}: {e}"))?;
    }

    instance.flush_and_reopen()
}
