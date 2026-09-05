use super::*;

fn files(input: &[(&str, &str)]) -> BTreeMap<String, TsFileFacts> {
    input
        .iter()
        .map(|(p, s)| (p.to_string(), TsFileFacts::parse(p, s.as_bytes())))
        .collect()
}
fn target(input: &[(&str, &str)]) -> Option<ResolvedImport> {
    let map = files(input);
    let start = input[0].1.rfind("run()").unwrap();
    resolve_call(&map, input[0].0, start)
}
#[test]
fn named_alias_uses_exact_export_not_same_name_decoy() {
    let source = "export function actual() {}";
    let result = target(&[
        (
            "main.ts",
            "import { actual as run } from './api'; function caller() { run(); }",
        ),
        ("api.ts", source),
        ("decoy.ts", "export function run() {}"),
    ])
    .unwrap();
    assert_eq!(result.path, "api.ts");
    assert_eq!(
        result.target,
        [
            source.find("actual").unwrap(),
            source.find("actual").unwrap() + 6
        ]
    );
    assert_eq!(result.dependencies, ["main.ts", "api.ts"]);
}
#[test]
fn index_module_and_named_reexport_chain() {
    let result = target(&[
        (
            "main.ts",
            "import { publicName as run } from './api'; function caller() { run(); }",
        ),
        (
            "api/index.ts",
            "export { actual as publicName } from '../implementation';",
        ),
        (
            "implementation.ts",
            "function actual() {} export { actual };",
        ),
    ])
    .unwrap();
    assert_eq!(result.path, "implementation.ts");
    assert_eq!(
        result.dependencies,
        ["main.ts", "api/index.ts", "implementation.ts"]
    );
}
#[test]
fn relative_parent_module_and_local_import_reexport() {
    let result = target(&[
        (
            "dir/main.ts",
            "import { exported as run } from '../api'; function caller() { run(); }",
        ),
        (
            "api.ts",
            "import { actual as local } from './implementation'; export { local as exported };",
        ),
        ("implementation.ts", "export function actual() {}"),
    ])
    .unwrap();
    assert_eq!(result.path, "implementation.ts");
}
#[test]
fn shadowing_and_unexported_targets_are_not_proof() {
    for caller in [
        "import { run } from './api'; function caller(run: () => void) { run(); }",
        "import { run } from './api'; function caller() { const run = () => 0; run(); }",
        "import { run } from './api'; function caller() { { let run; run(); } }",
        "import { run } from './api'; function caller() { run = other; run(); }",
    ] {
        assert!(
            target(&[("main.ts", caller), ("api.ts", "export function run() {}")]).is_none(),
            "{caller}"
        );
    }
    assert!(
        target(&[
            (
                "main.ts",
                "import { run } from './api'; function caller() { run(); }"
            ),
            ("api.ts", "function run() {}"),
            ("decoy.ts", "export function run() {}"),
        ])
        .is_none()
    );
}
#[test]
fn ambiguous_module_candidates_are_not_guessed() {
    for other in ["api.tsx", "api/index.ts", "api.js", "api.d.ts"] {
        assert!(
            target(&[
                (
                    "main.ts",
                    "import { run } from './api'; function caller() { run(); }"
                ),
                ("api.ts", "export function run() {}"),
                (other, "export function run() {}"),
            ])
            .is_none(),
            "{other}"
        );
    }
}
#[test]
fn cycles_type_only_and_star_reexports_are_gaps() {
    for api in [
        "export * from './implementation';",
        "export type { run } from './implementation';",
        "export { type run } from './implementation';",
        "export { run } from './api';",
        "export { run } from 'external';",
    ] {
        assert!(
            target(&[
                (
                    "main.ts",
                    "import { run } from './api'; function caller() { run(); }"
                ),
                ("api.ts", api),
                ("implementation.ts", "export function run() {}"),
            ])
            .is_none(),
            "{api}"
        );
    }
}

#[test]
fn duplicate_default_binding_does_not_establish_import_identity() {
    assert!(target(&[
        ("main.ts", "import run from './other'; import { actual as run } from './api'; function caller() { run(); }"),
        ("api.ts", "export function actual() {}"),
    ]).is_none());
}

#[test]
fn nested_namespace_export_is_not_a_module_export() {
    assert!(
        target(&[
            (
                "main.ts",
                "import { run } from './api'; function caller() { run(); }"
            ),
            (
                "api.ts",
                "function local() {} export namespace N { export { local as run }; }"
            ),
        ])
        .is_none()
    );
}

#[test]
fn reassigned_import_reexport_is_not_proof() {
    assert!(
        target(&[
            (
                "main.ts",
                "import { run } from './api'; function caller() { run(); }"
            ),
            (
                "api.ts",
                "import { actual as run } from './implementation'; run = other; export { run };"
            ),
            ("implementation.ts", "export function actual() {}"),
        ])
        .is_none()
    );
}

#[test]
fn duplicate_export_mutated_target_and_type_import_are_gaps() {
    for api in [
        "export function run() {} run = other;",
        "export function run() {} export { run };",
        "export function run() {} function run() {}",
    ] {
        assert!(
            target(&[
                (
                    "main.ts",
                    "import { run } from './api'; function caller() { run(); }"
                ),
                ("api.ts", api),
            ])
            .is_none(),
            "{api}"
        );
    }
    for import in ["import type { run }", "import { type run }"] {
        let source = format!("{import} from './api'; function caller() {{ run(); }}");
        assert!(target(&[("main.ts", &source), ("api.ts", "export function run() {}")]).is_none());
    }
}

#[test]
fn sibling_shadow_write_does_not_erase_valid_import_call() {
    assert!(target(&[
        ("main.ts", "import { run } from './api'; function sibling(run) { run = other; } function caller() { run(); }"),
        ("api.ts", "export function run() {}"),
    ]).is_some());
}

#[test]
fn package_directory_redirect_is_not_ignored() {
    assert!(
        target(&[
            (
                "main.ts",
                "import { run } from './api'; function caller() { run(); }"
            ),
            ("api/index.ts", "export function run() {}"),
            ("api/package.json", "{\"types\": \"other.d.ts\"}"),
        ])
        .is_none()
    );
}

#[test]
fn explicit_ts_path_and_tsx_are_supported() {
    for path in ["api.ts", "api.tsx"] {
        let source =
            format!("import {{ actual as run }} from './{path}'; function caller() {{ run(); }}");
        assert_eq!(
            target(&[("main.ts", &source), (path, "export function actual() {}")])
                .unwrap()
                .path,
            path
        );
    }
}

#[test]
fn reexport_bound_and_missing_paths_are_explicit_gaps() {
    let mut input = vec![(
        "main.ts".to_string(),
        "import { run } from './n0'; function caller() { run(); }".to_string(),
    )];
    for i in 0..9 {
        input.push((
            format!("n{i}.ts"),
            format!("export {{ run }} from './n{}';", i + 1),
        ));
    }
    input.push(("n9.ts".to_owned(), "export function run() {}".to_owned()));
    let borrowed: Vec<_> = input
        .iter()
        .map(|(p, s)| (p.as_str(), s.as_str()))
        .collect();
    assert!(target(&borrowed).is_none());
    for module in ["../../escape", "./missing", "external", "./api.js"] {
        let source = format!("import {{ run }} from '{module}'; function caller() {{ run(); }}");
        assert!(
            target(&[("main.ts", &source), ("api.ts", "export function run() {}")]).is_none(),
            "{module}"
        );
    }
}

#[test]
fn unchanged_relationship_fixture_resolves_with_exact_facts() {
    let caller = include_str!("../../../fixtures/relationship-eval/ts_caller.ts");
    let target_source = include_str!("../../../fixtures/relationship-eval/ts_target.ts");
    let map = files(&[("ts_caller.ts", caller), ("ts_target.ts", target_source)]);
    let result = resolve_call(&map, "ts_caller.ts", caller.find("tsTarget()").unwrap()).unwrap();
    assert_eq!(result.path, "ts_target.ts");
    assert_eq!(
        result.target,
        [
            target_source.find("tsTarget").unwrap(),
            target_source.find("tsTarget").unwrap() + 8
        ]
    );
}

#[test]
fn decorator_and_parameter_initializer_are_not_body_calls() {
    for source in [
        "import { run } from './api'; class C { @run() method() {} }",
        "import { run } from './api'; function caller(value = run()) {}",
    ] {
        assert!(
            target(&[("main.ts", source), ("api.ts", "export function run() {}")]).is_none(),
            "{source}"
        );
    }
}

#[test]
fn unsupported_star_does_not_erase_explicit_export() {
    let result = target(&[
        (
            "main.ts",
            "import { run } from './api'; function caller() { run(); }",
        ),
        (
            "api.ts",
            "export * from './other'; export function run() {}",
        ),
        ("other.ts", "export function run() {}"),
    ])
    .unwrap();
    assert_eq!(result.path, "api.ts");
}

#[test]
fn hoisted_var_collision_does_not_preserve_export_identity() {
    for api in [
        "export function run() {} { var run = other; }",
        "export function run() {} for (var run of values) {}",
    ] {
        assert!(
            target(&[
                (
                    "main.ts",
                    "import { run } from './api'; function caller() { run(); }"
                ),
                ("api.ts", api),
            ])
            .is_none(),
            "{api}"
        );
    }
}
