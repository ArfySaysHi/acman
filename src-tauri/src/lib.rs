use bollard::Docker;
use std::sync::Arc;
use tokio::sync::Mutex;

mod types;
use types::structs::*;

mod commands;
use commands::docker::get_docker_event_stream::get_docker_event_stream;
use commands::worldserver::*;

mod helpers;

pub fn run() {
    let docker = Arc::new(
        Docker::connect_with_local_defaults()
            .expect("Failed to connect to Docker - is it running?"),
    );

    let worldserver = Mutex::new(WorldServerState {
        input: None,
        attached: false,
    });

    let patch = Mutex::new(PatchState {
        client_path: None,
        dbc_cache_path: None,
    });

    let state = Arc::new(AppState {
        docker: docker,
        worldserver: worldserver,
        patch: patch,
    });

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            get_docker_event_stream,
            attach_worldserver,
            send_ws_command
        ])
        .run(tauri::generate_context!())
        .expect("Error running Tauri");
}
