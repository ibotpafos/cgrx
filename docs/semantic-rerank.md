# Optional local semantic reranking

CGRX can optionally ask a local semantic sidecar to score the top retrieval
candidates before evidence packing. The sidecar is advisory: it cannot create
graph edges, change `PROVEN` evidence, remove coverage gaps, or resolve
`DYNAMIC_DISPATCH`. If the socket is absent, times out, or returns invalid data,
CGRX continues with the normal deterministic retrieval scores.

The bundled experimental adapter uses [Laya](https://github.com/NandhaKishorM/laya).
It runs as a separate Python process so the normal CGRX install remains one Rust
binary with no model or Python dependency.

Install Laya into a separate Python environment, then start the sidecar:

```sh
python scripts/laya_reranker.py --socket /tmp/cgrx-laya.sock --preload
```

Point the CGRX MCP process at that local socket:

```sh
export CGRX_SEMANTIC_RERANK_SOCKET=/tmp/cgrx-laya.sock
export CGRX_SEMANTIC_RERANK_TIMEOUT_MS=750
cgrx serve --multi-repo
```

`--model auto` is the default and lets Laya route English and non-English tasks
to its corresponding checkpoint. `--model multilingual` is useful when the
workload is predominantly Russian and keeping one checkpoint resident matters
more than English accuracy. `--device` can select `cpu`, `mps`, or `cuda`.
With `--preload`, the sidecar also runs one warm-up inference per resident
checkpoint so the first real request does not pay lazy model/device setup cost.

The protocol is `cgrx.semantic-rerank.v1` over a Unix domain socket. CGRX sends
at most 8 candidates with bounded text excerpts (400 characters each) and accepts only a complete,
duplicate-free set of integer relevance scores from 0 to 1000. CGRX applies a
semantic boost only when the top score is at least 300 and leads the runner-up
by at least 80 points; otherwise the report is `skipped_low_confidence` and the
deterministic ranking is left unchanged. Only that clear winner is boosted, by
the observed relevance margin. Structural evidence and conservative coverage
rules remain authoritative. When the sidecar is configured, `orient` also adds
`semantic_rerank` audit metadata including the top relevance and margin. Socket
or protocol failures report `fallback`. The field is omitted when semantic
reranking is disabled.

This path is experimental until it improves the curated retrieval/evidence
benchmarks on held-out tasks. Keep the default disabled for releases until that
measurement is positive. Review the upstream model-card/license terms before
redistributing model weights; the Python project itself is Apache-2.0.
