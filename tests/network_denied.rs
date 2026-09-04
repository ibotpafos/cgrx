use std::fs;
use std::path::{Path, PathBuf};

fn repository_root() -> PathBuf {
    let start = option_env!("CARGO_MANIFEST_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|| std::env::current_dir().expect("current directory must be readable"));

    start
        .ancestors()
        .find(|candidate| candidate.join(".cgrx-disclosure-mode").is_file())
        .map(Path::to_path_buf)
        .expect("repository root must contain .cgrx-disclosure-mode")
}

fn read(root: &Path, relative: &str) -> String {
    fs::read_to_string(root.join(relative))
        .unwrap_or_else(|error| panic!("{relative} must be readable: {error}"))
}

fn assert_source_tree_is_offline(directory: &Path, forbidden_apis: &[&str]) {
    for entry in
        fs::read_dir(directory).unwrap_or_else(|error| panic!("{}: {error}", directory.display()))
    {
        let path = entry.expect("source entry must be readable").path();
        if path.is_dir() {
            assert_source_tree_is_offline(&path, forbidden_apis);
        } else if path.extension().and_then(|value| value.to_str()) == Some("rs") {
            let source = fs::read_to_string(&path)
                .unwrap_or_else(|error| panic!("{}: {error}", path.display()));
            for api in forbidden_apis {
                assert!(
                    !source.contains(api),
                    "{} uses forbidden network API {api}",
                    path.display()
                );
            }
        }
    }
}

#[test]
fn open_source_release_has_license_and_installation_docs() {
    let root = repository_root();
    assert_eq!(read(&root, ".cgrx-disclosure-mode"), "public\n");
    assert!(read(&root, "Cargo.toml").contains("license = \"MIT\""));
    assert!(read(&root, "LICENSE").contains("MIT License"));
    assert!(read(&root, "README.md").contains("cargo install"));
    assert!(read(&root, "docs/installation.md").contains("serve --multi-repo"));
    assert!(read(&root, "THIRD_PARTY_NOTICES.md").contains("tiktoken"));
}

#[test]
fn production_workspace_defaults_to_network_denied() {
    let root = repository_root();
    assert_eq!(
        std::env::var("CGRX_NETWORK").expect("Cargo must provide CGRX_NETWORK"),
        "deny"
    );
    let cargo_config = read(&root, ".cargo/config.toml");
    assert!(cargo_config.contains("CGRX_NETWORK"));
    assert!(cargo_config.contains("value = \"deny\""));
    assert!(cargo_config.contains("force = true"));

    let forbidden_manifest_dependencies = [
        "reqwest",
        "hyper",
        "ureq",
        "curl",
        "tokio",
        "async-std",
        "smol",
    ];
    let forbidden_source_apis = [
        "std::net",
        "tokio::net",
        "async_std::net",
        "reqwest::",
        "hyper::",
        "ureq::",
    ];

    let workspace_manifest = read(&root, "Cargo.toml");
    for dependency in forbidden_manifest_dependencies {
        assert!(
            !workspace_manifest.contains(dependency),
            "workspace declares network-capable dependency {dependency}"
        );
    }

    for entry in fs::read_dir(root.join("crates")).expect("crates directory must be readable") {
        let crate_dir = entry.expect("crate entry must be readable").path();
        if !crate_dir.is_dir() {
            continue;
        }

        let manifest = fs::read_to_string(crate_dir.join("Cargo.toml"))
            .unwrap_or_else(|error| panic!("{}: {error}", crate_dir.display()));
        for dependency in forbidden_manifest_dependencies {
            assert!(
                !manifest.contains(dependency),
                "{} declares network-capable dependency {dependency}",
                crate_dir.display()
            );
        }

        assert_source_tree_is_offline(&crate_dir.join("src"), &forbidden_source_apis);
    }
}
