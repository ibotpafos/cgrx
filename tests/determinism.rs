use cgrx_languages::pack_for_path;
use std::path::Path;

#[test]
fn language_extraction_hash_is_stable_across_one_hundred_replays() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../fixtures/adversarial/cases");
    for relative in [
        "ts-direct-call/repo/src/main.ts",
        "ts-parser-error-range/repo/src/main.ts",
        "py-direct-call/repo/src/main.py",
        "py-parser-error-range/repo/src/main.py",
        "go-direct-call/repo/backend/service.go",
        "go-parser-error-range/repo/backend/broken.go",
    ] {
        let source_path = root.join(relative);
        let source = std::fs::read(&source_path).unwrap();
        let path = Path::new(relative.split_once("/repo/").unwrap().1);
        let pack = pack_for_path(path).unwrap();
        let expected = pack.extract(path, &source).unwrap().stable_hash();
        for _ in 0..100 {
            assert_eq!(pack.extract(path, &source).unwrap().stable_hash(), expected);
        }
    }
}
