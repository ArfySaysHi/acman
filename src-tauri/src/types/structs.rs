use bollard::Docker;
use std::pin::Pin;
use std::sync::Arc;
use tokio::io::AsyncWrite;
use tokio::sync::Mutex;

pub struct WorldServer {
    pub input: Option<Arc<Mutex<Pin<Box<dyn AsyncWrite + Send>>>>>,
    pub attached: bool,
    pub attaching: bool,
}

pub struct ConsoleState {
    pub docker: Docker,
    pub worldserver: WorldServer,
}

pub type SharedState = Arc<Mutex<ConsoleState>>;
