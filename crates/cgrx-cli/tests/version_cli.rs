use std::io::{Read, Write};
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};

// Explicit local CLI subprocesses, bounded capture and exit/pipe deadlines.
fn invoke(args: &[&str], input: &[u8]) -> (i32, String, String) {
    let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("spawn own test binary");
    let (sender, receiver) = mpsc::channel();
    let pipes: Vec<Box<dyn Read + Send>> = vec![
        Box::new(child.stdout.take().unwrap()),
        Box::new(child.stderr.take().unwrap()),
    ];
    for (index, pipe) in pipes.into_iter().enumerate() {
        let sender = sender.clone();
        thread::spawn(move || {
            let mut bytes = Vec::new();
            pipe.take(65537).read_to_end(&mut bytes).unwrap();
            let _ = sender.send((index, bytes));
        });
    }
    drop(sender);
    // Inputs here are fixed, smaller than a pipe buffer; EOF ends serve.
    child.stdin.take().unwrap().write_all(input).unwrap();
    let deadline = Instant::now() + Duration::from_secs(10);
    let mut timed_out = false;
    let status = loop {
        if let Some(status) = child.try_wait().unwrap() {
            break status;
        }
        if Instant::now() >= deadline {
            let _ = child.kill();
            timed_out = true;
        }
        assert!(
            Instant::now() < deadline + Duration::from_secs(2),
            "child cleanup deadline"
        );
        thread::sleep(Duration::from_millis(5));
    };
    assert!(!timed_out, "CLI exit deadline");
    let mut output = [String::new(), String::new()];
    for _ in 0..2 {
        let (index, bytes) = receiver
            .recv_timeout(Duration::from_secs(2))
            .expect("pipe deadline");
        assert!(bytes.len() <= 65536, "output budget");
        output[index] = String::from_utf8(bytes).unwrap();
    }
    (status.code().unwrap(), output[0].clone(), output[1].clone())
}

#[test]
fn version_flags_print_only_the_package_version() {
    for flag in ["--version", "-V"] {
        for _ in 0..2 {
            let (code, stdout, stderr) = invoke(&[flag], b"");
            assert_eq!(code, 0, "{flag}");
            assert_eq!(stdout, concat!("cgrx ", env!("CARGO_PKG_VERSION"), "\n"));
            assert_eq!(stderr, "");
        }
    }
}

#[test]
fn version_flags_reject_trailing_arguments() {
    for flag in ["--version", "-V"] {
        let (code, stdout, stderr) = invoke(&[flag, "serve"], b"");
        assert_eq!(code, 2);
        assert_eq!(stdout, "");
        assert_eq!(stderr, "cgrx: version accepts no arguments\n");
    }
}

#[test]
fn serve_stdout_remains_jsonrpc_without_a_version_banner() {
    let input = b"{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{},\"clientInfo\":{\"name\":\"version-cli-test\",\"version\":\"1\"}}}\n";
    let (code, stdout, stderr) = invoke(&["serve", "--multi-repo"], input);
    assert_eq!(code, 0);
    assert_eq!(stderr, "");
    assert_eq!(stdout.lines().count(), 1);
    let response: serde_json::Value = serde_json::from_str(stdout.trim()).unwrap();
    assert_eq!(response["jsonrpc"], "2.0");
    assert_eq!(response["id"], 1);
    assert!(response.get("error").is_none());
    assert_eq!(
        response["result"]["serverInfo"]["version"],
        env!("CARGO_PKG_VERSION")
    );
}
