use std::{
    path::PathBuf,
    str::FromStr,
    sync::{atomic::Ordering, Arc},
};

use tokio::sync::Mutex;
use wow_mpq::Archive;

use crate::types::structs::{MpqInstance, SharedAppState};

#[tauri::command]
pub async fn open_mpq(
    state: tauri::State<'_, SharedAppState>,
    path: String,
) -> Result<u32, String> {
    let archive = Archive::open(&path).map_err(|e| e.to_string())?;
    let mut mpqs = state.mpqs.lock().await;
    let id = state.next_mpq_id.fetch_add(1, Ordering::Relaxed);
    let path = PathBuf::from_str(&path).map_err(|e| e.to_string())?;
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Unknown filename".to_string())?
        .to_string();

    mpqs.insert(
        id,
        Arc::new(Mutex::new(MpqInstance {
            archive,
            path,
            dirty: false,
            name,
        })),
    );

    Ok(id)
}
