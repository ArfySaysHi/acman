use crate::{mpq::open_mpq, types::structs::SharedAppState};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use tokio::sync::oneshot;
use wow_mpq::ArchiveBuilder;

#[tauri::command]
pub async fn create_mpq(
    state: tauri::State<'_, SharedAppState>,
    app: AppHandle,
) -> Result<u32, String> {
    let state = state.inner().clone();

    let (tx, rx) = oneshot::channel::<Result<u32, String>>();

    app.dialog()
        .file()
        .set_title("Create MPQ archive")
        .set_file_name("patch.mpq")
        .save_file(move |path| {
            let Some(path) = path else {
                let _ = tx.send(Err("No file path selected".to_string()));
                return;
            };

            let file_path = path.to_string();
            let state = state.clone();

            tauri::async_runtime::spawn(async move {
                if let Err(e) = ArchiveBuilder::new().build(&file_path) {
                    let _ = tx.send(Err(format!("Failed to create MPQ: {e}")));
                    return;
                }

                match open_mpq(state, file_path).await {
                    Ok(id) => {
                        let _ = tx.send(Ok(id));
                    }
                    Err(e) => {
                        let _ = tx.send(Err(format!("Failed to open MPQ: {e}")));
                    }
                }
            });
        });

    rx.await
        .map_err(|_| "Dialog closed without a response".to_string())?
}
