use std::io::Write;
use std::path::PathBuf;

use cgrx_metrics::{Summarize, parse_events_from_path};

fn metrics_dir() -> PathBuf {
    let nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let path = std::env::temp_dir().join(format!(
        "cgrx-metrics-test-{}-{}",
        std::process::id(),
        nonce
    ));
    std::fs::create_dir(&path).unwrap();
    path
}

fn write_metrics_line(
    path: &std::path::Path,
    tool: &str,
    ok: bool,
    latency_us: u64,
    response_bytes: u64,
) {
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .unwrap();
    let event = serde_json::json!({
        "event":"tool_call",
        "timestamp_ms":1,
        "client":"test",
        "session":"s1",
        "tool":tool,
        "ok":ok,
        "latency_us":latency_us,
        "request_bytes":10,
        "response_bytes":response_bytes,
    });
    writeln!(file, "{event}").unwrap();
}

#[test]
fn parse_metrics_events_round_trip() {
    let dir = metrics_dir();
    let path = dir.join("metrics.jsonl");
    write_metrics_line(&path, "orient", true, 100, 500);
    write_metrics_line(&path, "status", false, 50, 0);

    let (events, ignored) = parse_events_from_path(&path).unwrap();
    assert_eq!(events.len(), 2);
    assert_eq!(ignored, 0);
    assert_eq!(events[0].tool, "orient");
    assert_eq!(events[0].latency_us, 100);
    assert!(!events[1].ok);
}

#[test]
fn metrics_summary_aggregates_tool_stats() {
    let dir = metrics_dir();
    let path = dir.join("metrics.jsonl");
    write_metrics_line(&path, "orient", true, 100, 1000);
    write_metrics_line(&path, "orient", false, 200, 0);
    write_metrics_line(&path, "status", true, 50, 0);

    let (events, ignored) = parse_events_from_path(&path).unwrap();
    let summary = (events, ignored).summarize();

    assert_eq!(summary.events, 3);
    assert_eq!(summary.ignored_events, 0);
    assert_eq!(summary.tools.len(), 2);

    let orient = summary.tools.iter().find(|t| t.tool == "orient").unwrap();
    assert_eq!(orient.calls, 2);
    assert_eq!(orient.ok, 1);
    assert_eq!(orient.errors, 1);
    assert!((orient.error_rate - 0.5).abs() < f64::EPSILON);
    assert_eq!(orient.latency.p50, 100);
    assert_eq!(orient.latency.p95, 200);
    assert_eq!(orient.response_bytes.sum, 1000);

    assert_eq!(summary.top_by_response_bytes, vec!["orient".to_owned()]);
}
