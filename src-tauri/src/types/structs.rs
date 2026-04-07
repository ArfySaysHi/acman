use bollard::Docker;
use serde::Serialize;
use std::path::PathBuf;
use std::pin::Pin;
use std::sync::Arc;
use tokio::io::AsyncWrite;
use tokio::sync::Mutex;

#[allow(dead_code)]
pub struct AppState {
    pub docker: Arc<Docker>,
    pub worldserver: Mutex<WorldServerState>,
    pub patch: Mutex<PatchState>,
}

#[allow(dead_code)]
pub struct WorldServerState {
    pub input: Option<Arc<Mutex<Pin<Box<dyn AsyncWrite + Send>>>>>,
    pub attached: bool,
}

#[allow(dead_code)]
pub struct PatchState {
    pub client_path: Option<PathBuf>,
    pub dbc_cache_path: Option<PathBuf>,
}

pub type SharedAppState = Arc<AppState>;

#[allow(dead_code)]
#[derive(Clone, Debug, Serialize)]
pub struct DockerEvent {
    pub name: Option<String>,
    pub action: Option<String>,
}
