use crate::types::structs::{FileEntry, SharedAppState};

#[tauri::command]
pub async fn list_files(
    state: tauri::State<'_, SharedAppState>,
    id: u32,
) -> Result<Vec<FileEntry>, String> {
    let tab = {
        let mpqs = state.mpqs.read().await;
        mpqs.get(&id).cloned().ok_or("Invalid MPQ id")?
    };
    let mut mpq = tab.lock().await;
    let entries = mpq.archive.list().map_err(|e| e.to_string())?;

    Ok(entries.into_iter().map(Into::into).collect())
}
