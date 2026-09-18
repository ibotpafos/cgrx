#!/usr/bin/env python3
"""One-shot development preparation; removed together with its workflow before review."""
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def edit(path, old, new, count=1):
    target = ROOT / path
    text = target.read_text()
    actual = text.count(old)
    if actual != count:
        raise RuntimeError(f'{path}: expected {count} edit anchors, found {actual}: {old[:80]!r}')
    target.write_text(text.replace(old, new))

for crate, feature in [('cgrx-languages', '[]'), ('cgrx-cli', '["cgrx-languages/experimental-php"]')]:
    path = ROOT / 'crates' / crate / 'Cargo.toml'
    text = path.read_text()
    if '[features]' in text:
        raise RuntimeError('Review existing feature table before modifying it')
    path.write_text(text + '\n[features]\n# Validation-only opt-in; never enabled by a default or release build.\nexperimental-php = ' + feature + '\n')

lib = 'crates/cgrx-languages/src/lib.rs'
edit(lib, '#[cfg(test)]\nmod php;', '#[cfg(any(test, feature = "experimental-php"))]\nmod php;')
edit(lib, 'pub use go::{', '/// Effective registry policy, including Cargo dependency feature unification.\npub const EXPERIMENTAL_PHP_ENABLED: bool = cfg!(feature = "experimental-php");\n\npub use go::{')
edit(lib, 'assert!(pack_for_path(Path::new(&path)).is_none(), "{path}");', 'assert_eq!(\n                    pack_for_path(Path::new(&path)).is_some(),\n                    pack.id() == "php" && EXPERIMENTAL_PHP_ENABLED,\n                    "{path}"\n                );')
edit(lib, 'fn experimental_grammars_compile_without_runtime_registration()', 'fn experimental_grammars_follow_the_explicit_build_policy()')

pack = 'crates/cgrx-languages/src/pack.rs'
edit(pack, 'pub enum Provenance {\n    Syntax,', 'pub enum Provenance {\n    Syntax,\n    /// Exact names of a PHP caller and its unconditional same-file global target.\n    PhpFunction { caller: Span, target: Span },')
edit(pack, '            if let Provenance::RustModule { caller, target } = edge.provenance {', '            if let Provenance::PhpFunction { caller, target } = edge.provenance {\n                update(&mut hasher, b"php_function_caller", "", caller);\n                update(&mut hasher, b"php_function_target", "", target);\n            }\n            if let Provenance::RustModule { caller, target } = edge.provenance {')
edit(pack, '    [\n        &crate::c::C_PACK as &dyn LanguagePack,', '    let pack = [\n        &crate::c::C_PACK as &dyn LanguagePack,')
edit(pack, '    .find(|pack| pack.extensions().contains(&extension))\n}', '    .find(|pack| pack.extensions().contains(&extension));\n    // Separate validation policy: not part of the reviewed default registry.\n    #[cfg(feature = "experimental-php")]\n    if pack.is_none() && crate::php::PHP_PACK.extensions().contains(&extension) {\n        return Some(&crate::php::PHP_PACK);\n    }\n    pack\n}')

php = 'crates/cgrx-languages/src/php.rs'
edit(php, 'functions: BTreeMap<String, Option<String>>,', 'functions: BTreeMap<String, Option<(String, Span)>>,')
edit(php, '.or_insert_with(|| unconditional.then_some(spelling));', '.or_insert_with(|| unconditional.then_some((spelling, Span::from(name))));')
edit(php, 'fn inside_named_body(node: Node<\'_>) -> bool {', 'fn named_body_owner(node: Node<\'_>) -> Option<Span> {')
edit(php, '"anonymous_function" | "arrow_function" => return false,', '"anonymous_function" | "arrow_function" => return None,')
edit(php, '''                return owner.child_by_field_name("body").is_some_and(|body| {
                    body.start_byte() <= node.start_byte() && node.end_byte() <= body.end_byte()
                });''', '''                let body = owner.child_by_field_name("body")?;
                if body.start_byte() <= node.start_byte() && node.end_byte() <= body.end_byte() {
                    return owner.child_by_field_name("name").map(Span::from);
                }
                return None;''')
edit(php, '    false\n}\n\nfn classify(', '    None\n}\n\nfn classify(')
edit(php, '''                && inside_named_body(node)
                && let Some(target) = target
            {
                edge(RelationKind::Calls, target.clone(), node, extraction);''', '''                && let Some(caller) = named_body_owner(node)
                && let Some((target, target_span)) = target
            {
                extraction.edges.push(Edge {
                    relation: RelationKind::Calls,
                    target: target.clone(),
                    span: Span::from(node),
                    context_span: Span::from(node),
                    provenance: Provenance::PhpFunction { caller, target: *target_span },
                });''')

runtime = 'crates/cgrx-cli/src/runtime.rs'
edit(runtime, 'mod observations;', 'mod observations;\nmod php_resolution;')
edit(runtime, 'const EXTRACTION_REVISION: u32 = 29;', '''// Read the effective dependency policy, not just this crate's feature flag:
// Cargo may enable cgrx-languages/experimental-php through another workspace member.
const EXTRACTION_REVISION: u32 = if cgrx_languages::EXPERIMENTAL_PHP_ENABLED { 30 } else { 29 };''')
edit(runtime, 'struct StoredDocument {', 'struct StoredDocument {\n    #[serde(default, skip_serializing_if = "Option::is_none")]\n    php_function_target: Option<Box<php_resolution::PhpFunctionTarget>>,')

# Keep every explicit document initializer complete, including existing tests.
for path in (ROOT / 'crates/cgrx-cli').rglob('*.rs'):
    text = path.read_text()
    updated, count = re.subn(r'^(\s*)rust_module_target: None,', r'\1php_function_target: None,\1rust_module_target: None,', text, flags=re.M)
    if count:
        path.write_text(updated)
        print(f'Completed {count} document initializers in {path.relative_to(ROOT)}')

extraction = 'crates/cgrx-cli/src/runtime/extraction.rs'
edit(extraction, '    let edges = extraction.edges;', '''    let edges = extraction.edges;
    let php_targets: BTreeSet<_> = edges.iter().filter_map(|edge| {
        if let LanguageProvenance::PhpFunction { target, .. } = edge.provenance {
            Some(target)
        } else { None }
    }).collect();
    let php_source_hash = (!php_targets.is_empty())
        .then(|| Hash32(*blake3::hash(source).as_bytes()));''')
edit(extraction, '''                vec!["TS_LEXICAL_ARROW".to_owned()]
            } else {''', '''                vec!["TS_LEXICAL_ARROW".to_owned()]
            } else if php_targets.contains(&symbol.span) {
                vec!["PHP_GLOBAL_FUNCTION".to_owned()]
            } else {''')
edit(extraction, '            LanguageProvenance::Syntax\n            | LanguageProvenance::GoFieldReceiver', '            LanguageProvenance::Syntax\n            | LanguageProvenance::PhpFunction { .. }\n            | LanguageProvenance::GoFieldReceiver')
edit(extraction, '''        documents.push(StoredDocument {
            semantic_fingerprint: None,
            go_field_target: match edge.provenance {''', '''        let call_text = if matches!(edge.provenance, LanguageProvenance::PhpFunction { .. }) {
            String::from_utf8_lossy(&source[edge.span.start..edge.span.end]).into_owned()
        } else {
            String::from_utf8_lossy(&slice.bytes).into_owned()
        };
        documents.push(StoredDocument {
            php_function_target: match edge.provenance {
                LanguageProvenance::PhpFunction { caller, target } => {
                    Some(Box::new(super::php_resolution::PhpFunctionTarget {
                        source_hash: php_source_hash.expect("PHP target identity was collected"),
                        caller: ByteRange::new(caller.start, caller.end),
                        target: ByteRange::new(target.start, target.end),
                    }))
                }
                _ => None,
            },
            semantic_fingerprint: None,
            go_field_target: match edge.provenance {''')
p = ROOT / extraction
text = p.read_text()
old = '''            text: String::from_utf8_lossy(&slice.bytes).into_owned(),
            search_text: String::from_utf8_lossy(&slice.bytes).into_owned(),'''
if old not in text:
    raise RuntimeError('Exact call text anchor missing')
p.write_text(text.replace(old, '            text: call_text.clone(),\n            search_text: call_text,', 1))
edit(extraction, '            semantic_tags: if matches!(edge.provenance, LanguageProvenance::RustModule { .. }) {', '''            semantic_tags: if matches!(edge.provenance, LanguageProvenance::PhpFunction { .. }) {
                vec!["EXACT_CALL".to_owned(), "PHP_FUNCTION_CALL".to_owned()]
            } else if matches!(edge.provenance, LanguageProvenance::RustModule { .. }) {''')

arcs = 'crates/cgrx-cli/src/runtime/arc_resolution.rs'
edit(arcs, 'use super::ts_config::{self, TsResolutionConfig};', 'use super::php_resolution;\nuse super::ts_config::{self, TsResolutionConfig};')
edit(arcs, '.any(|tag| tag == "TS_LEXICAL_ARROW")\n        {', '.any(|tag| tag == "TS_LEXICAL_ARROW")\n            && !php_resolution::is_php_path(&document.path)\n        {')
edit(arcs, '    let mut arcs = Vec::new();', '    let mut arcs = php_resolution::rebuild(documents, path_hashes);')
edit(arcs, '        document.provenance == "CALLS"\n            && document.semantic_tags', '        document.provenance == "CALLS"\n            && !php_resolution::is_php_path(&document.path)\n            && document.semantic_tags')
for relation in ['REFERENCES', 'IMPORTS']:
    edit(arcs, f'filter(|d| d.provenance == "{relation}")', f'filter(|d| d.provenance == "{relation}" && !php_resolution::is_php_path(&d.path))')

scan = 'crates/cgrx-cli/src/runtime/scan_helpers.rs'
edit(scan, '    refresh_qualified_call_gaps(stored);', '    super::php_resolution::normalize(stored);\n    refresh_qualified_call_gaps(stored);')
edit(scan, '            doc.go_import_path.is_some()', '            doc.go_import_path.is_some()\n                || (doc.provenance == "CALLS" && super::php_resolution::is_php_path(&doc.path))')

expected = 'if cgrx_languages::EXPERIMENTAL_PHP_ENABLED { 30 } else { 29 }'
for path in ['crates/cgrx-cli/tests/go_field.rs', 'crates/cgrx-cli/tests/ts_lexical.rs']:
    edit(path, 'assert_eq!(stored["extraction_revision"], 29);', f'assert_eq!(stored["extraction_revision"], {expected});')
edit('crates/cgrx-cli/src/runtime/tests.rs', 'assert_eq!(EXTRACTION_REVISION, 29);', f'assert_eq!(EXTRACTION_REVISION, {expected});')

migration = 'crates/cgrx-cli/tests/language_policy_migration.rs'
edit(migration, 'assert_eq!(expected.indexed_files, 1);', 'assert_eq!(expected.indexed_files, if cgrx_languages::EXPERIMENTAL_PHP_ENABLED { 7 } else { 1 });')
edit(migration, '''        assert!(runtime.coverage().excluded_paths.contains(&path));
        assert!(current_stored["path_hashes"].get(&path).is_none());''', '''        let excluded = cgrx_languages::pack_for_path(Path::new(&path)).is_none();
        assert_eq!(runtime.coverage().excluded_paths.contains(&path), excluded);
        assert_eq!(current_stored["path_hashes"].get(&path).is_none(), excluded);''')

# Reviewable local validation corpus; NOT appended to the historical real-task corpus.
source = '''<?php
// UTF-8: Привет
use Vendor\\Payload as Item;
function Helper(Item $value): Item { return $value; }
function caller(Item $value): Item { return HELPER($value); }
function dynamic($receiver, $name, $value) { return $receiver->$name($value); }
class Decoy { public function Helper() {} }
'''.encode()
def span(snippet, after=None):
    start = source.index(snippet.encode(), source.index(after.encode()) if after else 0)
    return {'start': start, 'end': start + len(snippet.encode())}
cells = {
    'CALLS': {'target': 'Helper', 'span': span('HELPER($value)')},
    'IMPORTS': {'target': 'Vendor\\Payload', 'span': span('Vendor\\Payload as Item')},
    'REFERENCE': {'target': 'Item', 'span': span('Item', 'function Helper')},
    'UNRESOLVED': {'target': None, 'span': span('$receiver->$name($value)')},
}
case_list = []
for extension in ['php', 'phtml', 'php3', 'php4', 'php5', 'phps']:
    path = f'fixtures/php-validation/sample.{extension}'
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(source)
    case_list.append({'extension': extension, 'path': path, 'sha256': hashlib.sha256(source).hexdigest(), 'cells': cells, 'caller': {'symbol': 'caller', 'span': span('caller', 'function caller')}, 'target': {'symbol': 'Helper', 'span': span('Helper', 'function Helper')}})
manifest = {'schema_version': 1, 'maturity': 'experimental', 'relations': list(cells), 'cases': case_list}
(ROOT / 'contracts/php_validation_v1.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
print('Prepared exact PHP runtime validation policy and 24 local evidence cells.')
