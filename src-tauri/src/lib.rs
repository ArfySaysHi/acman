use bollard::Docker;
use std::collections::HashMap;
use std::sync::atomic::AtomicU32;
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;
use tokio::sync::RwLock;

mod commands;
use commands::deploy::*;
use commands::docker::*;
use commands::mpq::*;
use commands::noggit::*;
use commands::settings::*;
use commands::spells::*;
use commands::worldserver::*;

mod helpers;
use crate::helpers::config_helper;

mod types;
use types::structs::*;

mod dbc;
mod mpq;
mod pipeline;

pub fn run() {
    tracing_subscriber::fmt().init();

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
        noggit_projects_path: None,
        server_path: None,
    });

    let state = Arc::new(AppState {
        docker: docker,
        worldserver: worldserver,
        settings: settings,
        mpqs: RwLock::new(HashMap::new()),
        next_mpq_id: AtomicU32::new(1),
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(state)
        .setup(|app| {
            let state = app.state::<SharedAppState>();
            // TODO: Rewrite this into a helper function to update local settings state or just delete backend settings entirely
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
            generate_spell_sql,
            open_mpq,
            close_mpq,
            list_files,
            list_mpqs,
            add_file,
            add_files,
            create_mpq,
            rename_file,
            delete_file,
            delete_files,
            read_dbc,
            get_noggit_projects,
            deploy_noggit_project
        ])
        .run(tauri::generate_context!())
        .expect("Error running Tauri");
}
