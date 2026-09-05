use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use serde_json::Value;
use std::{
    fs,
    path::PathBuf,
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

struct Fixture(PathBuf);
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

#[test]
fn version_two_go_field_matrix_preserves_exact_targets_and_rejects_false_edges() {
    let corpus: Value =
        serde_json::from_str(include_str!("../../../contracts/go_field_cases_v2.json")).unwrap();
    let scope = Scope {
        include: vec![],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };
    let mut failures = Vec::new();
    for (index, case) in corpus["cases"].as_array().unwrap().iter().enumerate() {
        let fixture = Fixture(std::env::temp_dir().join(format!(
                "cgrx-go-field-matrix-{}-{}-{index}",
                std::process::id(),
                SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            )));
        let root = fixture.0.join("repo");
        let state = fixture.0.join("state");
        let path = case["path"].as_str().unwrap();
        fs::create_dir_all(root.join("src")).unwrap();
        fs::write(root.join(path), case["source"].as_str().unwrap()).unwrap();
        for (extra_path, content) in case["extra_files"].as_object().unwrap() {
            fs::write(root.join(extra_path), content.as_str().unwrap()).unwrap();
        }
        for args in [
            vec!["init", "-q"],
            vec!["add", "."],
            vec![
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "fixture",
            ],
        ] {
            assert!(
                Command::new("git")
                    .args(args)
                    .current_dir(&root)
                    .status()
                    .unwrap()
                    .success()
            );
        }
        Runtime::index(&root, &state).unwrap();
        let runtime = Runtime::open(&state).unwrap();
        match runtime.trace_path(
            case["seed"].as_str().unwrap(),
            Some(path),
            "callees",
            1,
            &scope,
            50,
        ) {
            Ok(result) => {
                let mut actual: Vec<_> = result["nodes"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|n| {
                        (
                            n["path"].as_str().unwrap().to_owned(),
                            n["symbol"].as_str().unwrap().to_owned(),
                            n["span"]["start"].as_u64().unwrap(),
                            n["span"]["end"].as_u64().unwrap(),
                        )
                    })
                    .collect();
                let mut expected: Vec<_> = case["expected"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|n| {
                        (
                            path.to_owned(),
                            n["name"].as_str().unwrap().to_owned(),
                            n["start"].as_u64().unwrap(),
                            n["end"].as_u64().unwrap(),
                        )
                    })
                    .collect();
                actual.sort();
                expected.sort();
                if actual != expected {
                    failures.push(format!(
                        "{} actual={actual:?} expected={expected:?}",
                        case["id"]
                    ));
                }
            }
            Err(error) => failures.push(format!("{}: {error}", case["id"])),
        }
    }
    assert!(failures.is_empty(), "{}", failures.join("\n"));
}

#[test]
fn version_two_preserves_frozen_sources_and_only_promotes_explicit_embedding() {
    let old: Value =
        serde_json::from_str(include_str!("../../../contracts/go_field_cases_v1.json")).unwrap();
    let new: Value =
        serde_json::from_str(include_str!("../../../contracts/go_field_cases_v2.json")).unwrap();
    let old = old["cases"].as_array().unwrap();
    let new = new["cases"].as_array().unwrap();
    assert_eq!(old.len(), new.len());
    let mut changed = 0;
    for (before, after) in old.iter().zip(new) {
        if before == after {
            continue;
        }
        assert_eq!(before["id"], "embedded_field");
        assert!(before["expected"].as_array().unwrap().is_empty());
        let mut restored = after.clone();
        restored["expected"] = before["expected"].clone();
        assert_eq!(&restored, before);
        assert_eq!(after["expected"].as_array().unwrap().len(), 1);
        changed += 1;
    }
    assert_eq!(changed, 1);
}
