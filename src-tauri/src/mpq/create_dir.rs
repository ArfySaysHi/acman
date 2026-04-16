use crate::types::structs::SharedAppState;
use std::path::PathBuf;

pub async fn create_dir(state: SharedAppState, id: u32, path: PathBuf) -> Result<(), String> {
    let arc = {
        let mpqs = state.mpqs.read().await;
        mpqs.get(&id).cloned().ok_or("Could not find MPQInstance")?
    };

    let normalised = path
        .to_string_lossy()
        .trim_start_matches(['\\', '/'])
        .replace('/', "\\");
    let archive_path = format!("{normalised}\\.keep");

    let mut instance = arc.lock().await;
    let empty_file: Vec<u8> = vec![];
    instance
        .archive
        .add_file_data(&empty_file, &archive_path, Default::default())
        .map_err(|e| format!("Failed to create .keep placeholder: {e}"))?;

    instance
        .archive
        .flush()
        .map_err(|e| format!("Failed to flush archive: {e}"))?;

    let archive_path_buf = instance.path.clone();
    instance.archive = wow_mpq::MutableArchive::open(&archive_path_buf)
        .map_err(|e| format!("Failed to reopen archive: {e}"))?;

    instance.dirty = true;

    println!("File added successfully: {}", archive_path);

    Ok(())
}
