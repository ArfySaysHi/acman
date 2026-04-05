use bollard::Docker;
use std::sync::Arc;
use tokio::sync::Mutex;

mod types;
use types::structs::*;

mod commands;
use commands::worldserver::*;

mod helpers;

pub fn run() {
    let state = Arc::new(Mutex::new(ConsoleState {
        docker: Docker::connect_with_local_defaults().unwrap(),
        worldserver: WorldServer {
            input: None,
            attached: false,
            attaching: false,
        },
    }));

    tauri::Builder::default()
        .manage(state.clone())
        .invoke_handler(tauri::generate_handler![
            attach_worldserver,
            send_ws_command
        ])
        .run(tauri::generate_context!())
        .expect("Error running Tauri");
}
