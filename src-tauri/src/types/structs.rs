use bollard::Docker;
use std::path::PathBuf;
use std::pin::Pin;
use std::sync::Arc;
use tokio::io::AsyncWrite;
use tokio::sync::Mutex;

pub struct AppState {
    pub docker: Arc<Docker>,
    pub worldserver: Mutex<WorldServerState>,
    pub patch: Mutex<PatchState>,
}

pub struct WorldServerState {
    pub input: Option<Arc<Mutex<Pin<Box<dyn AsyncWrite + Send>>>>>,
    pub attached: bool,
}

pub struct PatchState {
    pub client_path: Option<PathBuf>,
    pub dbc_cache_path: Option<PathBuf>,
}

pub type SharedAppState = Arc<AppState>;
