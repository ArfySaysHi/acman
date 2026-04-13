use std::collections::HashMap;

use crate::types::structs::{MpqMetadata, SharedAppState};

#[tauri::command]
pub async fn list_mpqs(
    state: tauri::State<'_, SharedAppState>,
) -> Result<HashMap<u32, MpqMetadata>, String> {
    let mpqs = state.mpqs.read().await;

    let mut result: HashMap<u32, MpqMetadata> = HashMap::new();

    for (id, tab) in mpqs.iter() {
        let tab = tab.lock().await;

        result.insert(
            *id,
            MpqMetadata {
                path: tab.path.clone(),
                name: tab.name.clone(),
                dirty: tab.dirty,
            },
        );
    }

    Ok(result)
}
