use crate::types::structs::SharedAppState;
use tauri::State;
use wow_mpq::MutableArchive;

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
        .filter(|entry| {
            entry
                .name
                .to_lowercase()
                .starts_with(&old_prefix.to_lowercase())
        })
        .map(|entry| entry.name)
        .collect();

    for old_name in files_to_rename {
        let new_name = format!("{}{}", new_prefix, &old_name[old_prefix.len()..]);
        instance
            .archive
            .rename_file(&old_name, &new_name)
            .map_err(|e| format!("Failed to rename {old_name}: {e}"))?;
    }

    instance
        .archive
        .flush()
        .map_err(|e| format!("Failed to flush files to disc: {e}"))?;

    let archive_path_buf = instance.path.clone();
    instance.archive = MutableArchive::open(&archive_path_buf)
        .map_err(|e| format!("Failed to reopen archive after write: {e}"))?;

    Ok(())
}
