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

    {
        let mpqs = state.mpqs.read().await;
        for (id, tab) in mpqs.iter() {
            let tab = tab.lock().await;
            if tab.path == path {
                return Ok(*id);
            }
        }
    };

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
