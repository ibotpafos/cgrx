use std::collections::{BTreeMap, BTreeSet};
use std::env;
use std::io::{Read, Write};
use std::path::Path;
use std::time::Duration;

use cgrx_retrieval::CandidateSet;
use serde::{Deserialize, Serialize};

use super::SemanticRerankReport;

pub(super) const MAX_CANDIDATES: usize = 12;
const MAX_TEXT_CHARS: usize = 1_200;
const MAX_RESPONSE_BYTES: u64 = 64 * 1024;
const DEFAULT_TIMEOUT_MS: u64 = 750;
const SCHEMA: &str = "cgrx.semantic-rerank.v1";

#[derive(Serialize)]
struct Request<'a> {
    schema: &'static str,
    task: &'a str,
    candidates: Vec<RequestCandidate>,
}

#[derive(Serialize)]
struct RequestCandidate {
    node_id: u64,
    qualified_name: String,
    path: String,
    text: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Response {
    schema: String,
    scores: Vec<ResponseScore>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct ResponseScore {
    node_id: u64,
    relevance: u16,
}

pub(super) fn apply_from_env(
    task: &str,
    candidates: &mut CandidateSet,
    text_by_node: &BTreeMap<u64, String>,
) -> Option<SemanticRerankReport> {
    let socket = env::var_os("CGRX_SEMANTIC_RERANK_SOCKET")?;
    let timeout_ms = env::var("CGRX_SEMANTIC_RERANK_TIMEOUT_MS")
        .ok()
        .and_then(|value| value.parse::<u64>().ok())
        .filter(|value| (1..=10_000).contains(value))
        .unwrap_or(DEFAULT_TIMEOUT_MS);
    let scored = apply_from_socket(
        task,
        candidates,
        text_by_node,
        Path::new(&socket),
        Duration::from_millis(timeout_ms),
    );
    Some(match scored {
        Ok(candidates_scored) => SemanticRerankReport {
            backend: "local_unix_socket".to_owned(),
            status: "applied".to_owned(),
            candidates_scored,
        },
        Err(_) => SemanticRerankReport {
            backend: "local_unix_socket".to_owned(),
            status: "fallback".to_owned(),
            candidates_scored: 0,
        },
    })
}

#[cfg(unix)]
fn apply_from_socket(
    task: &str,
    candidates: &mut CandidateSet,
    text_by_node: &BTreeMap<u64, String>,
    socket: &Path,
    timeout: Duration,
) -> Result<usize, String> {
    use std::os::unix::net::UnixStream;

    let selected = candidates
        .candidates
        .iter()
        .take(MAX_CANDIDATES)
        .map(|candidate| RequestCandidate {
            node_id: candidate.node_id,
            qualified_name: candidate.qualified_name.clone(),
            path: candidate.path.clone(),
            text: text_by_node
                .get(&candidate.node_id)
                .map_or_else(String::new, |text| truncate_chars(text, MAX_TEXT_CHARS)),
        })
        .collect::<Vec<_>>();
    if selected.len() < 2 {
        return Ok(0);
    }
    let expected = selected
        .iter()
        .map(|candidate| candidate.node_id)
        .collect::<BTreeSet<_>>();
    let request = Request {
        schema: SCHEMA,
        task,
        candidates: selected,
    };

    let mut stream = UnixStream::connect(socket).map_err(|error| error.to_string())?;
    stream
        .set_read_timeout(Some(timeout))
        .map_err(|error| error.to_string())?;
    stream
        .set_write_timeout(Some(timeout))
        .map_err(|error| error.to_string())?;
    serde_json::to_writer(&mut stream, &request).map_err(|error| error.to_string())?;
    stream.write_all(b"\n").map_err(|error| error.to_string())?;
    stream.flush().map_err(|error| error.to_string())?;

    let mut raw = String::new();
    stream
        .take(MAX_RESPONSE_BYTES + 1)
        .read_to_string(&mut raw)
        .map_err(|error| error.to_string())?;
    if raw.len() as u64 > MAX_RESPONSE_BYTES {
        return Err("semantic reranker response exceeded size limit".to_owned());
    }
    let response: Response = serde_json::from_str(raw.trim()).map_err(|error| error.to_string())?;
    if response.schema != SCHEMA || response.scores.len() != expected.len() {
        return Err("semantic reranker returned an incompatible response".to_owned());
    }

    let mut seen = BTreeSet::new();
    let mut scores = BTreeMap::new();
    for score in response.scores {
        if score.relevance > 1_000
            || !expected.contains(&score.node_id)
            || !seen.insert(score.node_id)
        {
            return Err("semantic reranker returned invalid scores".to_owned());
        }
        scores.insert(score.node_id, u64::from(score.relevance) * 10);
    }
    if seen != expected {
        return Err("semantic reranker omitted candidate scores".to_owned());
    }
    for candidate in &mut candidates.candidates {
        if let Some(score) = scores.get(&candidate.node_id) {
            candidate.scores.semantic = *score;
        }
    }
    Ok(scores.len())
}

#[cfg(not(unix))]
fn apply_from_socket(
    _task: &str,
    _candidates: &mut CandidateSet,
    _text_by_node: &BTreeMap<u64, String>,
    _socket: &Path,
    _timeout: Duration,
) -> Result<usize, String> {
    Ok(0)
}

fn truncate_chars(value: &str, limit: usize) -> String {
    value.chars().take(limit).collect()
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use cgrx_languages::Span;
    use cgrx_retrieval::{Candidate, CandidateProvenance, ScoreComponents};
    use std::fs;
    use std::io::{BufRead, BufReader};
    use std::os::unix::net::UnixListener;
    use std::thread;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn candidate(node_id: u64, name: &str) -> Candidate {
        Candidate {
            node_id,
            qualified_name: name.to_owned(),
            path: format!("src/{name}.rs"),
            span: Span { start: 0, end: 10 },
            provenance: CandidateProvenance::Syntax,
            semantic_fingerprint: None,
            scores: ScoreComponents::default(),
            selection_reason: "fixture".to_owned(),
        }
    }

    #[test]
    fn local_sidecar_scores_candidates_without_changing_graph_scores() {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let socket =
            env::temp_dir().join(format!("cgrx-semantic-{}-{nonce}.sock", std::process::id()));
        let listener = UnixListener::bind(&socket).unwrap();
        let server = thread::spawn(move || {
            let (stream, _) = listener.accept().unwrap();
            let mut reader = BufReader::new(stream);
            let mut line = String::new();
            reader.read_line(&mut line).unwrap();
            let request: serde_json::Value = serde_json::from_str(&line).unwrap();
            assert_eq!(request["schema"], SCHEMA);
            assert_eq!(request["task"], "find payment handler");
            assert_eq!(request["candidates"].as_array().unwrap().len(), 2);
            let mut stream = reader.into_inner();
            write!(
                stream,
                "{{\"schema\":\"{SCHEMA}\",\"scores\":[{{\"node_id\":1,\"relevance\":120}},{{\"node_id\":2,\"relevance\":910}}]}}"
            )
            .unwrap();
        });

        let mut candidates = CandidateSet {
            candidates: vec![candidate(1, "noise"), candidate(2, "payment")],
            uncertainties: vec![],
        };
        candidates.candidates[0].scores.graph = 44;
        let text = BTreeMap::from([
            (1, "unrelated helper".to_owned()),
            (2, "fn payment_handler() {}".to_owned()),
        ]);
        let scored = apply_from_socket(
            "find payment handler",
            &mut candidates,
            &text,
            &socket,
            Duration::from_secs(1),
        )
        .unwrap();
        server.join().unwrap();
        let _ = fs::remove_file(socket);

        assert_eq!(candidates.candidates[0].scores.graph, 44);
        assert_eq!(candidates.candidates[0].scores.semantic, 1_200);
        assert_eq!(candidates.candidates[1].scores.semantic, 9_100);
        assert_eq!(scored, 2);
    }
}
