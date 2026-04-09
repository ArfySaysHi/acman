use bollard::Docker;
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

mod types;
use types::structs::*;

mod commands;
use commands::docker::*;
use commands::patch::*;
use commands::settings::*;
use commands::spells::*;
use commands::worldserver::*;

use crate::helpers::config_helper;

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

    let settings = Mutex::new(Settings {
        client_path: None,
        output_path: None,
    });

    let state = Arc::new(AppState {
        docker: docker,
        worldserver: worldserver,
        settings: settings,
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(state)
        .setup(|app| {
            let state = app.state::<SharedAppState>();
            let res = config_helper::load_settings(app.app_handle())?;
            tauri::async_runtime::block_on(async { *state.settings.lock().await = res });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_docker_event_stream,
            attach_worldserver,
            send_ws_command,
            load_settings,
            save_settings,
            path_to_mpq,
            generate_spell_sql
        ])
        .run(tauri::generate_context!())
        .expect("Error running Tauri");
}
