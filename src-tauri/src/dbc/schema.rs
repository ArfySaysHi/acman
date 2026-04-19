use wow_cdbc::{FieldType, Schema, SchemaField};

pub fn get_known_schema(dbc_name: &str) -> Option<Schema> {
    match dbc_name {
        "Spell" => Some(spell()),
        "Item" => Some(item()),
        "Map" => Some(map()),
        "AreaTable" => Some(area_table()),
        "ChrClasses" => Some(chr_classes()),
        "ChrRaces" => Some(chr_races()),
        "Talent" => Some(talent()),
        "TalentTab" => Some(talent_tab()),
        "SkillLine" => Some(skill_line()),
        "SkillLineAbility" => Some(skill_line_ability()),
        "SpellItemEnchantment" => Some(spell_item_enchantment()),
        "SpellCastTimes" => Some(spell_cast_times()),
        "SpellDuration" => Some(spell_duration()),
        "SpellRadius" => Some(spell_radius()),
        "SpellRange" => Some(spell_range()),
        "SpellIcon" => Some(spell_icon()),
        "SpellMechanic" => Some(spell_mechanic()),
        "SpellRuneCost" => Some(spell_rune_cost()),
        "SpellMissile" => Some(spell_missile()),
        "SpellFocusObject" => Some(spell_focus_object()),
        "SpellDispelType" => Some(spell_dispel_type()),
        "SpellCategory" => Some(spell_category()),
        "SpellShapeshiftForm" => Some(spell_shapeshift_form()),
        "SpellVisual" => Some(spell_visual()),
        "CreatureDisplayInfo" => Some(creature_display_info()),
        "CreatureModelData" => Some(creature_model_data()),
        "CreatureFamily" => Some(creature_family()),
        "CreatureType" => Some(creature_type()),
        "TaxiNodes" => Some(taxi_nodes()),
        "TaxiPath" => Some(taxi_path()),
        "TaxiPathNode" => Some(taxi_path_node()),
        "Faction" => Some(faction()),
        "FactionTemplate" => Some(faction_template()),
        "ItemDisplayInfo" => Some(item_display_info()),
        "ItemRandomProperties" => Some(item_random_properties()),
        "ItemSet" => Some(item_set()),
        "GemProperties" => Some(gem_properties()),
        "GlyphProperties" => Some(glyph_properties()),
        "Achievement" => Some(achievement()),
        "Achievement_Criteria" => Some(achievement_criteria()),
        "BattlemasterList" => Some(battlemaster_list()),
        "LFGDungeons" => Some(lfg_dungeons()),
        _ => None,
    }
}

fn field(name: &str, field_type: FieldType, array_size: Option<usize>) -> SchemaField {
    SchemaField {
        name: name.to_string(),
        field_type,
        is_array: array_size.is_some(),
        array_size,
    }
}

fn i(name: &str) -> SchemaField {
    field(name, FieldType::Int32, None)
}
fn u(name: &str) -> SchemaField {
    field(name, FieldType::UInt32, None)
}
fn f(name: &str) -> SchemaField {
    field(name, FieldType::Float32, None)
}
fn s(name: &str) -> SchemaField {
    field(name, FieldType::String, None)
}

fn arr_i(base: &str, count: usize) -> Vec<SchemaField> {
    (0..count)
        .map(|n| field(&format!("{base}_{n}"), FieldType::Int32, Some(count)))
        .collect()
}
fn arr_u(base: &str, count: usize) -> Vec<SchemaField> {
    (0..count)
        .map(|n| field(&format!("{base}_{n}"), FieldType::UInt32, Some(count)))
        .collect()
}
fn arr_f(base: &str, count: usize) -> Vec<SchemaField> {
    (0..count)
        .map(|n| field(&format!("{base}_{n}"), FieldType::Float32, Some(count)))
        .collect()
}
fn arr_s(base: &str, count: usize) -> Vec<SchemaField> {
    (0..count)
        .map(|n| field(&format!("{base}_{n}"), FieldType::String, Some(count)))
        .collect()
}

fn loc(base: &str) -> Vec<SchemaField> {
    let locales = [
        "enUS", "enGB", "koKR", "frFR", "deDE", "enCN", "zhCN", "enTW", "zhTW", "esES", "esMX",
        "ruRU", "ptPT", "ptBR", "itIT", "unk",
    ];
    let mut fields: Vec<SchemaField> = locales.iter().map(|l| s(&format!("{base}_{l}"))).collect();
    fields.push(u(&format!("{base}_flags")));
    fields
}

fn schema(name: &str, fields: Vec<SchemaField>) -> Schema {
    Schema {
        name: name.to_string(),
        fields,
        key_field_index: None,
        is_validated: false,
    }
}

fn spell() -> Schema {
    let mut f = vec![
        i("ID"),
        i("Category"),
        i("DispelType"),
        i("Mechanic"),
        i("Attributes"),
        i("AttributesEx"),
        i("AttributesExB"),
        i("AttributesExC"),
        i("AttributesExD"),
        i("AttributesExE"),
        i("AttributesExF"),
        i("AttributesExG"),
    ];
    f.extend(arr_i("ShapeshiftMask", 2));
    f.extend(arr_i("ShapeshiftExclude", 2));
    f.extend([
        i("Targets"),
        i("TargetCreatureType"),
        i("RequiresSpellFocus"),
        i("FacingCasterFlags"),
        i("CasterAuraState"),
        i("TargetAuraState"),
        i("ExcludeCasterAuraState"),
        i("ExcludeTargetAuraState"),
        i("CasterAuraSpell"),
        i("TargetAuraSpell"),
        i("ExcludeCasterAuraSpell"),
        i("ExcludeTargetAuraSpell"),
        i("CastingTimeIndex"),
        i("RecoveryTime"),
        i("CategoryRecoveryTime"),
        i("InterruptFlags"),
        i("AuraInterruptFlags"),
        i("ChannelInterruptFlags"),
        i("ProcTypeMask"),
        i("ProcChance"),
        i("ProcCharges"),
        i("MaxLevel"),
        i("BaseLevel"),
        i("SpellLevel"),
        i("DurationIndex"),
        i("PowerType"),
        i("ManaCost"),
        i("ManaCostPerLevel"),
        i("ManaPerSecond"),
        i("ManaPerSecondPerLevel"),
        i("RangeIndex"),
    ]);
    f.push(self::f("Speed"));
    f.extend([i("ModalNextSpell"), i("CumulativeAura")]);
    f.extend(arr_i("Totem", 2));
    f.extend(arr_i("Reagent", 8));
    f.extend(arr_i("ReagentCount", 8));
    f.extend([
        i("EquippedItemClass"),
        i("EquippedItemSubclass"),
        i("EquippedItemInvTypes"),
    ]);
    f.extend(arr_i("Effect", 3));
    f.extend(arr_i("EffectDieSides", 3));
    f.extend(arr_f("EffectRealPointsPerLevel", 3));
    f.extend(arr_i("EffectBasePoints", 3));
    f.extend(arr_i("EffectMechanic", 3));
    f.extend(arr_i("ImplicitTargetA", 3));
    f.extend(arr_i("ImplicitTargetB", 3));
    f.extend(arr_i("EffectRadiusIndex", 3));
    f.extend(arr_i("EffectAura", 3));
    f.extend(arr_i("EffectAuraPeriod", 3));
    f.extend(arr_f("EffectAmplitude", 3));
    f.extend(arr_i("EffectChainTargets", 3));
    f.extend(arr_i("EffectItemType", 3));
    f.extend(arr_i("EffectMiscValue", 3));
    f.extend(arr_i("EffectMiscValueB", 3));
    f.extend(arr_i("EffectTriggerSpell", 3));
    f.extend(arr_f("EffectPointsPerCombo", 3));
    f.extend(arr_i("EffectSpellClassMaskA", 3));
    f.extend(arr_i("EffectSpellClassMaskB", 3));
    f.extend(arr_i("EffectSpellClassMaskC", 3));
    f.extend(arr_i("SpellVisualID", 2));
    f.extend([i("SpellIconID"), i("ActiveIconID"), i("SpellPriority")]);
    f.extend(loc("Name"));
    f.extend(loc("NameSubtext"));
    f.extend(loc("Description"));
    f.extend(loc("AuraDescription"));
    f.extend([
        i("ManaCostPct"),
        i("StartRecoveryCategory"),
        i("StartRecoveryTime"),
        i("MaxTargetLevel"),
        i("SpellClassSet"),
    ]);
    f.extend(arr_i("SpellClassMask", 3));
    f.extend([
        i("MaxTargets"),
        i("DefenseType"),
        i("PreventionType"),
        i("StanceBarOrder"),
    ]);
    f.extend(arr_f("EffectChainAmplitude", 3));
    f.extend([
        i("MinFactionID"),
        i("MinReputation"),
        i("RequiredAuraVision"),
    ]);
    f.extend(arr_i("RequiredTotemCategoryID", 2));
    f.extend([
        i("RequiredAreasID"),
        i("SchoolMask"),
        i("RuneCostID"),
        i("SpellMissileID"),
        i("PowerDisplayID"),
    ]);
    f.extend(arr_f("EffectBonusCoefficient", 3));
    f.extend([i("DescriptionVariablesID"), i("Difficulty")]);
    schema("Spell", f)
}

fn item() -> Schema {
    schema(
        "Item",
        vec![
            i("ID"),
            i("ClassID"),
            i("SubclassID"),
            i("Sound_override_subclassID"),
            i("Material"),
            i("DisplayInfoID"),
            i("InventoryType"),
            i("SheatheType"),
        ],
    )
}

fn map() -> Schema {
    // 5 scalars + 17 (MapName loc) + 1 + 17 (MapDesc0 loc) + 17 (MapDesc1 loc) + 9 scalars = 66
    let mut fields = vec![
        i("ID"),           // 0
        s("Directory"),    // 1
        i("InstanceType"), // 2
        i("Flags"),        // 3
        i("PVP"),          // 4
    ];
    fields.extend(loc("MapName")); // 5-21  (16 strings + 1 flags = 17)
    fields.push(i("AreaTableID")); // 22
    fields.extend(loc("MapDescription0")); // 23-39 (17)
    fields.extend(loc("MapDescription1")); // 40-56 (17)
    fields.push(i("LoadingScreenID")); // 57
    fields.push(f("MinimapIconScale")); // 58
    fields.push(i("CorpseMapID")); // 59
    fields.push(f("Corpse_0")); // 60
    fields.push(f("Corpse_1")); // 61
    fields.push(i("TimeOfDayOverride")); // 62
    fields.push(i("ExpansionID")); // 63
    fields.push(i("RaidOffset")); // 64
    fields.push(i("MaxPlayers")); // 65
    schema("Map", fields)
}

fn area_table() -> Schema {
    let mut f = vec![
        i("ID"),
        i("ContinentID"),
        i("ParentAreaID"),
        i("AreaBit"),
        i("Flags"),
        i("SoundProviderPref"),
        i("SoundProviderPrefUnderwater"),
        i("AmbienceID"),
        i("ZoneMusic"),
        i("IntroSound"),
        i("ExplorationLevel"),
    ];
    f.extend(loc("AreaName"));
    f.push(i("FactionGroupMask"));
    f.extend(arr_i("LiquidTypeID", 4));
    f.push(self::f("MinElevation"));
    f.push(self::f("Ambient_multiplier"));
    f.push(i("LightID"));
    schema("AreaTable", f)
}

fn chr_classes() -> Schema {
    let mut f = vec![
        i("ID"),
        i("DamageBonusStat"),
        i("DisplayPower"),
        s("PetNameToken"),
    ];
    f.extend(loc("Name"));
    f.extend(loc("Name_female"));
    f.extend(loc("Name_male"));
    f.extend([
        s("Filename"),
        i("SpellClassSet"),
        i("Flags"),
        i("CinematicSequenceID"),
        i("Required_expansion"),
    ]);
    schema("ChrClasses", f)
}

fn chr_races() -> Schema {
    let mut f = vec![
        i("ID"),
        i("Flags"),
        i("FactionID"),
        i("ExplorationSoundID"),
        i("MaleDisplayID"),
        i("FemaleDisplayID"),
        s("ClientPrefix"),
        i("BaseLanguage"),
        i("CreatureType"),
        i("ResSicknessSpellID"),
        i("SplashSoundID"),
        s("ClientFileString"),
        i("CinematicSequenceID"),
        i("Alliance"),
    ];
    f.extend(loc("Name"));
    f.extend(loc("Name_female"));
    f.extend(loc("Name_male"));
    f.extend(arr_s("FacialHairCustomization", 2));
    f.extend([s("HairCustomization"), i("Required_expansion")]);
    schema("ChrRaces", f)
}

fn talent() -> Schema {
    let mut f = vec![i("ID"), i("TabID"), i("TierID"), i("ColumnIndex")];
    f.extend(arr_i("SpellRank", 9));
    f.extend(arr_i("PrereqTalent", 3));
    f.extend(arr_i("PrereqRank", 3));
    f.extend([i("Flags"), i("RequiredSpellID")]);
    f.extend(arr_i("CategoryMask", 2));
    schema("Talent", f)
}

fn talent_tab() -> Schema {
    let mut f = vec![i("ID")];
    f.extend(loc("Name"));
    f.extend([
        i("SpellIconID"),
        i("RaceMask"),
        i("ClassMask"),
        i("OrderIndex"),
        i("BackgroundFile"),
    ]);
    schema("TalentTab", f)
}

fn skill_line() -> Schema {
    let mut f = vec![i("ID"), i("CategoryID"), i("SkillCostsID")];
    f.extend(loc("DisplayName"));
    f.extend(loc("Description"));
    f.push(i("SpellIconID"));
    f.extend(loc("AlternateVerb"));
    f.push(i("CanLink"));
    schema("SkillLine", f)
}

fn skill_line_ability() -> Schema {
    let mut f = vec![
        i("ID"),
        i("SkillLine"),
        i("Spell"),
        i("RaceMask"),
        i("ClassMask"),
        i("ExcludeRace"),
        i("ExcludeClass"),
        i("MinSkillLineRank"),
        i("SupercededBySpell"),
        i("AcquireMethod"),
        i("TrivialSkillLineRankHigh"),
        i("TrivialSkillLineRankLow"),
    ];
    f.extend(arr_i("CharacterPoints", 2));
    schema("SkillLineAbility", f)
}

fn spell_item_enchantment() -> Schema {
    let mut f = vec![i("ID"), i("Charges")];
    f.extend(arr_i("Effect", 3));
    f.extend(arr_i("EffectPointsMin", 3));
    f.extend(arr_i("EffectPointsMax", 3));
    f.extend(arr_i("EffectArg", 3));
    f.extend(loc("Name"));
    f.extend([
        i("ItemVisual"),
        i("Flags"),
        i("Src_itemID"),
        i("Condition_ID"),
        i("RequiredSkillID"),
        i("RequiredSkillRank"),
        i("MinLevel"),
    ]);
    schema("SpellItemEnchantment", f)
}

fn spell_cast_times() -> Schema {
    schema(
        "SpellCastTimes",
        vec![i("ID"), i("Base"), i("PerLevel"), i("Minimum")],
    )
}

fn spell_duration() -> Schema {
    schema(
        "SpellDuration",
        vec![
            i("ID"),
            i("Duration"),
            i("DurationPerLevel"),
            i("MaxDuration"),
        ],
    )
}

fn spell_radius() -> Schema {
    schema(
        "SpellRadius",
        vec![
            i("ID"),
            self::f("Radius"),
            i("PerLevel"),
            self::f("RadiusMax"),
        ],
    )
}

fn spell_range() -> Schema {
    let mut f = vec![
        i("ID"),
        self::f("RangeMin_0"),
        self::f("RangeMin_1"),
        self::f("RangeMax_0"),
        self::f("RangeMax_1"),
        i("Flags"),
    ];
    f.extend(loc("DisplayName"));
    f.extend(loc("DisplayNameShort"));
    schema("SpellRange", f)
}

fn spell_icon() -> Schema {
    schema("SpellIcon", vec![i("ID"), s("TextureFilename")])
}

fn spell_mechanic() -> Schema {
    let mut f = vec![i("ID")];
    f.extend(loc("StateName"));
    schema("SpellMechanic", f)
}

fn spell_rune_cost() -> Schema {
    schema(
        "SpellRuneCost",
        vec![
            i("ID"),
            i("Blood"),
            i("Unholy"),
            i("Frost"),
            i("RunicPower"),
        ],
    )
}

fn spell_missile() -> Schema {
    schema(
        "SpellMissile",
        vec![
            i("ID"),
            i("Flags"),
            self::f("DefaultPitchMin"),
            self::f("DefaultPitchMax"),
            self::f("DefaultSpeedMin"),
            self::f("DefaultSpeedMax"),
            self::f("GravityBehavior"),
            self::f("MaxDuration"),
            self::f("CollisionRadius"),
        ],
    )
}

fn spell_focus_object() -> Schema {
    let mut f = vec![i("ID")];
    f.extend(loc("Name"));
    schema("SpellFocusObject", f)
}

fn spell_dispel_type() -> Schema {
    let mut f = vec![i("ID")];
    f.extend(loc("Name"));
    f.extend([i("Mask"), i("Immunity_possible"), i("Internal_name")]);
    schema("SpellDispelType", f)
}

fn spell_category() -> Schema {
    schema("SpellCategory", vec![i("ID"), i("Flags")])
}

fn spell_shapeshift_form() -> Schema {
    let mut f = vec![i("ID"), i("BonusActionBar"), i("Flags")];
    f.extend(loc("Name"));
    f.extend([
        i("CreatureType"),
        i("AttackIconID"),
        i("CombatRoundTime"),
        i("CreatureDisplayID_A"),
        i("CreatureDisplayID_H"),
    ]);
    f.extend(arr_i("PresetSpellID", 8));
    schema("SpellShapeshiftForm", f)
}

fn spell_visual() -> Schema {
    schema(
        "SpellVisual",
        vec![
            i("ID"),
            i("PrecastKit"),
            i("CastKit"),
            i("ImpactKit"),
            i("StateKit"),
            i("StateDoneKit"),
            i("ChannelKit"),
            i("HasMissile"),
            i("MissileModel"),
            i("MissilePathType"),
            i("MissileDestinationAttachment"),
            i("MissileSound"),
            i("AnimEventSoundID"),
            i("Flags"),
            i("CasterImpactKit"),
            i("TargetImpactKit"),
            i("MissileAttachment"),
            i("MissileFollowGroundHeight"),
            i("MissileFollowGroundDropSpeed"),
            i("MissileFollowGroundApproach"),
            i("MissileFollowGroundFlags"),
            i("MissileMotionID"),
            i("MissileTargetingKit"),
            i("InstantAreaKit"),
            i("ImpactAreaKit"),
            i("PersistentAreaKit"),
        ],
    )
}

fn creature_display_info() -> Schema {
    schema(
        "CreatureDisplayInfo",
        vec![
            i("ID"),
            i("ModelID"),
            i("SoundID"),
            i("ExtendedDisplayInfoID"),
            self::f("CreatureModelScale"),
            i("CreatureModelAlpha"),
            s("TextureVariation_0"),
            s("TextureVariation_1"),
            s("TextureVariation_2"),
            s("PortraitTextureName"),
            i("SizeClass"),
            i("BloodID"),
            i("NPCSoundID"),
            i("ParticleColorID"),
            i("CreatureGeosetData"),
            i("ObjectEffectPackageID"),
        ],
    )
}

fn creature_model_data() -> Schema {
    schema(
        "CreatureModelData",
        vec![
            i("ID"),
            i("Flags"),
            s("ModelName"),
            i("SizeClass"),
            self::f("ModelScale"),
            i("BloodID"),
            i("FootprintTextureID"),
            self::f("FootprintTextureLength"),
            self::f("FootprintTextureWidth"),
            self::f("FootprintParticleScale"),
            i("FoleyMaterialID"),
            i("FootstepShakeSize"),
            i("DeathThudShakeSize"),
            i("SoundID"),
            self::f("CollisionWidth"),
            self::f("CollisionHeight"),
            self::f("MountHeight"),
            self::f("GeoBoxMinX"),
            self::f("GeoBoxMinY"),
            self::f("GeoBoxMinZ"),
            self::f("GeoBoxMaxX"),
            self::f("GeoBoxMaxY"),
            self::f("GeoBoxMaxZ"),
            self::f("WorldEffectScale"),
            self::f("AttachedEffectScale"),
            self::f("MissileCollisionRadius"),
            self::f("MissileCollisionPush"),
            self::f("MissileCollisionRaise"),
        ],
    )
}

fn creature_family() -> Schema {
    let mut f = vec![
        i("ID"),
        self::f("MinScale"),
        i("MinScaleLevel"),
        self::f("MaxScale"),
        i("MaxScaleLevel"),
    ];
    f.extend(arr_i("SkillLine", 2));
    f.extend([i("PetFoodMask"), i("PetTalentType"), i("CategoryEnumID")]);
    f.extend(loc("Name"));
    f.push(s("IconFile"));
    schema("CreatureFamily", f)
}

fn creature_type() -> Schema {
    let mut f = vec![i("ID")];
    f.extend(loc("Name"));
    f.push(i("Flags"));
    schema("CreatureType", f)
}

fn taxi_nodes() -> Schema {
    let mut f = vec![i("ID"), i("ContinentID")];
    f.extend(arr_f("Pos", 3));
    f.extend(loc("Name"));
    f.extend(arr_i("MountCreatureID", 2));
    schema("TaxiNodes", f)
}

fn taxi_path() -> Schema {
    schema(
        "TaxiPath",
        vec![i("ID"), i("FromTaxiNode"), i("ToTaxiNode"), i("Cost")],
    )
}

fn taxi_path_node() -> Schema {
    schema(
        "TaxiPathNode",
        vec![
            i("ID"),
            i("PathID"),
            i("NodeIndex"),
            i("ContinentID"),
            self::f("LocX"),
            self::f("LocY"),
            self::f("LocZ"),
            i("Flags"),
            i("Delay"),
            i("ArrivalEventID"),
            i("DepartureEventID"),
        ],
    )
}

fn faction() -> Schema {
    let mut f = vec![i("ID"), i("ReputationIndex")];
    f.extend(arr_u("ReputationRaceMask", 4));
    f.extend(arr_u("ReputationClassMask", 4));
    f.extend(arr_i("ReputationBase", 4));
    f.extend(arr_u("ReputationFlags", 4));
    f.extend([i("ParentFactionID")]);
    f.extend(arr_f("ParentFactionMod", 2));
    f.extend(arr_u("ParentFactionCap", 2));
    f.extend(loc("Name"));
    f.extend(loc("Description"));
    schema("Faction", f)
}

fn faction_template() -> Schema {
    let mut f = vec![
        i("ID"),
        i("Faction"),
        i("Flags"),
        i("FactionGroup"),
        i("FriendGroup"),
        i("EnemyGroup"),
    ];
    f.extend(arr_i("Enemies", 4));
    f.extend(arr_i("Friend", 4));
    schema("FactionTemplate", f)
}

fn item_display_info() -> Schema {
    schema(
        "ItemDisplayInfo",
        vec![
            i("ID"),
            s("ModelName_0"),
            s("ModelName_1"),
            s("ModelTexture_0"),
            s("ModelTexture_1"),
            s("InventoryIcon_0"),
            s("InventoryIcon_1"),
            i("GeosetGroup_0"),
            i("GeosetGroup_1"),
            i("GeosetGroup_2"),
            i("Flags"),
            i("SpellVisualID"),
            i("GroupSoundIndex"),
            i("HelmetGeosetVis_0"),
            i("HelmetGeosetVis_1"),
            s("Texture_0"),
            s("Texture_1"),
            s("Texture_2"),
            s("Texture_3"),
            s("Texture_4"),
            s("Texture_5"),
            s("Texture_6"),
            s("Texture_7"),
            i("ItemVisual"),
            i("ParticleColorID"),
        ],
    )
}

fn item_random_properties() -> Schema {
    let mut f = vec![i("ID"), s("Name")];
    f.extend(arr_i("Enchantment", 5));
    f.extend(loc("Name_lang"));
    schema("ItemRandomProperties", f)
}

fn item_set() -> Schema {
    let mut f = vec![i("ID")];
    f.extend(loc("Name"));
    f.extend(arr_i("ItemID", 17));
    f.extend(arr_i("SetSpellID", 8));
    f.extend(arr_i("SetThreshold", 8));
    f.extend([i("RequiredSkill"), i("RequiredSkillRank")]);
    schema("ItemSet", f)
}

fn gem_properties() -> Schema {
    schema(
        "GemProperties",
        vec![
            i("ID"),
            i("EnchantID"),
            i("MaxCountInv"),
            i("MaxCountItem"),
            i("Type"),
        ],
    )
}

fn glyph_properties() -> Schema {
    schema(
        "GlyphProperties",
        vec![i("ID"), i("SpellID"), i("GlyphSlotFlags"), i("SpellIconID")],
    )
}

fn achievement() -> Schema {
    let mut f = vec![i("ID"), i("Faction"), i("MapID")];
    f.extend(loc("Title"));
    f.extend(loc("Description"));
    f.extend([
        i("Category"),
        i("Points"),
        i("UIOrder"),
        i("Flags"),
        i("IconID"),
        i("TitleReward"),
        i("Count"),
        i("RefAchievement"),
    ]);
    schema("Achievement", f)
}

fn achievement_criteria() -> Schema {
    let mut f = vec![
        i("ID"),
        i("AchievementID"),
        i("Type"),
        i("Asset_0"),
        i("Asset_1"),
        i("Quantity"),
        i("StartEvent"),
        i("StartAsset"),
        i("FailEvent"),
        i("FailAsset"),
    ];
    f.extend(loc("Description"));
    f.extend([
        i("Flags"),
        i("TimerStartEvent"),
        i("TimerAsset"),
        i("TimerTime"),
        i("UIOrder"),
    ]);
    schema("Achievement_Criteria", f)
}

fn battlemaster_list() -> Schema {
    let mut f = vec![i("ID")];
    f.extend(arr_i("MapID", 8));
    f.extend([
        i("InstanceType"),
        i("GroupsAllowed"),
        i("MaxGroupSize"),
        i("HolidayWorldState"),
    ]);
    f.extend(loc("Name"));
    f.extend([
        i("MaxGroupSizeRated"),
        i("MinLevel"),
        i("MaxLevel"),
        i("RatedPlayers"),
        i("MinPlayers"),
        i("MaxPlayers"),
        i("Flags"),
    ]);
    schema("BattlemasterList", f)
}

fn lfg_dungeons() -> Schema {
    let mut f = vec![i("ID")];
    f.extend(loc("Name"));
    f.extend([
        i("MinLevel"),
        i("MaxLevel"),
        i("TargetLevelMin"),
        i("TargetLevelMax"),
        i("MapID"),
        i("DifficultyID"),
        i("Flags"),
        i("TypeID"),
        i("Faction"),
        i("TextureFilename"),
        i("ExpansionLevel"),
        i("OrderIndex"),
        i("GroupID"),
    ]);
    f.extend(loc("Description"));
    schema("LFGDungeons", f)
}
