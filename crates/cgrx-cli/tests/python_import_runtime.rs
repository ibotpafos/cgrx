use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use cgrx_store::{GenerationReader, GenerationWriter};
use serde_json::Value;
use std::{
    fs,
    path::PathBuf,
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};

static ID: AtomicU64 = AtomicU64::new(0);
struct Fixture {
    base: PathBuf,
    root: PathBuf,
    state: PathBuf,
    runtime: Runtime,
}
impl Fixture {
    fn new(files: &[(&str, &str)]) -> Self {
        let base = std::env::temp_dir().join(format!(
            "cgrx-python-import-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        ));
        let root = base.join("repo");
        let state = base.join("state");
        fs::create_dir_all(&root).unwrap();
        for (path, source) in files {
            let path = root.join(path);
            fs::create_dir_all(path.parent().unwrap()).unwrap();
            fs::write(path, source).unwrap();
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
        Self {
            base,
            root,
            state,
            runtime,
        }
    }
    fn nodes(&self) -> Value {
        let reader = GenerationReader::open_current(&self.state).unwrap();
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap()
    }
    fn imports(&self) -> Vec<(String, String, String)> {
        let nodes = self.nodes();
        nodes["arcs"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|a| a["kind"] == "IMPORTS")
            .map(|a| {
                let target = nodes["documents"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .find(|d| d["node_id"] == a["target"])
                    .unwrap();
                (
                    a["evidence"]["path"].as_str().unwrap().to_owned(),
                    target["path"].as_str().unwrap().to_owned(),
                    target["qualified_name"].as_str().unwrap().to_owned(),
                )
            })
            .collect()
    }
    fn scope() -> Scope {
        Scope {
            include: vec![],
            exclude: vec![],
            relation_kinds: vec![RelationKind::Imports],
            max_depth: 1,
        }
    }
    fn gaps(&self) -> Vec<String> {
        self.runtime
            .coverage_for_scope(&Self::scope())
            .dynamic_dispatch
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.base);
    }
}

#[test]
fn explicit_members_bind_to_named_declarations_not_same_name_distractors() {
    let fixture = Fixture::new(&[
        ("pkg/__init__.py", ""),
        (
            "pkg/main.py",
            "from .helpers import (helper as alias, Point)\n",
        ),
        (
            "pkg/helpers.py",
            "def helper():\n pass\nclass Point:\n pass\n",
        ),
        ("noise.py", "def helper():\n pass\nclass Point:\n pass\n"),
    ]);
    assert_eq!(
        fixture.imports(),
        [
            (
                "pkg/main.py".to_owned(),
                "pkg/helpers.py".to_owned(),
                "Point".to_owned()
            ),
            (
                "pkg/main.py".to_owned(),
                "pkg/helpers.py".to_owned(),
                "helper".to_owned()
            ),
        ]
    );
    assert!(fixture.gaps().is_empty());
    let outline = fixture.runtime.get_outline("pkg/main.py", 1).unwrap();
    assert_eq!(outline["total_imports"], 2);
    assert_eq!(outline["imports_truncated"], true);
    assert_eq!(outline["imports"][0]["local"], "alias");
    assert_eq!(outline["imports"][0]["target"]["symbol"], "helper");
    assert_eq!(outline["imports"][0]["target"]["path"], "pkg/helpers.py");
    let nodes = fixture.nodes();
    for arc in nodes["arcs"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|a| a["kind"] == "IMPORTS")
    {
        let source = nodes["documents"]
            .as_array()
            .unwrap()
            .iter()
            .find(|d| d["node_id"] == arc["source"])
            .unwrap();
        assert_eq!(source["provenance"], "IMPORTS");
        assert_eq!(arc["evidence"]["span"]["start"], source["span_start"]);
        assert_eq!(arc["evidence"]["span"]["end"], source["span_end"]);
        assert_eq!(
            arc["evidence"]["source_hash"],
            nodes["path_hashes"]["pkg/main.py"]
        );
        assert_eq!(arc["evidence"]["resolver"], "SYNTAX_EXACT");
        assert_eq!(arc["evidence"]["confidence"], "PROVEN");
    }
}

#[test]
fn parent_relative_and_package_module_paths_require_initialized_packages() {
    let fixture = Fixture::new(&[
        ("pkg/__init__.py", ""),
        ("pkg/sub/__init__.py", ""),
        (
            "pkg/sub/main.py",
            "from ..helpers import helper\nfrom .models import Point\n",
        ),
        ("pkg/helpers.py", "def helper():\n pass\n"),
        ("pkg/sub/models/__init__.py", "class Point:\n pass\n"),
    ]);
    assert_eq!(fixture.imports().len(), 2);
    assert!(fixture.gaps().is_empty());
}

#[test]
fn namespace_packages_missing_symbols_and_module_collisions_are_gaps() {
    for extra in [
        "namespace",
        "missing",
        "collision",
        "invalid-collision",
        "escape",
    ] {
        let mut files = vec![
            ("pkg/main.py", "from .helpers import helper\n"),
            ("pkg/helpers.py", "def helper():\n pass\n"),
        ];
        if extra != "namespace" {
            files.push(("pkg/__init__.py", ""));
        }
        if extra == "missing" {
            files[1].1 = "def other():\n pass\n";
        }
        if extra == "collision" {
            files.push(("pkg/helpers/__init__.py", "def helper():\n pass\n"));
        }
        if extra == "invalid-collision" {
            files.push(("pkg/helpers/__init__.py", "def broken(:\n pass\n"));
        }
        if extra == "escape" {
            files[0].1 = "from ..helpers import helper\n";
        }
        let fixture = Fixture::new(&files);
        assert!(fixture.imports().is_empty(), "false import: {extra}");
        assert!(!fixture.gaps().is_empty(), "hidden import gap: {extra}");
    }
}

#[test]
fn decorated_rebound_conditional_and_reexported_names_are_not_proven() {
    for target in [
        "@decorate\ndef helper():\n pass\n",
        "def helper():\n pass\nhelper = other\n",
        "def helper():\n pass\nif flag:\n def helper():\n  pass\n",
        "from .noise import helper\n",
        "def helper():\n pass\nexec(code)\n",
    ] {
        let fixture = Fixture::new(&[
            ("pkg/__init__.py", ""),
            ("pkg/main.py", "from .helpers import helper\n"),
            ("pkg/helpers.py", target),
            ("pkg/noise.py", "def helper():\n pass\n"),
        ]);
        assert!(
            fixture
                .imports()
                .iter()
                .all(|(source, _, _)| source != "pkg/main.py"),
            "false import: {target}"
        );
        assert!(!fixture.gaps().is_empty());
    }
}

#[test]
fn refresh_invalidates_target_and_package_dependencies_and_restores_proof() {
    let mut fixture = Fixture::new(&[
        ("pkg/__init__.py", ""),
        ("pkg/main.py", "from .helpers import helper\n"),
        ("pkg/helpers.py", "def helper():\n pass\n"),
    ]);
    assert_eq!(fixture.runtime.graph_edge_count(), 1);
    fs::write(
        fixture.root.join("pkg/helpers.py"),
        "def helper():\n pass\nhelper = other\n",
    )
    .unwrap();
    assert!(fixture.runtime.refresh(&fixture.root).unwrap());
    assert_eq!(fixture.runtime.graph_edge_count(), 0);
    assert_eq!(
        fixture.runtime.get_outline("pkg/main.py", 5).unwrap()["total_imports"],
        0
    );
    assert!(!fixture.gaps().is_empty());
    fs::write(
        fixture.root.join("pkg/helpers.py"),
        "def helper():\n pass\n",
    )
    .unwrap();
    fixture.runtime.refresh(&fixture.root).unwrap();
    assert_eq!(fixture.runtime.graph_edge_count(), 1);
    assert!(fixture.gaps().is_empty());
    fs::remove_file(fixture.root.join("pkg/__init__.py")).unwrap();
    fixture.runtime.refresh(&fixture.root).unwrap();
    assert_eq!(fixture.runtime.graph_edge_count(), 0);
    fs::write(fixture.root.join("pkg/__init__.py"), "").unwrap();
    fixture.runtime.refresh(&fixture.root).unwrap();
    assert_eq!(fixture.runtime.graph_edge_count(), 1);
}

#[test]
fn reopen_revalidates_import_arcs_against_current_supporting_facts() {
    for case in [
        "missing-source",
        "missing-target",
        "missing-package",
        "stale-source",
        "stale-target",
        "stale-package",
        "wrong-span",
        "wrong-name",
        "duplicate-target",
    ] {
        let fixture = Fixture::new(&[
            ("pkg/__init__.py", ""),
            ("pkg/main.py", "from .helpers import helper\n"),
            ("pkg/helpers.py", "def helper():\n pass\n"),
        ]);
        assert_eq!(fixture.runtime.graph_edge_count(), 1);
        let reader = GenerationReader::open_current(&fixture.state).unwrap();
        let mut nodes = fixture.nodes();
        let path = if case.ends_with("target") {
            "pkg/helpers.py"
        } else if case.ends_with("package") {
            "pkg/__init__.py"
        } else {
            "pkg/main.py"
        };
        if case.starts_with("missing") {
            nodes["python_files"].as_object_mut().unwrap().remove(path);
        } else if case.starts_with("stale") {
            nodes["path_hashes"][path] = serde_json::to_value(cgrx_core::Hash32([9; 32])).unwrap();
        } else if case == "wrong-span" {
            nodes["python_files"]["pkg/main.py"]["facts"]["imports"][0]["span"][0] = Value::from(0);
        } else if case == "wrong-name" {
            nodes["python_files"]["pkg/helpers.py"]["facts"]["exports"]["helper"] =
                serde_json::json!([0, 1]);
        } else {
            let docs = nodes["documents"].as_array_mut().unwrap();
            let mut doc = docs
                .iter()
                .find(|d| d["path"] == "pkg/helpers.py" && d["provenance"] == "SYNTAX")
                .unwrap()
                .clone();
            doc["node_id"] = Value::from(42_u64);
            docs.push(doc);
        }
        let mut snapshot = reader.snapshot().clone();
        snapshot.graph_generation += 1;
        nodes["snapshot"] = serde_json::to_value(&snapshot).unwrap();
        let mut writer = GenerationWriter::begin(&fixture.state, snapshot).unwrap();
        writer
            .write_segment("nodes.seg", &serde_json::to_vec(&nodes).unwrap())
            .unwrap();
        for name in ["edges.seg", "terms.fst"] {
            writer
                .write_segment(name, &reader.read_segment(name).unwrap())
                .unwrap();
        }
        writer.validate().unwrap();
        writer.publish().unwrap();
        let runtime = Runtime::open(&fixture.state).unwrap();
        assert_eq!(
            runtime.graph_edge_count(),
            0,
            "trusted damaged import: {case}"
        );
    }
}
