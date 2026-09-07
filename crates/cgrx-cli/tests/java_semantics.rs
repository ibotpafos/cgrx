use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use serde_json::Value;
use std::{fs, path::PathBuf, process::Command};

static SEQUENCE: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
struct Fixture {
    base: PathBuf,
}
impl Fixture {
    fn new(source: &str) -> Self {
        let base = std::env::temp_dir().join(format!(
            "cgrx-java-semantics-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, std::sync::atomic::Ordering::Relaxed)
        ));
        let this = Self { base };
        fs::create_dir_all(this.root()).unwrap();
        fs::write(this.root().join("Service.java"), source).unwrap();
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
                    .current_dir(this.root())
                    .status()
                    .unwrap()
                    .success()
            );
        }
        Runtime::index(&this.root(), &this.state()).unwrap();
        this
    }
    fn root(&self) -> PathBuf {
        self.base.join("repo")
    }
    fn state(&self) -> PathBuf {
        self.base.join("state")
    }
    fn runtime(&self) -> Runtime {
        Runtime::open(&self.state()).unwrap()
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.base);
    }
}

fn trace_named(runtime: &Runtime, symbol: &str, path: &str) -> Value {
    runtime
        .trace_path(
            symbol,
            Some(path),
            "callees",
            1,
            &Scope {
                include: vec![],
                exclude: vec![],
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 1,
            },
            20,
        )
        .unwrap()
}

fn has_callee(result: &Value, symbol: &str) -> bool {
    result["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .any(|node| node["symbol"] == symbol)
}

fn has_callee_in(result: &Value, symbol: &str, path: &str) -> bool {
    result["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .any(|node| node["symbol"] == symbol && node["path"] == path)
}

fn has_dispatch_gap(runtime: &Runtime, path: &str) -> bool {
    runtime
        .check_index_coverage(&[path.to_owned()], &[], 0, 20)
        .unwrap()["paths"][0]["gaps"]
        .as_array()
        .unwrap()
        .iter()
        .any(|gap| gap["code"] == "DYNAMIC_DISPATCH")
}

#[test]
fn this_and_typed_receivers_trace_to_the_defining_class() {
    let fixture = Fixture::new(
        "final class Service {\n    int caller() { Engine engine = new Engine(); return engine.add() + this.bump(); }\n    int bump() { return 1; }\n}\nfinal class Engine {\n    int add() { return 1; }\n}\n",
    );
    fs::write(
        fixture.root().join("Other.java"),
        "class Other {\n    int add() { return 99; }\n}\n",
    )
    .unwrap();
    let mut runtime = fixture.runtime();
    assert!(runtime.refresh(&fixture.root()).unwrap());
    let result = trace_named(&runtime, "caller", "Service.java");
    assert!(has_callee_in(&result, "add", "Service.java"), "{result}");
    assert!(has_callee(&result, "bump"), "{result}");
}

#[test]
fn subclassed_receiver_type_leaves_a_dispatch_gap() {
    let fixture = Fixture::new(
        "class Service {\n    int caller() { Engine engine = new Engine(); return engine.add(); }\n}\nclass Engine {\n    int add() { return 1; }\n}\nclass Turbo extends Engine {}\n",
    );
    fs::write(
        fixture.root().join("Notes.java"),
        "class Notes {\n    int note() { return 0; }\n}\n",
    )
    .unwrap();
    let mut runtime = fixture.runtime();
    assert!(runtime.refresh(&fixture.root()).unwrap());
    let result = trace_named(&runtime, "caller", "Service.java");
    assert!(!has_callee(&result, "add"), "{result}");
    assert!(has_dispatch_gap(&runtime, "Service.java"));
}
