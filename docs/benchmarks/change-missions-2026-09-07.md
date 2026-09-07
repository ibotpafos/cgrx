# Change Missions benchmark — 2026-09-07

Change Missions turn `scan_risks` evidence into an executable task DAG without
calling a language model. The algorithm groups callers by changed target,
attaches graph-reachable test candidates, colors disjoint path sets into
parallel batches, orders path conflicts, and carries path-specific coverage
blockers into the affected mission.

The release-mode stdio evaluator creates and commits six repositories, loads
their baselines through the real multi-repository MCP server, changes the
working trees, and calls `scan_risks` twice. It covers:

- two callers and two tests grouped behind one changed target;
- two independent Python paths scheduled in one parallel batch;
- a change with no proven impact retained as an explicit review mission;
- a removed target with a retained call routed to candidate review;
- Java `*Test.java` discovery through a proven call;
- a proven impact whose destructive confidence is blocked by dynamic dispatch.

Every repeated plan was byte-equivalent after JSON decoding, every handoff was
present in the compact model-visible response, and all expected mission,
parallel-group, impact, test and blocker counts matched.

Observed locally on macOS in one release process:

| Cases | Missions | Median scan | Maximum scan | Compact/full bytes |
| ---: | ---: | ---: | ---: | ---: |
| 6 | 7 | 18.623 ms | 20.117 ms | 0.3949 |

The compact responses used 14,224 bytes versus 36,018 bytes for the complete
structured evidence, a 60.51% reduction. This is a response-size result, not a
token or cross-machine latency claim. CI reruns the semantic evaluator on macOS
and Ubuntu without enforcing these local timing values.

Reproduce after a release build:

```sh
cargo build --locked --release -p cgrx-cli
python3 scripts/eval_change_missions.py target/release/cgrx
```

The evaluator asserts `llm_used=false`. CGRX does not bundle or invoke a
model, embeddings, weights, prompt runtime, or an external AI API for planning.
