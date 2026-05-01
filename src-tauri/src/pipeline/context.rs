use crate::types::structs::SharedAppState;
use std::{path::PathBuf, sync::Arc};

pub struct DeployContext {
    pub client_path: PathBuf,
    pub server_path: PathBuf,
    pub noggit_projects_path: PathBuf,
    pub project_name: String,
    pub patch_name: String,
    pub docker: Arc<bollard::Docker>,
}

impl DeployContext {
    pub async fn from_state(
        state: &SharedAppState,
        project_name: String,
        patch_name: String,
    ) -> Result<Self, String> {
        let settings_guard = state.settings.lock().await;
        Ok(Self {
            client_path: settings_guard
                .client_path
                .clone()
                .ok_or("No client path configured")?,
            server_path: settings_guard
                .server_path
                .clone()
                .ok_or("No server data path configured")?,
            noggit_projects_path: settings_guard
                .noggit_projects_path
                .clone()
                .ok_or("No noggit projects path configured")?,
            project_name,
            patch_name,
            docker: state.docker.clone(),
        })
    }
}
