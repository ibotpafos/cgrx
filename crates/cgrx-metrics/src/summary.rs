//! Local aggregation of usage events into session analytics.

use crate::UsageEvent;

/// Per-tool aggregate of latency, request size, and response size samples.
#[derive(Clone, Debug, Default, Eq, PartialEq, serde::Serialize)]
pub struct ToolStats {
    pub calls: u64,
    pub ok: u64,
    pub errors: u64,
    pub latency_us: Vec<u64>,
    pub response_bytes: Vec<u64>,
}

impl ToolStats {
    fn record(&mut self, event: &UsageEvent) {
        self.calls = self.calls.saturating_add(1);
        if event.ok {
            self.ok = self.ok.saturating_add(1);
        } else {
            self.errors = self.errors.saturating_add(1);
        }
        self.latency_us.push(event.latency_us);
        self.response_bytes.push(event.response_bytes);
    }

    /// Error rate in `[0, 1]`, or `0.0` when there are no calls.
    pub fn error_rate(&self) -> f64 {
        if self.calls == 0 {
            0.0
        } else {
            self.errors as f64 / self.calls as f64
        }
    }
}

/// Summary statistics for a single metric sample.
#[derive(Clone, Debug, Default, Eq, PartialEq, serde::Serialize)]
pub struct SampleSummary {
    pub sum: u64,
    pub p50: u64,
    pub p95: u64,
    pub max: u64,
}

/// Aggregated per-tool metrics ready for display.
#[derive(Clone, Debug, Default, PartialEq, serde::Serialize)]
pub struct ToolMetrics {
    pub tool: String,
    pub calls: u64,
    pub ok: u64,
    pub errors: u64,
    pub error_rate: f64,
    pub latency: SampleSummary,
    pub response_bytes: SampleSummary,
}

/// Whole-log summary: totals, per-tool metrics, and top tools by response size.
#[derive(Clone, Debug, Default, PartialEq, serde::Serialize)]
pub struct MetricsSummary {
    pub events: usize,
    pub ignored_events: u64,
    pub sessions: u64,
    pub tools: Vec<ToolMetrics>,
    pub top_by_response_bytes: Vec<String>,
}

/// Trait for anything that can be summarized into [`MetricsSummary`].
pub trait Summarize {
    fn summarize(self) -> MetricsSummary;
}

impl Summarize for (Vec<UsageEvent>, u64) {
    fn summarize(self) -> MetricsSummary {
        let (events, ignored) = self;
        summarize_events(&events, ignored)
    }
}

fn summarize_events(events: &[UsageEvent], ignored: u64) -> MetricsSummary {
    let mut sessions = std::collections::BTreeSet::new();
    let mut buckets: std::collections::BTreeMap<String, ToolStats> =
        std::collections::BTreeMap::new();

    for event in events {
        sessions.insert((event.client.clone(), event.session.clone()));
        buckets.entry(event.tool.clone()).or_default().record(event);
    }

    let tools: Vec<ToolMetrics> = buckets
        .into_iter()
        .map(|(tool, stats)| ToolMetrics {
            tool,
            calls: stats.calls,
            ok: stats.ok,
            errors: stats.errors,
            error_rate: stats.error_rate(),
            latency: sample_summary(&stats.latency_us),
            response_bytes: sample_summary(&stats.response_bytes),
        })
        .collect();

    let mut ranked = tools.clone();
    ranked.sort_by(|a, b| {
        b.response_bytes
            .sum
            .cmp(&a.response_bytes.sum)
            .then_with(|| a.tool.cmp(&b.tool))
    });
    let top_by_response_bytes = ranked
        .iter()
        .take(5)
        .filter(|m| m.response_bytes.sum > 0)
        .map(|m| m.tool.clone())
        .collect();

    MetricsSummary {
        events: events.len(),
        ignored_events: ignored,
        sessions: sessions.len() as u64,
        tools,
        top_by_response_bytes,
    }
}

/// Nearest-rank percentile (ceil) over an ascending-sorted slice.
pub fn nearest_rank(sorted: &[u64], percentile: usize) -> u64 {
    if sorted.is_empty() {
        return 0;
    }
    let rank = sorted.len().saturating_mul(percentile).div_ceil(100);
    sorted[rank.saturating_sub(1).min(sorted.len() - 1)]
}

fn sample_summary(samples: &[u64]) -> SampleSummary {
    if samples.is_empty() {
        return SampleSummary::default();
    }
    let mut sorted = samples.to_vec();
    sorted.sort_unstable();
    SampleSummary {
        sum: sorted.iter().copied().fold(0u64, u64::saturating_add),
        p50: nearest_rank(&sorted, 50),
        p95: nearest_rank(&sorted, 95),
        max: sorted.last().copied().unwrap_or_default(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn event(tool: &str, ok: bool, latency_us: u64, response_bytes: u64) -> UsageEvent {
        UsageEvent {
            timestamp_ms: 0,
            client: "client".to_owned(),
            session: "session".to_owned(),
            tool: tool.to_owned(),
            ok,
            latency_us,
            request_bytes: 0,
            response_bytes,
        }
    }

    #[test]
    fn empty_summary_is_zeroed() {
        let summary = summarize_events(&[], 0);
        assert_eq!(summary.events, 0);
        assert_eq!(summary.ignored_events, 0);
        assert_eq!(summary.sessions, 0);
        assert!(summary.tools.is_empty());
        assert!(summary.top_by_response_bytes.is_empty());
    }

    #[test]
    fn error_rate_counts_errors_per_tool() {
        let events = vec![
            event("orient", true, 100, 1000),
            event("orient", false, 200, 0),
            event("orient", false, 300, 0),
            event("status", true, 50, 200),
        ];
        let summary = summarize_events(&events, 0);
        let orient = summary.tools.iter().find(|t| t.tool == "orient").unwrap();
        assert_eq!(orient.calls, 3);
        assert_eq!(orient.ok, 1);
        assert_eq!(orient.errors, 2);
        assert!((orient.error_rate - 2.0 / 3.0).abs() < f64::EPSILON);
        let status = summary.tools.iter().find(|t| t.tool == "status").unwrap();
        assert_eq!(status.error_rate, 0.0);
    }

    #[test]
    fn percentiles_use_nearest_rank() {
        // p50 of 4 samples: ceil(4*50/100)=2 -> sorted[1]
        // p95 of 4 samples: ceil(4*95/100)=4 -> sorted[3]
        let summary = summarize_events(
            &(1..=4)
                .map(|i| event("t", true, i * 10, i * 100))
                .collect::<Vec<_>>(),
            0,
        );
        let tool = &summary.tools[0];
        assert_eq!(tool.latency.p50, 20);
        assert_eq!(tool.latency.p95, 40);
        assert_eq!(tool.latency.max, 40);
        assert_eq!(tool.latency.sum, 100);
    }

    #[test]
    fn top_by_response_bytes_ranks_descending_with_cap() {
        let events = vec![
            event("a", true, 10, 500),
            event("b", true, 10, 1000),
            event("c", true, 10, 100),
            event("d", true, 10, 200),
            event("e", true, 10, 300),
            event("f", true, 10, 400),
        ];
        let summary = summarize_events(&events, 0);
        assert_eq!(summary.top_by_response_bytes, vec!["b", "a", "f", "e", "d"]);
    }

    #[test]
    fn top_by_response_bytes_excludes_zero_byte_tools() {
        let events = vec![event("t", true, 10, 0), event("u", true, 10, 1)];
        let summary = summarize_events(&events, 0);
        assert_eq!(summary.top_by_response_bytes, vec!["u"]);
    }

    #[test]
    fn sessions_are_counted_per_unique_pair() {
        let mut events = vec![
            event("t", true, 10, 1),
            event("t", true, 10, 1),
            event("t", true, 10, 1),
        ];
        events[0].session = "s1".to_owned();
        events[1].session = "s2".to_owned();
        events[2].session = "s1".to_owned();
        let summary = summarize_events(&events, 0);
        assert_eq!(summary.sessions, 2);
    }
}
