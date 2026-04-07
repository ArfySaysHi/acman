use crate::types::structs::*;
use bollard::query_parameters::EventsOptions;
use futures_util::stream::StreamExt;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub async fn get_docker_event_stream(
    app: AppHandle,
    state: State<'_, SharedAppState>,
) -> Result<(), String> {
    let docker = state.docker.clone();

    tokio::spawn(async move {
        let mut stream = docker.events(Some(EventsOptions {
            since: None,
            until: None,
            filters: None,
        }));

        while let Some(docker_event) = stream.next().await {
            match docker_event {
                Ok(ev) => {
                    let name = ev
                        .actor
                        .as_ref()
                        .and_then(|a| a.attributes.as_ref())
                        .and_then(|attrs| attrs.get("name").cloned());
                    let action = ev.action.clone();
                    let docker_event = DockerEvent { name, action };

                    if let Err(err) = app.emit("docker-event", docker_event) {
                        eprintln!("Failed to emit event: {:?}", err);
                    }
                }
                Err(err) => eprintln!("Docker stream error: {}", err),
            }
        }
    });

    Ok(())
}
