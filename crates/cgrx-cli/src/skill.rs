use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

const SKILL_NAME: &str = "cgrx-code-discovery";
const SKILL: &str = include_str!("../assets/cgrx-code-discovery/SKILL.md");
const CHANGE_VERIFICATION: &str =
    include_str!("../assets/cgrx-code-discovery/references/change-verification.md");
const BUDGETED_CONTEXT: &str =
    include_str!("../assets/cgrx-code-discovery/references/budgeted-context.md");
const OPENAI_YAML: &str = include_str!("../assets/cgrx-code-discovery/agents/openai.yaml");
const LEGACY_START: &str = "<!-- cgrx-agent:start -->";
const LEGACY_END: &str = "<!-- cgrx-agent:end -->";

pub(crate) fn run(args: &[String]) -> Result<(), String> {
    if args != ["install"] {
        return Err("skill requires: cgrx skill install".to_owned());
    }
    let home = env::var_os("HOME")
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
        .ok_or_else(|| "HOME is required to install the user skill".to_owned())?;
    if !home.is_absolute() {
        return Err("HOME must be an absolute path".to_owned());
    }
    let destination = install_skill(&home)?;
    let migrated = migrate_legacy_agents(&home)?;
    println!("skill={}", destination.display());
    println!("legacy_agent_block_removed={migrated}");
    Ok(())
}

fn install_skill(home: &Path) -> Result<PathBuf, String> {
    let skills = home.join(".agents/skills");
    fs::create_dir_all(&skills).map_err(|error| error.to_string())?;
    let destination = skills.join(SKILL_NAME);
    if installed_files_match(&destination) {
        return Ok(destination);
    }

    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_nanos();
    let stage = skills.join(format!(
        ".{SKILL_NAME}.stage-{}-{nonce}",
        std::process::id()
    ));
    fs::create_dir(&stage).map_err(|error| error.to_string())?;
    let result = (|| {
        fs::create_dir(stage.join("references")).map_err(|error| error.to_string())?;
        fs::create_dir(stage.join("agents")).map_err(|error| error.to_string())?;
        fs::write(stage.join("SKILL.md"), SKILL).map_err(|error| error.to_string())?;
        fs::write(
            stage.join("references/change-verification.md"),
            CHANGE_VERIFICATION,
        )
        .map_err(|error| error.to_string())?;
        fs::write(
            stage.join("references/budgeted-context.md"),
            BUDGETED_CONTEXT,
        )
        .map_err(|error| error.to_string())?;
        fs::write(stage.join("agents/openai.yaml"), OPENAI_YAML)
            .map_err(|error| error.to_string())?;

        let backup = skills.join(format!(
            ".{SKILL_NAME}.backup-{}-{nonce}",
            std::process::id()
        ));
        if destination.exists() {
            fs::rename(&destination, &backup).map_err(|error| error.to_string())?;
        }
        if let Err(error) = fs::rename(&stage, &destination) {
            if backup.exists() {
                let _ = fs::rename(&backup, &destination);
            }
            return Err(error.to_string());
        }
        if backup.exists() {
            remove_path(&backup)?;
        }
        Ok(())
    })();
    if stage.exists() {
        let _ = fs::remove_dir_all(&stage);
    }
    result?;
    Ok(destination)
}

fn remove_path(path: &Path) -> Result<(), String> {
    let metadata = fs::symlink_metadata(path).map_err(|error| error.to_string())?;
    if metadata.file_type().is_dir() {
        fs::remove_dir_all(path).map_err(|error| error.to_string())
    } else {
        fs::remove_file(path).map_err(|error| error.to_string())
    }
}

fn installed_files_match(destination: &Path) -> bool {
    [
        ("SKILL.md", SKILL),
        ("references/change-verification.md", CHANGE_VERIFICATION),
        ("references/budgeted-context.md", BUDGETED_CONTEXT),
        ("agents/openai.yaml", OPENAI_YAML),
    ]
    .iter()
    .all(|(path, expected)| {
        fs::read_to_string(destination.join(path)).is_ok_and(|actual| actual == *expected)
    })
}

fn migrate_legacy_agents(home: &Path) -> Result<bool, String> {
    let agents = home.join(".codex/AGENTS.md");
    let Ok(existing) = fs::read_to_string(&agents) else {
        return Ok(false);
    };
    let Some(start) = existing.find(LEGACY_START) else {
        return Ok(false);
    };
    let end_tail = &existing[start..];
    let end_relative = end_tail
        .find(LEGACY_END)
        .ok_or_else(|| "legacy CGRX agent block has no closing marker".to_owned())?;
    let mut end = start + end_relative + LEGACY_END.len();
    if existing[end..].starts_with("\r\n") {
        end += 2;
    } else if existing[end..].starts_with('\n') {
        end += 1;
    }
    let mut migrated = String::with_capacity(existing.len());
    migrated.push_str(&existing[..start]);
    migrated.push_str(&existing[end..]);
    if migrated == existing {
        return Ok(false);
    }

    let backup = agents.with_extension("md.cgrx-backup");
    fs::write(&backup, &existing).map_err(|error| error.to_string())?;
    let temporary = agents.with_extension(format!("md.cgrx-{}-tmp", std::process::id()));
    fs::write(&temporary, migrated).map_err(|error| error.to_string())?;
    fs::rename(&temporary, &agents).map_err(|error| error.to_string())?;
    Ok(true)
}
