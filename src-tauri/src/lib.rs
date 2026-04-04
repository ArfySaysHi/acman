use bollard::container::AttachContainerResults;
use bollard::query_parameters::{AttachContainerOptionsBuilder, EventsOptions};
use bollard::Docker;
use futures_util::StreamExt;
use regex::Regex;
use serde::Serialize;
use std::collections::HashMap;
use std::pin::Pin;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::{AsyncWrite, AsyncWriteExt};
use tokio::sync::Mutex;

/// A single active console connection to WorldServer
struct WorldServer {
    input: Option<Pin<Box<dyn AsyncWrite + Send>>>,
    attached: bool, // ensures only one reader
}

/// Application-wide console state
struct ConsoleState {
    docker: Docker,
    worldserver: Option<WorldServer>,
}

type SharedState = Arc<Mutex<ConsoleState>>;

/// Remove ANSI escape sequences
fn strip_ansi(s: &str) -> String {
    let re = Regex::new(r"\x1b\[[0-?]*[ -/]*[@-~]").unwrap();
    re.replace_all(s, "").into_owned()
}

/// Attach to WorldServer container, only spawns one reader
#[tauri::command]
async fn attach_worldserver(
    app: AppHandle,
    state: tauri::State<'_, SharedState>,
) -> Result<(), String> {
    let docker = {
        let guard = state.lock().await;

        if guard
            .worldserver
            .as_ref()
            .map(|ws| ws.attached)
            .unwrap_or(false)
        {
            return Ok(()); // Already attached
        }

        guard.docker.clone()
    };

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

    // Spawn a single reader
    let app_clone = app.clone();
    tokio::spawn(async move {
        while let Some(Ok(msg)) = output.next().await {
            let _ = app_clone.emit("console-output", strip_ansi(&msg.to_string()));
        }
    });

    // Store input handle and mark as attached
    let mut guard = state.lock().await;
    guard.worldserver = Some(WorldServer {
        input: Some(input),
        attached: true,
    });

    Ok(())
}

/// Send a command to the WorldServer console
#[tauri::command]
async fn send_command(command: String, state: tauri::State<'_, SharedState>) -> Result<(), String> {
    let input = {
        let mut guard = state.lock().await;
        let ws = guard
            .worldserver
            .as_mut()
            .ok_or_else(|| "Must connect to worldserver first".to_string())?;
        ws.input.take() // temporarily take ownership
    };

    if let Some(mut input) = input {
        input
            .write_all(format!("{}\n", command).as_bytes())
            .await
            .map_err(|e| e.to_string())?;

        // Return input back to state
        let mut guard = state.lock().await;
        guard.worldserver.as_mut().unwrap().input = Some(input);
        Ok(())
    } else {
        Err("No input stream available.".into())
    }
}

/// Initialize Docker client
fn default_state() -> Result<Arc<Mutex<ConsoleState>>, String> {
    let docker = Docker::connect_with_local_defaults().map_err(|e| e.to_string())?;
    Ok(Arc::new(Mutex::new(ConsoleState {
        docker,
        worldserver: None,
    })))
}

/// Structured Docker events
#[derive(Clone, Serialize, Debug)]
struct DockerEvent {
    container_name: String,
    container_id: String,
    action: String,
}
pub fn establish_docker_events_stream(app: AppHandle, docker: Docker) {
    let mut stream = docker.events(Some(EventsOptions {
        since: None,
        until: None,
        filters: Some(HashMap::new()),
    }));

    tokio::spawn(async move {
        while let Some(event_result) = stream.next().await {
            match event_result {
                Ok(event) => {
                    let (name, id) = if let Some(actor) = &event.actor {
                        let name = actor
                            .attributes
                            .as_ref()
                            .and_then(|attrs| attrs.get("name"))
                            .cloned()
                            .unwrap_or_else(|| "unknown".into());
                        let id = actor.id.clone().unwrap_or_default();
                        (name, id)
                    } else {
                        ("unknown".into(), "unknown".into())
                    };

                    let action = event.action.unwrap_or_else(|| "unknown".into());

                    // Format as string for frontend
                    let payload = format!(
                        "[DockerEvent] {} ({}) → {}",
                        name,
                        &id[..12.min(id.len())],
                        action
                    );

                    println!("{}", payload); // optional debug
                    let _ = app.emit("docker-event", payload);
                }
                Err(e) => eprintln!("Docker event error: {}", e),
            }
        }
    });
}

/// Main Tauri entrypoint
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state = default_state().expect("failed to initialize docker");

    tauri::Builder::default()
        .manage(state.clone())
        .setup(move |app| {
            let app_handle = app.app_handle().clone();
            let state = state.clone();

            tauri::async_runtime::spawn(async move {
                let docker = {
                    let guard = state.lock().await;
                    guard.docker.clone()
                };
                establish_docker_events_stream(app_handle, docker);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![attach_worldserver, send_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
