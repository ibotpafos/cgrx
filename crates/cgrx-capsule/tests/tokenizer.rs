use cgrx_capsule::Tokenizer;

#[test]
fn o200k_golden_counts_match_reference_vectors() {
    let tokenizer = Tokenizer::o200k_base().expect("compiled o200k pack");
    let vectors: Vec<(String, u32)> =
        serde_json::from_str(include_str!("golden_o200k.json")).expect("golden vectors");
    assert_eq!(vectors.len(), 100);
    for (text, expected) in vectors {
        assert_eq!(tokenizer.count(&text), expected, "text={text:?}");
    }
}

#[test]
fn compiled_pack_has_pinned_identity_and_no_runtime_fetch_surface() {
    let tokenizer = Tokenizer::o200k_base().expect("compiled o200k pack");
    assert_eq!(tokenizer.name(), "o200k_base");
    assert_eq!(tokenizer.source_size(), 3_613_922);
    assert_eq!(
        tokenizer.source_sha256(),
        "446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d"
    );
    assert_eq!(tokenizer.count("hello"), 1);
}
