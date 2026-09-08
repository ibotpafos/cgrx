//! Local session analytics for CGRX usage logs.
//!
//! Strictly opt-in: nothing is recorded or exported unless `CGRX_METRICS_LOG`
//! is set. All aggregation happens locally over a usage log file; no network
//! calls are made.

mod summary;

pub use summary::{MetricsSummary, Summarize};

/// One tool-call event from a CGRX usage log (JSONL, `event: "tool_call"`).
#[derive(Clone, Debug, Eq, PartialEq, serde::Deserialize, serde::Serialize)]
pub struct UsageEvent {
    pub timestamp_ms: u64,
    #[serde(default)]
    pub client: String,
    #[serde(default)]
    pub session: String,
    pub tool: String,
    pub ok: bool,
    pub latency_us: u64,
    #[serde(default)]
    pub request_bytes: u64,
    pub response_bytes: u64,
}

/// Lightweight marker used to filter JSONL lines before full parsing.
#[derive(serde::Deserialize)]
struct UsageEventKind {
    event: String,
}

/// Parse usage events from a JSONL reader.
///
/// Lines that are empty, non-`tool_call`, or malformed are counted in
/// `ignored` and skipped — the same tolerance as the existing usage-report
/// path in the CLI.
pub fn parse_events(reader: impl std::io::BufRead) -> (Vec<UsageEvent>, u64) {
    let mut events = Vec::new();
    let mut ignored: u64 = 0;
    for line in reader.lines() {
        let line = match line {
            Ok(line) => line,
            Err(_) => {
                ignored = ignored.saturating_add(1);
                continue;
            }
        };
        if line.trim().is_empty() {
            continue;
        }
        let kind: UsageEventKind = match serde_json::from_str(&line) {
            Ok(kind) => kind,
            Err(_) => {
                ignored = ignored.saturating_add(1);
                continue;
            }
        };
        if kind.event != "tool_call" {
            ignored = ignored.saturating_add(1);
            continue;
        }
        match serde_json::from_str::<UsageEvent>(&line) {
            Ok(event) => events.push(event),
            Err(_) => ignored = ignored.saturating_add(1),
        }
    }
    (events, ignored)
}

/// Parse usage events from a file path.
pub fn parse_events_from_path(path: &std::path::Path) -> std::io::Result<(Vec<UsageEvent>, u64)> {
    let file = std::fs::File::open(path)?;
    let reader = std::io::BufReader::new(file);
    Ok(parse_events(reader))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_filters_non_tool_call_lines() {
        let jsonl = "\
{\"event\":\"session_start\",\"timestamp_ms\":1}
{\"event\":\"tool_call\",\"timestamp_ms\":2,\"client\":\"c\",\"session\":\"s\",\"tool\":\"orient\",\"ok\":true,\"latency_us\":100,\"request_bytes\":10,\"response_bytes\":20}
{\"event\":\"tool_call\",\"timestamp_ms\":3,\"client\":\"c\",\"session\":\"s\",\"tool\":\"status\",\"ok\":false,\"latency_us\":50,\"request_bytes\":5,\"response_bytes\":0}
";
        let (events, ignored) = parse_events(jsonl.as_bytes());
        assert_eq!(events.len(), 2);
        assert_eq!(ignored, 1);
        assert_eq!(events[0].tool, "orient");
        assert!(events[0].ok);
        assert_eq!(events[0].latency_us, 100);
        assert_eq!(events[1].tool, "status");
        assert!(!events[1].ok);
    }

    #[test]
    fn parse_skips_blank_and_malformed_lines() {
        let jsonl = "\
{\"event\":\"tool_call\",\"timestamp_ms\":1,\"client\":\"c\",\"session\":\"s\",\"tool\":\"t\",\"ok\":true,\"latency_us\":1,\"request_bytes\":1,\"response_bytes\":1}

not-json
{\"event\":\"tool_call\",\"timestamp_ms\":2,\"client\":\"c\",\"session\":\"s\",\"tool\":\"t\",\"ok\":true,\"latency_us\":2,\"request_bytes\":2,\"response_bytes\":2}
";
        let (events, ignored) = parse_events(jsonl.as_bytes());
        assert_eq!(events.len(), 2);
        assert_eq!(ignored, 1);
    }
}
