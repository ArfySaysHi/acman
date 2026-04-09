use crate::types::structs::SpellTemplate;

pub fn generate_spell_insert(spell: &SpellTemplate) -> String {
    format!(
        "INSERT INTO spell_template \
             (id, name, description, schoolMask, spellIconID) \
             VALUES ({}, '{}', '{}', {}, {});",
        spell.id,
        escape_sql(&spell.name),
        escape_sql(&spell.description),
        spell.get_school_as_u32(),
        spell.icon_id
    )
}

fn escape_sql(s: &str) -> String {
    s.replace('\'', "''")
}
