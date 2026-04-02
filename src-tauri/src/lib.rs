use bollard::Docker;
use bollard::container::AttachContainerResults;
use bollard::query_parameters::AttachContainerOptionsBuilder;
use futures_util::StreamExt;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncWrite, AsyncWriteExt};
use std::pin::Pin;
use std::sync::Arc;
use tokio::sync::Mutex;

struct ConsoleState {
    input: Option<Pin<Box<dyn AsyncWrite + Send>>>,
    attached: bool
}

type SharedState = Arc<Mutex<ConsoleState>>;

#[tauri::command]
async fn attach_console(
    app: AppHandle,
    state: tauri::State<'_, SharedState>,
) -> Result<(), String> {
    let mut guard = state.lock().await;

    if guard.attached {
        return Ok(());
    }

    let docker = Docker::connect_with_local_defaults()
        .map_err(|e| e.to_string())?;

    let options = AttachContainerOptionsBuilder::default()
        .stdin(true)
        .stdout(true)
        .stderr(true)
        .stream(true)
        .build();

    let AttachContainerResults { mut output, input } = docker
        .attach_container("ac-worldserver", Some(options))
        .await
        .map_err(|e| e.to_string())?;

    guard.input = Some(input);
    guard.attached = true;

    tokio::spawn(async move {
        while let Some(Ok(msg)) = output.next().await {
            let _ = app.emit("console-output", msg.to_string());
        }
    });

    Ok(())
}

#[tauri::command]
async fn send_command(
    command: String,
    state: tauri::State<'_, SharedState>,
) -> Result<(), String> {
    let mut guard = state.lock().await;

    if let Some(input) = guard.input.as_mut() {
        input
            .write_all(format!("{}\n", command).as_bytes())
            .await
            .map_err(|e| e.to_string())?;
    } else {
        return Err("Not attached to container. Call attach_console first.".into());
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Arc::new(Mutex::new(ConsoleState {
            input: None,
            attached: false,
        })))
        .invoke_handler(tauri::generate_handler![attach_console, send_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}