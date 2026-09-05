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

static SEQUENCE: AtomicU64 = AtomicU64::new(0);
struct Fixture {
    root: PathBuf,
    state: PathBuf,
}
impl Fixture {
    fn new(source: &str) -> Self {
        let base = std::env::temp_dir().join(format!(
            "cgrx-go-field-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        let root = base.join("repo");
        let state = base.join("state");
        fs::create_dir_all(root.join("queue")).unwrap();
        fs::create_dir_all(root.join("other")).unwrap();
        fs::write(root.join("queue/queue.go"), source).unwrap();
        fs::write(root.join("other/queue.go"), "package other\ntype PriorityQueue []int\nfunc (p PriorityQueue) Len() int { return 0 }\n").unwrap();
        fs::write(
            root.join("queue/distractor.go"),
            "package queue\ntype Elsewhere []int\nfunc (p Elsewhere) Len() int { return 0 }\n",
        )
        .unwrap();
        fs::write(root.join("go.mod"), "module example.test\ngo 1.23\n").unwrap();
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
    fn runtime(&self) -> Runtime {
        Runtime::open(&self.state).unwrap()
    }
    fn stored(&self) -> Value {
        let reader = GenerationReader::open_current(&self.state).unwrap();
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap()
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(self.root.parent().unwrap());
    }
}
fn trace(runtime: &Runtime) -> Value {
    runtime
        .trace_path(
            "Peek",
            Some("queue/queue.go"),
            "callees",
            1,
            &Scope {
                include: vec![],
                exclude: vec![],
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 1,
            },
            50,
        )
        .unwrap()
}
fn source(owner_fields: &str, target_type: &str, target_receiver: &str, body: &str) -> String {
    format!(
        "package queue\ntype QueueItem struct{{}}\ntype TaskQueue struct{{ {owner_fields} }}\ntype PriorityQueue {target_type}\ntype Wrong struct{{}}\nfunc (p Wrong) Len() int {{ return 0 }}\nfunc (p {target_receiver}) Len() int {{ return 1 }}\nfunc (q *TaskQueue) Peek() int {{ {body} }}\n"
    )
}
fn good(body: &str) -> String {
    source("items PriorityQueue", "[]*QueueItem", "PriorityQueue", body)
}
fn assert_len(runtime: &Runtime, source: &str) {
    let result = trace(runtime);
    assert_eq!(result["total"], 1, "{result}");
    let node = &result["nodes"][0];
    assert_eq!(node["path"], "queue/queue.go");
    assert_eq!(node["symbol"], "Len");
    let start = source.rfind("Len() int { return 1 }").unwrap();
    assert_eq!(node["span"]["start"], start);
    assert_eq!(node["span"]["end"], start + 3);
}
#[test]
fn go_field_named_slice_exact_target_span_and_distinct_callsites() {
    let source = good("q.items.Len(); return q.items.Len()");
    let fixture = Fixture::new(&source);
    assert_len(&fixture.runtime(), &source);
    let stored = fixture.stored();
    let arcs = stored["arcs"].as_array().unwrap();
    assert_eq!(arcs.len(), 2, "{stored}");
    for arc in arcs {
        assert_eq!(arc["evidence"]["path"], "queue/queue.go");
        let span = &arc["evidence"]["span"];
        assert_eq!(
            &source
                [span["start"].as_u64().unwrap() as usize..span["end"].as_u64().unwrap() as usize],
            "q.items.Len()"
        );
    }
}
#[test]
fn go_field_pointer_and_value_methodsets_and_field_writes() {
    for field_type in ["PriorityQueue", "*PriorityQueue"] {
        for receiver in ["PriorityQueue", "*PriorityQueue"] {
            let source = source(
                &format!("items {field_type}; count int"),
                "[]*QueueItem",
                receiver,
                "q.items = replacement; q.count = 1; return q.items.Len()",
            );
            let fixture = Fixture::new(&source);
            assert_len(&fixture.runtime(), &source);
        }
    }
}
#[test]
fn go_field_concrete_struct_value_receiver_owner() {
    let source = source(
        "items PriorityQueue",
        "struct { count int }",
        "PriorityQueue",
        "return q.items.Len()",
    )
    .replace("q *TaskQueue", "q TaskQueue");
    let fixture = Fixture::new(&source);
    assert_len(&fixture.runtime(), &source);
}
macro_rules! negative {
    ($name:ident, $source:expr) => {
        #[test]
        fn $name() {
            let source = $source;
            let fixture = Fixture::new(&source);
            assert_eq!(
                trace(&fixture.runtime())["total"],
                0,
                "{}",
                fixture.stored()
            );
            assert!(fixture.stored()["arcs"].as_array().unwrap().is_empty());
        }
    };
}
negative!(
    go_field_interface_gap,
    source(
        "items PriorityQueue",
        "interface { Len() int }",
        "Wrong",
        "return q.items.Len()"
    )
);
negative!(
    go_field_alias_gap,
    good("return q.items.Len()").replace(
        "type PriorityQueue []*QueueItem",
        "type PriorityQueue = []*QueueItem"
    )
);
negative!(
    go_field_owner_alias_gap,
    good("return q.items.Len()").replace("type TaskQueue struct", "type TaskQueue = struct")
);
#[test]
fn go_field_explicit_embedded_has_exact_target() {
    let source = source(
        "PriorityQueue",
        "[]*QueueItem",
        "PriorityQueue",
        "return q.PriorityQueue.Len()",
    );
    let fixture = Fixture::new(&source);
    assert_len(&fixture.runtime(), &source);
    let stored = fixture.stored();
    let arcs = stored["arcs"].as_array().unwrap();
    assert_eq!(arcs.len(), 1);
    assert_eq!(arcs[0]["evidence"]["confidence"], "PROVEN");
}
negative!(
    go_field_promoted_gap,
    good("return q.items.Len()")
        .replace("items PriorityQueue", "Inner")
        .replace(
            "type QueueItem",
            "type Inner struct { items PriorityQueue }; type QueueItem"
        )
);
negative!(
    go_field_generic_gap,
    good("return q.items.Len()").replace(
        "type PriorityQueue []*QueueItem",
        "type PriorityQueue[T any] []*T"
    )
);
negative!(
    go_field_qualified_gap,
    source(
        "items other.PriorityQueue",
        "[]*QueueItem",
        "PriorityQueue",
        "return q.items.Len()"
    )
);
negative!(go_field_chain_gap, good("return q.store.items.Len()"));
negative!(go_field_index_gap, good("return q.items[0].Len()"));
negative!(
    go_field_type_chain_gap,
    good("return q.items.Len()").replace(
        "type PriorityQueue []*QueueItem",
        "type Base []*QueueItem; type PriorityQueue Base"
    )
);
negative!(
    go_field_duplicate_type_gap,
    format!("{}\ntype PriorityQueue []int", good("return q.items.Len()"))
);
negative!(
    go_field_duplicate_owner_gap,
    format!(
        "{}\ntype TaskQueue struct {{ items PriorityQueue }}",
        good("return q.items.Len()")
    )
);
negative!(
    go_field_duplicate_field_gap,
    source(
        "items PriorityQueue; items PriorityQueue",
        "[]*QueueItem",
        "PriorityQueue",
        "return q.items.Len()"
    )
);
negative!(
    go_field_duplicate_method_gap,
    format!(
        "{}\nfunc (p *PriorityQueue) Len() int {{ return 2 }}",
        good("return q.items.Len()")
    )
);
negative!(
    go_field_function_field_gap,
    source(
        "items PriorityQueue",
        "struct { Len func() int }",
        "PriorityQueue",
        "return q.items.Len()"
    )
);
negative!(
    go_field_wrong_type_method_gap,
    good("return q.items.Len()").replace("func (p PriorityQueue) Len() int { return 1 }", "")
);
negative!(
    go_field_missing_type_gap,
    good("return q.items.Len()").replace("type PriorityQueue []*QueueItem", "")
);
negative!(
    go_field_receiver_shortvar_shadow_gap,
    good("q := other; return q.items.Len()")
);
negative!(
    go_field_receiver_write_gap,
    good("q = other; return q.items.Len()")
);
negative!(
    go_field_receiver_parameter_shadow_gap,
    good("return q.items.Len()").replace("Peek()", "Peek(q *TaskQueue)")
);
negative!(
    go_field_range_shadow_gap,
    good("for _, q := range values { q.items.Len() }; return 0")
);
negative!(
    go_field_receive_shadow_gap,
    good("select { case q := <-values: q.items.Len() }; return 0")
);
negative!(
    go_field_typeswitch_shadow_gap,
    good("switch q := value.(type) { case TaskQueue: q.items.Len() }; return 0")
);
negative!(
    go_field_closure_gap,
    good("f := func() int { return q.items.Len() }; _ = f; return 0")
);
negative!(
    go_field_another_receiver_gap,
    good("return other.items.Len()")
);
negative!(
    go_field_generic_owner_gap,
    good("return q.items.Len()").replace("type TaskQueue struct", "type TaskQueue[T any] struct")
);
negative!(
    go_field_unrelated_embedded_target_gap,
    source(
        "items PriorityQueue",
        "struct { Embedded }",
        "PriorityQueue",
        "return q.items.Len()"
    )
);
negative!(
    go_field_method_field_conflict_on_owner_gap,
    format!(
        "{}\nfunc (q TaskQueue) items() PriorityQueue {{ return nil }}",
        good("return q.items.Len()")
    )
);

negative!(
    go_field_duplicate_unnamed_method_gap,
    format!(
        "{}\nfunc (PriorityQueue) Len() int {{ return 2 }}",
        good("return q.items.Len()")
    )
);
negative!(
    go_field_double_pointer_gap,
    source(
        "items **PriorityQueue",
        "[]*QueueItem",
        "PriorityQueue",
        "return q.items.Len()"
    )
);
negative!(
    go_field_anonymous_struct_gap,
    source(
        "items struct { Len func() int }",
        "[]*QueueItem",
        "PriorityQueue",
        "return q.items.Len()"
    )
);

#[test]
fn go_field_proof_metadata_binds_caller_field_types_and_target_and_is_optional() {
    let source = good("return q.items.Len()");
    let fixture = Fixture::new(&source);
    let stored = fixture.stored();
    assert_eq!(stored["extraction_revision"], 21);
    let proofs: Vec<_> = stored["documents"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(|d| d.get("go_field_target"))
        .collect();
    assert_eq!(proofs.len(), 1);
    let proof = proofs[0];
    assert_eq!(proof["package"], "queue");
    for (key, name) in [
        ("caller", "Peek"),
        ("receiver_type", "TaskQueue"),
        ("field", "items"),
        ("field_type", "PriorityQueue"),
        ("target", "Len"),
    ] {
        let range = &proof[key];
        let start = range["start"].as_u64().unwrap() as usize;
        let end = range["end"].as_u64().unwrap() as usize;
        assert_eq!(&source[start..end], name);
    }
    assert!(
        stored["documents"]
            .as_array()
            .unwrap()
            .iter()
            .all(|d| !d.get("go_field_target").is_some_and(Value::is_null))
    );
}

#[test]
fn go_field_refresh_source_config_and_package_changes_rebind_or_remove_proof() {
    let source = good("return q.items.Len()");
    let fixture = Fixture::new(&source);
    let mut runtime = fixture.runtime();
    assert_len(&runtime, &source);
    // Own-file type identity is unaffected by an unrelated module replacement.
    fs::write(
        fixture.root.join("go.mod"),
        "module changed.test\ngo 1.23\nreplace unrelated.test => ./unrelated\n",
    )
    .unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_len(&runtime, &source);
    let renamed = source.replace("package queue", "package renamed");
    fs::write(fixture.root.join("queue/queue.go"), &renamed).unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_len(&runtime, &renamed);
    let unsupported = renamed.replace("items PriorityQueue", "items interface { Len() int }");
    fs::write(fixture.root.join("queue/queue.go"), unsupported).unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_eq!(trace(&runtime)["total"], 0);
    // Restore, then move the only right-type method to another file. Never guess.
    fs::write(fixture.root.join("queue/queue.go"), &source).unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_len(&runtime, &source);
    fs::write(
        fixture.root.join("queue/queue.go"),
        source.replace("func (p PriorityQueue) Len() int { return 1 }", ""),
    )
    .unwrap();
    fs::write(
        fixture.root.join("queue/moved.go"),
        "package queue\nfunc (p PriorityQueue) Len() int { return 1 }\n",
    )
    .unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_eq!(trace(&runtime)["total"], 0);
}

#[test]
fn go_field_revision_five_managed_migration_changes_generation_and_reextracts() {
    let source = good("return q.items.Len()");
    let fixture = Fixture::new(&source);
    let reader = GenerationReader::open_current(&fixture.state).unwrap();
    let mut stored = fixture.stored();
    stored["extraction_revision"] = serde_json::json!(5);
    stored["arcs"] = serde_json::json!([]);
    let mut snapshot = reader.snapshot().clone();
    let mut hasher = blake3::Hasher::new();
    hasher.update(snapshot.repo_revision.as_bytes());
    hasher.update(&5_u32.to_le_bytes());
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
    let old = GenerationReader::open_current(&managed).unwrap();
    let old_bytes = old.read_segment("nodes.seg").unwrap();
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
    assert_eq!(old.read_segment("nodes.seg").unwrap(), old_bytes);
    assert_len(&Runtime::open(&managed).unwrap(), &source);
}
