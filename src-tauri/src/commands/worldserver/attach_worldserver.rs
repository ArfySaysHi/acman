use crate::helpers::string_helper::*;
use crate::types::structs::*;
use bollard::container::LogOutput;
use bollard::query_parameters::AttachContainerOptionsBuilder;
use bollard::{container::AttachContainerResults, query_parameters::AttachContainerOptions};
use futures_util::{Stream, StreamExt};
use std::pin::Pin;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;

fn get_options() -> AttachContainerOptions {
    AttachContainerOptionsBuilder::default()
        .stdin(true)
        .stdout(true)
        .stderr(true)
        .stream(true)
        .build()
}

fn extract_message(msg: LogOutput) -> String {
    match msg {
        LogOutput::StdOut { message }
        | LogOutput::StdErr { message }
        | LogOutput::Console { message }
        | LogOutput::StdIn { message } => String::from_utf8_lossy(&message).to_string(),
    }
}

fn spawn_worldserver_output_thread(
    app: AppHandle,
    mut output: Pin<
        Box<dyn Stream<Item = Result<LogOutput, bollard::errors::Error>> + Send + 'static>,
    >,
    state: Arc<AppState>,
) {
    let app_clone = app.clone();
    tokio::spawn(async move {
        let mut buffer = String::new();
        let mut last_line = String::new();

        while let Some(Ok(msg)) = output.next().await {
            let part = extract_message(msg);
            buffer.push_str(&part);

            while let Some(pos) = buffer.find('\n') {
                let raw_line: String = buffer.drain(..=pos).collect();
                let cleaned = strip_ansi(&raw_line);
                let normalized = cleaned.split_whitespace().collect::<Vec<_>>().join(" ");

                if !normalized.is_empty() && normalized != last_line {
                    let _ = app_clone.emit("worldserver-output", normalized.clone());
                    last_line = normalized;
                }
            }
        }

        let mut guard = state.worldserver.lock().await;
        guard.attached = false;
        guard.input = None;
    });
}

#[tauri::command]
pub async fn attach_worldserver(
    app: AppHandle,
    state: State<'_, SharedAppState>,
) -> Result<(), String> {
    let mut guard = state.worldserver.lock().await;

    // Optional: prevent re-attaching if already attached
    if guard.attached {
        println!("Already attached, skipping");
        return Ok(());
    }

    let docker = state.docker.clone();

    let AttachContainerResults { output, input } = docker
        .attach_container("ac-worldserver", Some(get_options()))
        .await
        .map_err(|e| e.to_string())?;

    let shared_input = Arc::new(Mutex::new(input));

    // You can spawn this without holding the lock since it doesn't need `guard`
    spawn_worldserver_output_thread(app, output, Arc::clone(state.inner()));

    // Still holding the lock here → safe
    guard.input = Some(shared_input);
    guard.attached = true;

    Ok(())
}
