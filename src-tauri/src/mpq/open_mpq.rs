use crate::types::structs::{MpqInstance, SharedAppState};
use std::{
    path::PathBuf,
    str::FromStr,
    sync::{atomic::Ordering, Arc},
};
use tokio::sync::Mutex;
use wow_mpq::MutableArchive;

pub async fn open_mpq(state: SharedAppState, path: String) -> Result<u32, String> {
    let path = PathBuf::from_str(&path).map_err(|e| e.to_string())?;
    let instances: Vec<(u32, Arc<Mutex<MpqInstance>>)> = {
        let mpqs = state.mpqs.read().await;
        mpqs.iter().map(|(id, arc)| (*id, arc.clone())).collect()
    };

    for (id, arc) in instances {
        let mpq = arc.lock().await;
        if mpq.path == path {
            return Ok(id);
        }
    }

    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Unknown filename".to_string())?
        .to_string();

    let archive = MutableArchive::open(&path).map_err(|e| e.to_string())?;
    let id = state.next_mpq_id.fetch_add(1, Ordering::Relaxed);

    {
        let mut mpqs = state.mpqs.write().await;
        mpqs.insert(
            id,
            Arc::new(Mutex::new(MpqInstance {
                archive,
                path,
                dirty: false,
                name,
            })),
        );
    }

    Ok(id)
}
