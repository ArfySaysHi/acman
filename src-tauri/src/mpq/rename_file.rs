use crate::types::structs::SharedAppState;

pub async fn rename_file(
    state: SharedAppState,
    id: u32,
    old_name: String,
    new_name: String,
) -> Result<(), String> {
    let instance_mutex = {
        let guard = state.mpqs.read().await;
        guard.get(&id).cloned().ok_or("Failed to get MPQInstance")?
    };
    let mut instance = instance_mutex.lock().await;
    instance
        .archive
        .rename_file(&old_name, &new_name)
        .map_err(|e| format!("Failed to rename file: {e}"))?;

    Ok(())
}
