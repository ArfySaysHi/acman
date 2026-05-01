use crate::{
    pipeline::{
        context::DeployContext,
        step::DeployStep,
        steps::{
            deploy_dbc_to_server::DeployDbcToServerStep,
            deploy_noggit_project_to_client::DeployNoggitProjectToClientStep,
            pack_mpq::PackMpqStep, restart_world_server::RestartWorldserverStep,
        },
    },
    types::structs::SharedAppState,
};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Clone)]
struct StepProgress {
    name: String,
    status: String,
}

#[tauri::command]
pub async fn deploy_noggit_project(
    state: tauri::State<'_, SharedAppState>,
    app: AppHandle,
    project_name: String,
    patch_name: String,
) -> Result<(), String> {
    let ctx = DeployContext::from_state(&state, project_name, patch_name).await?;
    let steps: Vec<Box<dyn DeployStep>> = vec![
        Box::new(PackMpqStep),
        Box::new(DeployNoggitProjectToClientStep),
        Box::new(DeployDbcToServerStep),
        Box::new(RestartWorldserverStep),
    ];

    for step in steps {
        app.emit(
            "deploy_progress",
            StepProgress {
                name: step.name().to_string(),
                status: "active".to_string(),
            },
        )
        .ok();

        match step.execute(&ctx).await {
            Ok(()) => {
                app.emit(
                    "deploy_progress",
                    StepProgress {
                        name: step.name().to_string(),
                        status: "done".to_string(),
                    },
                )
                .ok();
            }
            Err(err) => {
                app.emit(
                    "deploy_progress",
                    StepProgress {
                        name: step.name().to_string(),
                        status: "error".to_string(),
                    },
                )
                .ok();
                return Err(err.to_string());
            }
        }
    }

    Ok(())
}
