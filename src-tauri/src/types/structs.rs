use bollard::Docker;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::pin::Pin;
use std::sync::atomic::AtomicU32;
use std::sync::Arc;
use tokio::io::AsyncWrite;
use tokio::sync::{Mutex, RwLock};
use wow_mpq::MutableArchive;

pub struct AppState {
    pub docker: Arc<Docker>,
    pub worldserver: Mutex<WorldServerState>,
    pub settings: Mutex<Settings>,
    pub mpqs: RwLock<HashMap<u32, Arc<Mutex<MpqInstance>>>>,
    pub next_mpq_id: AtomicU32,
}

pub struct MpqInstance {
    pub archive: MutableArchive,
    pub path: PathBuf,
    pub name: String,
    pub dirty: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MpqMetadata {
    pub path: PathBuf,
    pub name: String,
    pub dirty: bool,
}

pub type ArcMutexPinBoxFuture = Arc<Mutex<Pin<Box<dyn AsyncWrite + Send>>>>;

pub struct WorldServerState {
    pub input: Option<ArcMutexPinBoxFuture>,
    pub attached: bool,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Settings {
    pub client_path: Option<PathBuf>,
    pub output_path: Option<PathBuf>,
    pub noggit_projects_path: Option<PathBuf>,
    pub server_path: Option<PathBuf>,
}

pub type SharedAppState = Arc<AppState>;

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub size: u64,
    pub compressed_size: u64,
    pub flags: u32,
    pub hashes: Option<(u32, u32)>,
    pub table_indices: Option<(usize, Option<usize>)>,
}

impl From<wow_mpq::FileEntry> for FileEntry {
    fn from(fe: wow_mpq::FileEntry) -> Self {
        Self {
            name: fe.name,
            size: fe.size,
            compressed_size: fe.compressed_size,
            flags: fe.flags,
            hashes: fe.hashes,
            table_indices: fe.table_indices,
        }
    }
}
