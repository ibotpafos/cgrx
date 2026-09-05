# Parallel CGRX quality milestone

Base: f3b8cc8. Tracking: IBO-228. No release, client replacement or publication is implied.

## Independent lanes
1. Go: one demonstrated receiver/type resolution defect; go.rs and dedicated regression tests.
2. TypeScript: one demonstrated lexical/type resolution defect; typescript.rs and dedicated tests.
3. Reliability: reproduce immutable-generation error before altering storage state transitions; preserve immutability and locking.
4. Real task corpus: initial source-verified GD/VEX/Pyramid cases with revision, hash and evidence references; offline validator; no source repository changes.
5. Explainable impacts: source-backed impact evidence and an agent A/B evaluation protocol.
6. Parent: strict paired benchmark gate and integration. Missing evidence must invalidate comparison, never become an empty successful result.

## Gate design
Compare the same task, repository revision and source digest. Preserve engine version/mode and measurement environment. Both result collections must be successful and untruncated. Records are exact identifiers; duplicates are invalid. Measure precision/recall/F1 per language, overall, and individual task regressions. Compare p95 latency, peak memory and total response tokens separately; token counts require the same declared tokenizer. Quality superiority requires improvement, not merely passing tiny positive fixtures. Minimum sample sizes and required languages are explicit and reported. This gate consumes measured runs; synthetic unit-test rows are not product benchmark results.

## Integration and acceptance
- Each worker uses a separate worktree and Cargo target. Parent reviews each patch before cherry-picking.
- Consolidate extraction revision changes once; test index migration contracts.
- Each lane records baseline, modified and rollback results, hashes and executable rollback artifacts.
- Run workspace, clippy, formatter, relationship evaluator and Python validators after integration.
- Report unmerged/failed lanes and remaining heldout, end-to-end agent, performance and release gates explicitly.

## Follow-on milestones
Grow the initial corpus to 200-300 reviewed tasks before broad market claims. Semantic resolution improvements follow measured misses. Explainable patch-impact paths and agent A/B outcomes follow core graph correctness and freshness, not speculative confidence scores.
