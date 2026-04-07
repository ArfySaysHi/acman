use crate::helpers::string_helper::*;
use crate::types::structs::*;
use bollard::container::LogOutput;
use bollard::query_parameters::AttachContainerOptionsBuilder;
use bollard::{container::AttachContainerResults, query_parameters::AttachContainerOptions};
use futures_util::{Stream, StreamExt};
use std::pin::Pin;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::{Mutex, MutexGuard};

fn is_attaching(guard: &MutexGuard<'_, ConsoleState>) -> bool {
    guard.worldserver.attached || guard.worldserver.attaching
}

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
    state: Arc<Mutex<ConsoleState>>,
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
                let normalized = cleaned
                    .trim()
                    .split_whitespace()
                    .collect::<Vec<_>>()
                    .join(" ");

                if !normalized.is_empty() && normalized != last_line {
                    let _ = app_clone.emit("console-output", normalized.clone());
                    last_line = normalized;
                    println!("{:?}", last_line);
                }
            }
        }

        let mut guard = state.lock().await;
        guard.worldserver.attached = false;
        guard.worldserver.input = None;
    });
}

#[tauri::command]
pub async fn attach_worldserver(
    app: AppHandle,
    state: tauri::State<'_, SharedState>,
) -> Result<(), String> {
    let docker = {
        let mut guard = state.lock().await;
        if is_attaching(&guard) {
            return Ok(());
        }
        guard.worldserver.attaching = true;
        guard.docker.clone()
    };

    println!("Worldserver attach");

    let AttachContainerResults { output, input } = docker
        .attach_container("ac-worldserver", Some(get_options()))
        .await
        .map_err(|e| e.to_string())?;

    let shared_input = Arc::new(Mutex::new(input));
    spawn_worldserver_output_thread(app, output, Arc::clone(state.inner()));

    {
        let mut guard = state.lock().await;
        guard.worldserver.input = Some(shared_input);
        guard.worldserver.attached = true;
        guard.worldserver.attaching = false;
    }

    Ok(())
}
