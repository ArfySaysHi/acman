use crate::mpq;
use crate::types::structs::SharedAppState;

#[tauri::command]
pub async fn open_mpq(
    state: tauri::State<'_, SharedAppState>,
    path: String,
) -> Result<u32, String> {
    let state = state.inner().clone();
    mpq::open_mpq(state, path).await
}
