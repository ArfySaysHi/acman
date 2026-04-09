use crate::helpers::sql_helper::generate_spell_insert;
use crate::types::structs::{SharedAppState, SpellTemplate};

#[tauri::command]
pub async fn generate_spell_sql(
    spell: SpellTemplate,
    state: tauri::State<'_, SharedAppState>,
) -> Result<String, String> {
    let settings = {
        let patch = state.settings.lock().await;
        patch
            .output_path
            .clone()
            .ok_or("No output path configured.")?
    };

    let sql = generate_spell_insert(&spell);
    let file_name = format!("spell_{}.sql", spell.id);
    let file_path = settings.join(&file_name);
    std::fs::write(&file_path, sql).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().into_owned())
}
