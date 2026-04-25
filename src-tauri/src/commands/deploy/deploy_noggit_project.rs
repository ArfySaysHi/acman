use crate::{
    pipeline::{
        context::DeployContext,
        step::DeployStep,
        steps::{
            deploy_map_dbc_to_server::DeployMapDbcToServer,
            deploy_noggit_project_to_client::DeployNoggitProjectToClientStep,
            pack_mpq::PackMpqStep, restart_world_server::RestartWorldserver,
        },
    },
    types::structs::SharedAppState,
};
use tauri::{AppHandle, Emitter};

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
        Box::new(DeployMapDbcToServer),
        Box::new(RestartWorldserver),
    ];

    for step in steps {
        app.emit("deploy_progress", step.name()).ok();
        step.execute(&ctx).await?;
    }

    Ok(())
}
