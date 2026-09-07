# Paired quality gate

`python3 scripts/compare_quality.py measured-runs.json` consumes collector output. It does not collect measurements, run CBM, or establish oracle correctness. A passing unit test is not a benchmark win.

Default acceptance: at least 100 heldout tasks, at least 20 for each of Go/Java/TypeScript/Python/Rust, positive and negative cases in each language, F1 improvement at least 0.005, no per-language precision/recall regression, no pooled p95 latency regression and no per-task FP/FN, p95 latency, peak RSS or response-token regression. A tie is not superiority. Every result must be successful and untruncated; malformed evidence exits 2, a failed comparison exits 1, a pass exits 0. Performance comparisons use nearest-rank p95 and require at least three paired samples; stronger statistical confidence requires more repetitions and independent analysis. This is a strict screening gate, not a significance test.

## Input v1

Top level: `schema_version: 1`, nonempty `environment` (hardware plus collection protocol identifier), `tokenizer` (exact shared tokenizer version), `engines` with `cgrx` and `cbm` each containing `version` and `mode`, and `cases`.

Each case contains:
- `id`: unique task identifier; `language`: go/java/typescript/python/rust; `split`: train/heldout.
- `snapshot`: absolute canonical `repo`, full hexadecimal Git `revision`, SHA256 `source_digest` from the same corpus source set for both engines.
- `expected`: unique exact answer identifiers, including location where names can collide. Empty means a verified negative case, not unknown truth.
- `cgrx` and `cbm`: identical `snapshot`, unique `actual` identifiers, booleans `success` and `complete`, repeated `latency_ms` samples, integer `peak_rss_bytes` and `response_tokens`.

Both engines use the same snapshot, tokenizer, request/answer budget, cold-or-warm policy and isolated measurement protocol. Record engine versions and mode; run separate comparisons for different CBM modes. Never invent missing metrics. `complete` concerns collection truncation only; do not infer semantic completeness from graph coverage. A failed collection is invalid evidence, not a successful empty answer. Training tasks are validated but excluded from acceptance.

Default thresholds may be overridden with `--minimum-cases`, `--minimum-per-language`, `--minimum-gain`; the report preserves overrides. Small smoke-run passes must not be presented as broad product acceptance. Per-task results cannot be replaced with aggregate summaries.

The real-task corpus and its validator are independent from this measured-run format: source truth is curated first, then a collector turns engine results into paired measurements. End-to-end agent context usage and final patch correctness are separate gates; response tokens alone do not measure them.

Reusable collection instruction:
```text
For each fixed heldout task, run CGRX and CBM against the identical repository revision and source hashes. Normalize exact answer identities without altering the oracle. Record versions, mode, tokenizer, timing samples, process peak RSS and response tokens. Preserve errors and truncation; do not substitute empty success. Do not tune the resolver on heldout failures; move inspected tasks to training before future evaluation.
```
