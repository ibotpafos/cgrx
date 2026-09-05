use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use cgrx_store::{GenerationReader, GenerationWriter};
use serde_json::Value;
use std::{fs, path::PathBuf, process::Command};

static SEQUENCE: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
struct Fixture {
    root: PathBuf,
    state: PathBuf,
}
impl Fixture {
    fn new(source: &str, extension: &str) -> Self {
        let base = std::env::temp_dir().join(format!(
            "cgrx-ts-lexical-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, std::sync::atomic::Ordering::Relaxed)
        ));
        let root = base.join("repo");
        let state = base.join("state");
        fs::create_dir_all(&root).unwrap();
        fs::write(root.join(format!("main.{extension}")), source).unwrap();
        fs::write(
            root.join("other.ts"),
            "export const tail = () => 0; function outside() { tail(); }",
        )
        .unwrap();
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
        Self { root, state }
    }
    fn stored(&self) -> Value {
        let reader = GenerationReader::open_current(&self.state).unwrap();
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap()
    }
    fn trace(&self, symbol: &str, path: &str) -> Value {
        trace(&Runtime::open(&self.state).unwrap(), symbol, path)
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(self.root.parent().unwrap());
    }
}
fn trace(runtime: &Runtime, symbol: &str, path: &str) -> Value {
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
                max_depth: 2,
            },
            50,
        )
        .unwrap()
}
fn assert_target(result: &Value, source: &str, marker: &str, path: &str) {
    assert_eq!(result["total"], 1, "{result}");
    let node = &result["nodes"][0];
    let start = source.find(marker).unwrap();
    assert_eq!(node["symbol"], "tail");
    assert_eq!(node["path"], path);
    assert_eq!(node["span"]["start"], start);
    assert_eq!(node["span"]["end"], start + 4);
}
#[test]
fn ts_lexical_phone_digits_exact_target_and_two_callsites() {
    let source = "export function phoneDigitsMatch(left: string, right: string) { const leftDigits = left.replace(/\\D/g, ''); const rightDigits = right.replace(/\\D/g, ''); const tail = (value: string) => value.length > 10 ? value.slice(value.length - 10) : value; return tail(leftDigits) === tail(rightDigits); }";
    let fixture = Fixture::new(source, "ts");
    assert_target(
        &fixture.trace("phoneDigitsMatch", "main.ts"),
        source,
        "tail =",
        "main.ts",
    );
    let stored = fixture.stored();
    let arcs: Vec<_> = stored["arcs"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|a| a["evidence"]["path"] == "main.ts")
        .collect();
    assert_eq!(arcs.len(), 2, "{stored}");
}
#[test]
fn ts_lexical_tsx_arrow_and_nested_body_attribution() {
    let source = "export const caller = () => { const tail = () => <span/>; return tail(); };";
    let fixture = Fixture::new(source, "tsx");
    assert_target(
        &fixture.trace("caller", "main.tsx"),
        source,
        "tail =",
        "main.tsx",
    );
    assert_eq!(fixture.trace("tail", "main.tsx")["total"], 0);
}
#[test]
fn ts_lexical_same_name_sibling_exact_span() {
    let source = "function sibling() { const tail = () => 1; return tail(); } function caller() { const tail = () => 2; { return tail(); } }";
    let fixture = Fixture::new(source, "ts");
    assert_target(
        &fixture.trace("caller", "main.ts"),
        source,
        "tail = () => 2",
        "main.ts",
    );
}
macro_rules! negative {
    ($name:ident, $source:expr) => {
        #[test]
        fn $name() {
            let fixture = Fixture::new($source, "ts");
            assert_eq!(
                fixture.trace("caller", "main.ts")["total"],
                0,
                "{}",
                fixture.stored()
            );
            // No hidden false arrow arcs from nested callback bodies either.
            assert!(
                fixture.stored()["arcs"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .all(|a| a["evidence"]["path"] != "main.ts")
            );
        }
    };
}
negative!(
    ts_lexical_parameter_shadow,
    "const tail = () => 0; function caller(tail: () => void) { tail(); }"
);
negative!(
    ts_lexical_block_tdz_shadows_outer,
    "function caller() { const tail = () => 0; { tail(); const tail = () => 1; } }"
);
negative!(
    ts_lexical_destructured_shadow,
    "function caller() { const tail = () => 0; { const {value: tail} = obj; tail(); } }"
);
negative!(
    ts_lexical_array_destructured_shadow,
    "function caller() { const tail = () => 0; { const [tail] = values; tail(); } }"
);
negative!(
    ts_lexical_catch_shadow,
    "function caller() { const tail = () => 0; try {} catch(tail) { tail(); } }"
);
negative!(
    ts_lexical_catch_destructured_shadow,
    "function caller() { const tail = () => 0; try {} catch({tail}) { tail(); } }"
);
negative!(
    ts_lexical_for_of_shadow,
    "function caller() { const tail = () => 0; for(const tail of values) { tail(); } }"
);
negative!(
    ts_lexical_for_destructured_shadow,
    "function caller() { const tail = () => 0; for(const {tail} of values) { tail(); } }"
);
negative!(
    ts_lexical_before_initialization,
    "function caller() { tail(); const tail = () => 0; }"
);
negative!(
    ts_lexical_let_reassignment,
    "function caller() { let tail = () => 0; tail = other; tail(); }"
);
negative!(
    ts_lexical_var_reassignment,
    "function caller() { var tail = () => 0; tail = other; tail(); }"
);
negative!(
    ts_lexical_duplicate_declaration,
    "function caller() { const tail = () => 0; const tail = () => 1; tail(); }"
);
negative!(
    ts_lexical_outside_block,
    "function caller() { { const tail = () => 0; } tail(); }"
);
negative!(
    ts_lexical_sibling_scope,
    "function sibling() { const tail = () => 0; } function caller() { tail(); }"
);
negative!(
    ts_lexical_other_file_never_fallback,
    "function caller() { tail(); }"
);
negative!(
    ts_lexical_named_function_expression,
    "function caller() { const tail = () => 0; consume(function tail() { tail(); }); }"
);
negative!(
    ts_lexical_callback_parameter,
    "function caller() { const tail = () => 0; consume((tail) => tail()); }"
);
negative!(
    ts_lexical_capture_gap,
    "function caller() { const tail = () => 0; consume(() => tail()); }"
);
negative!(
    ts_lexical_default_parameter_gap,
    "const tail = () => 0; function caller(value = tail()) {} "
);
negative!(
    ts_lexical_with_gap,
    "function caller() { const tail = () => 0; with (obj) { tail(); } }"
);
negative!(
    ts_lexical_nested_anonymous_body_not_outer,
    "function helper() {} function caller() { consume(() => helper()); }"
);

negative!(
    ts_lexical_parameter_const_collision,
    "function caller(tail: unknown) { const tail = () => 0; tail(); }"
);
negative!(
    ts_lexical_switch_cross_case_initialization,
    "function caller(n: number) { switch(n) { case 0: const tail = () => 0; break; case 1: tail(); } }"
);

#[test]
fn ts_lexical_managed_revision_three_reindexes_to_distinct_generation() {
    assert_managed_revision_reindexes(3);
}

#[test]
fn ts_lexical_managed_revision_four_reindexes_to_distinct_generation() {
    assert_managed_revision_reindexes(4);
}

fn assert_managed_revision_reindexes(old_revision: u32) {
    let source = "function caller() { const tail = () => 0; tail(); }";
    let fixture = Fixture::new(source, "ts");
    let reader = GenerationReader::open_current(&fixture.state).unwrap();
    let mut stored = fixture.stored();
    stored["extraction_revision"] = serde_json::json!(old_revision);
    stored["arcs"] = serde_json::json!([]);
    // Authentic prior immutable generation key for the very same HEAD.
    let mut snapshot = reader.snapshot().clone();
    let mut hasher = blake3::Hasher::new();
    hasher.update(snapshot.repo_revision.as_bytes());
    hasher.update(&old_revision.to_le_bytes());
    snapshot.graph_generation =
        u64::from_le_bytes(hasher.finalize().as_bytes()[..8].try_into().unwrap())
            % 10_000_000_000_000_000;
    let legacy_generation = snapshot.graph_generation;
    stored["snapshot"] = serde_json::to_value(&snapshot).unwrap();
    let managed = fixture.root.join(".git/cgrx/managed");
    let mut writer = GenerationWriter::begin(&managed, snapshot).unwrap();
    writer
        .write_segment("nodes.seg", &serde_json::to_vec(&stored).unwrap())
        .unwrap();
    for name in ["edges.seg", "terms.fst"] {
        writer
            .write_segment(name, &reader.read_segment(name).unwrap())
            .unwrap();
    }
    writer.validate().unwrap();
    writer.publish().unwrap();
    let legacy = GenerationReader::open_current(&managed).unwrap();
    let legacy_bytes = legacy.read_segment("nodes.seg").unwrap();
    assert_eq!(
        Runtime::open(&managed).err().unwrap().code(),
        "extraction_revision"
    );
    let output = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["status", "--root"])
        .arg(&fixture.root)
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let current = GenerationReader::open_current(&managed).unwrap();
    assert_ne!(current.snapshot().graph_generation, legacy_generation);
    assert_eq!(
        legacy.read_segment("nodes.seg").unwrap(),
        legacy_bytes,
        "immutable old artifact stays unchanged"
    );
    let runtime = Runtime::open(&managed).unwrap();
    assert_target(
        &trace(&runtime, "caller", "main.ts"),
        source,
        "tail =",
        "main.ts",
    );
}

#[test]
fn ts_lexical_refresh_drops_old_proof_and_does_not_retarget_other_file() {
    let source = "function caller() { const tail = () => 0; tail(); }";
    let fixture = Fixture::new(source, "ts");
    let mut runtime = Runtime::open(&fixture.state).unwrap();
    assert_target(
        &trace(&runtime, "caller", "main.ts"),
        source,
        "tail =",
        "main.ts",
    );
    fs::write(
        fixture.root.join("main.ts"),
        "function caller() { let tail = () => 0; tail = other; tail(); }",
    )
    .unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_eq!(trace(&runtime, "caller", "main.ts")["total"], 0);
    // Removing the local declaration must not revive an arrow via global lookup.
    fs::write(
        fixture.root.join("main.ts"),
        "function caller() { tail(); }",
    )
    .unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_eq!(trace(&runtime, "caller", "main.ts")["total"], 0);
}

#[test]
fn ts_lexical_nested_arrow_owns_calls_not_enclosing_function() {
    let source = "function caller() { const worker = () => { const tail = () => 1; return tail(); }; return worker(); }";
    let fixture = Fixture::new(source, "ts");
    let outer = fixture.trace("caller", "main.ts");
    assert_eq!(outer["total"], 1);
    assert_eq!(outer["nodes"][0]["symbol"], "worker");
    assert_target(
        &fixture.trace("worker", "main.ts"),
        source,
        "tail =",
        "main.ts",
    );
}

#[test]
fn ts_lexical_metadata_is_compact_and_proofs_are_present_only_on_exact_calls() {
    let fixture = Fixture::new(
        "function helper() {} function caller() { helper(); const tail = () => 0; tail(); }",
        "ts",
    );
    let stored = fixture.stored();
    assert_eq!(stored["extraction_revision"], 20);
    let docs = stored["documents"].as_array().unwrap();
    let proofs: Vec<_> = docs
        .iter()
        .filter(|d| d.get("ts_lexical_target").is_some())
        .collect();
    assert_eq!(proofs.len(), 1);
    assert_eq!(proofs[0]["qualified_name"], "tail");
    assert!(
        proofs[0]["ts_lexical_target"]["target"]["end"]
            .as_u64()
            .unwrap()
            > 0
    );
    for d in docs {
        assert!(!d.get("ts_lexical_target").is_some_and(Value::is_null));
    }
}

negative!(
    ts_lexical_class_expression_instance_field_gap,
    "function caller() { const tail = () => 1; return class { value = tail(); }; }"
);
negative!(
    ts_lexical_named_class_expression_instance_field_gap,
    "function caller() { const tail = () => 1; const Box = class tail { value = tail(); }; return Box; }"
);
negative!(
    ts_lexical_class_declaration_instance_field_gap,
    "function caller() { const tail = () => 1; class Box { value = tail(); } return Box; }"
);
negative!(
    ts_lexical_class_expression_static_field_gap,
    "function caller() { const tail = () => 1; return class { static value = tail(); }; }"
);
negative!(
    ts_lexical_named_class_expression_static_field_gap,
    "function caller() { const tail = () => 1; return class tail { static value = tail(); }; }"
);
negative!(
    ts_lexical_class_declaration_static_field_gap,
    "function caller() { const tail = () => 1; class Box { static value = tail(); } return Box; }"
);
negative!(
    ts_lexical_class_expression_static_block_gap,
    "function caller() { const tail = () => 1; return class { static { tail(); } }; }"
);
negative!(
    ts_lexical_class_declaration_static_block_gap,
    "function caller() { const tail = () => 1; class Box { static { tail(); } } return Box; }"
);
negative!(
    ts_lexical_named_class_expression_scope_gap,
    "function caller() { const tail = () => 1; return class tail extends tail() {}; }"
);

#[test]
fn ts_lexical_class_method_local_arrow_still_has_exact_proof() {
    for source in [
        "function caller() { return class { method() { const tail = () => 1; return tail(); } }; }",
        "function caller() { class Box { static method() { const tail = () => 1; return tail(); } } return Box; }",
    ] {
        let fixture = Fixture::new(source, "ts");
        assert_eq!(fixture.trace("caller", "main.ts")["total"], 0);
        assert_target(
            &fixture.trace("method", "main.ts"),
            source,
            "tail =",
            "main.ts",
        );
    }
}

#[test]
fn managed_revision_nine_reindexes_to_distinct_generation() {
    assert_managed_revision_reindexes(9);
}
