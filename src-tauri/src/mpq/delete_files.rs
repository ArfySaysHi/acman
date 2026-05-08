use crate::types::structs::SharedAppState;

pub async fn delete_files(
    state: SharedAppState,
    id: u32,
    paths: Vec<String>,
) -> Result<(), String> {
    let arc = {
        let mpqs = state.mpqs.read().await;
        mpqs.get(&id).cloned().ok_or("Could not find MPQInstance")?
    };

    let mut instance = arc.lock().await;

    for path in &paths {
        instance
            .archive
            .remove_file(path)
            .map_err(|e| format!("Failed to delete file '{path}': {e}"))?;
    }

    instance.flush_and_reopen()
}
