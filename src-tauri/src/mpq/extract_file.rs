use crate::types::structs::SharedAppState;

pub async fn extract_file(state: SharedAppState, id: u32, path: String) -> Result<Vec<u8>, String> {
    let instance_guard = {
        let guard = state.mpqs.read().await;
        guard
            .get(&id)
            .cloned()
            .ok_or("Failed to open MPQInstance.")?
    };
    let mut instance = instance_guard.lock().await;

    instance
        .archive
        .read_file(&path)
        .map_err(|e| format!("Failed to read file from MPQ: {e}"))
}
