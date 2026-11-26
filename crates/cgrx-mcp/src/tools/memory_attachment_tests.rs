use super::*;

#[test]
fn memory_attachment_cause_is_typed_and_limited_to_io_kind() {
    let mut server = Server::new(RepoSnapshot {
        repo_revision: "fixture".into(),
        working_tree_digest: Hash32([0; 32]),
        graph_generation: 1,
    });
    let error = server.memory_store().unwrap_err();
    assert_eq!(
        error.message,
        "memory requires a managed repository backend"
    );
    assert_eq!(error.data.unwrap()["code"], "cgrx.memory_unavailable");
    for kind in [
        std::io::ErrorKind::PermissionDenied,
        std::io::ErrorKind::NotADirectory,
        std::io::ErrorKind::InvalidInput,
        std::io::ErrorKind::Other,
    ] {
        server.memory_attachment_error = Some(kind);
        let error = server.memory_store().unwrap_err();
        assert_eq!(error.code, -32020);
        assert_eq!(
            error.message,
            format!("memory store attachment failed: {kind}; graph tools remain available")
        );
        let data = error.data.unwrap();
        assert_eq!(data["code"], "cgrx.memory_unavailable");
        assert_eq!(data["io_kind"], format!("{kind:?}"));
    }
}
