use crate::types::structs::{MpqInstance, MpqMetadata, SharedAppState};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::Mutex;
use tracing::info;

#[tauri::command]
pub async fn list_mpqs(
    state: tauri::State<'_, SharedAppState>,
) -> Result<HashMap<u32, MpqMetadata>, String> {
    info!("list_mpq called");
    let instances: Vec<(u32, Arc<Mutex<MpqInstance>>)> = {
        let mpqs = state.mpqs.read().await;
        mpqs.iter().map(|(id, arc)| (*id, arc.clone())).collect()
    };

    let mut result: HashMap<u32, MpqMetadata> = HashMap::new();
    for (id, arc) in instances {
        let mpq = arc.lock().await;

        result.insert(
            id,
            MpqMetadata {
                path: mpq.path.clone(),
                name: mpq.name.clone(),
            },
        );
    }

    info!(mpq_list=?result, "list_mpq success");

    Ok(result)
}
