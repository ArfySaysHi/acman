use crate::{
    pipeline::{context::DeployContext, step::DeployStep, steps::pack_mpq::PackMpqStep},
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
    let steps: Vec<Box<dyn DeployStep>> = vec![Box::new(PackMpqStep)];

    for step in steps {
        app.emit("deploy_progress", step.name()).ok();
        step.execute(&ctx).await?;
    }

    Ok(())
}
