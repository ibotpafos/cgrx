use cgrx_languages::ts_imports::{ImportClassification, TsFileFacts, classify_call};
use std::collections::BTreeMap;

#[test]
fn public_api_requires_complete_current_site_facts() {
    let source = "import { actual as run } from './api'; function caller() { run(123); }";
    let start = source.find("run(123)").unwrap();
    let call = [start, start + "run(123)".len()];
    let mut files = BTreeMap::from([
        (
            "main.ts".to_owned(),
            TsFileFacts::parse("main.ts", source.as_bytes()),
        ),
        (
            "api.ts".to_owned(),
            TsFileFacts::parse("api.ts", b"export function actual() {}"),
        ),
    ]);
    let exact = classify_call(&files, "main.ts", call);
    assert_eq!(exact.call, call);
    assert!(matches!(
        exact.classification,
        ImportClassification::Exact(_)
    ));
    assert_eq!(
        classify_call(&files, "main.ts", [start, start + 3]).classification,
        ImportClassification::Rejected
    );
    let original = files["main.ts"].clone();
    files.get_mut("main.ts").unwrap().valid = false;
    let invalid = classify_call(&files, "main.ts", call);
    assert_eq!(invalid.caller, exact.caller);
    assert_eq!(invalid.classification, ImportClassification::Rejected);
    files.insert("main.ts".to_owned(), original.clone());
    files.get_mut("main.ts").unwrap().sites.clear(); // Older persisted facts.
    assert_eq!(
        classify_call(&files, "main.ts", call).classification,
        ImportClassification::Rejected
    );
    files.insert("main.ts".to_owned(), original);
    let duplicate = files["main.ts"].sites[0].clone();
    files.get_mut("main.ts").unwrap().sites.push(duplicate);
    assert_eq!(
        classify_call(&files, "main.ts", call).classification,
        ImportClassification::Rejected
    );
}
