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
    pub output_path: Option<PathBuf>,
}

pub type SharedAppState = Arc<AppState>;

#[allow(dead_code)]
#[derive(Clone, Debug, Serialize)]
pub struct DockerEvent {
    pub name: Option<String>,
    pub action: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpellTemplate {
    pub id: u32,
    pub name: String,
    pub description: String,
    pub icon_id: u32,
    pub school: Vec<SpellSchool>,
}

impl SpellTemplate {
    pub fn get_school_as_u32(&self) -> u32 {
        self.school
            .iter()
            .fold(0u32, |acc: u32, e| acc | e.to_mask())
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum SpellSchool {
    Physical,
    Holy,
    Fire,
    Nature,
    Frost,
    Shadow,
    Arcane,
}

impl SpellSchool {
    pub fn to_mask(&self) -> u32 {
        match self {
            SpellSchool::Physical => 1,
            SpellSchool::Holy => 2,
            SpellSchool::Fire => 4,
            SpellSchool::Nature => 8,
            SpellSchool::Frost => 16,
            SpellSchool::Shadow => 32,
            SpellSchool::Arcane => 64,
        }
    }
}
