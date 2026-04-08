use bollard::Docker;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::pin::Pin;
use std::sync::Arc;
use tokio::io::AsyncWrite;
use tokio::sync::Mutex;

#[allow(dead_code)]
pub struct AppState {
    pub docker: Arc<Docker>,
    pub worldserver: Mutex<WorldServerState>,
    pub settings: Mutex<Settings>,
}

#[allow(dead_code)]
pub struct WorldServerState {
    pub input: Option<Arc<Mutex<Pin<Box<dyn AsyncWrite + Send>>>>>,
    pub attached: bool,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Settings {
    pub client_path: Option<PathBuf>,
}

pub type SharedAppState = Arc<AppState>;

#[allow(dead_code)]
#[derive(Clone, Debug, Serialize)]
pub struct DockerEvent {
    pub name: Option<String>,
    pub action: Option<String>,
}
