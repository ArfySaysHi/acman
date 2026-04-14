use crate::types::structs::SharedAppState;
use wow_mpq::MutableArchive;

#[tauri::command]
pub async fn add_file(
    state: tauri::State<'_, SharedAppState>,
    id: u32,
    path: String,
    archive_path: String,
) -> Result<(), String> {
    println!("{:?}", archive_path);
    let guard = state.mpqs.read().await;
    let instance_mutex = guard.get(&id).ok_or("Failed to get MPQInstance")?;
    let mut instance = instance_mutex.lock().await;

    instance
        .archive
        .add_file(&path, &archive_path, Default::default())
        .map_err(|e| e.to_string())?;
    instance.archive.flush().map_err(|e| e.to_string())?;

    let archive_path_buf = instance.path.clone();
    instance.archive = MutableArchive::open(&archive_path_buf).map_err(|e| e.to_string())?;

    Ok(())
}
