# Exact symbol selection, 2026-10-08

The previous Go experiment proved `Allow → Shard.Run` even when `Other.Run`
appeared in the same file. However, `get_code_snippet("Run", path)` and
`find_usages("Run", path)` could not choose between those definitions. Compact
traces also omitted the target's definition range. This iteration makes each
discovered definition directly addressable without guessing which name match
the caller intended.

## Implementation and boundaries

`search_graph`, `get_outline`, snippets, traces and usages expose an opaque
`symbol_ref`. The three query tools accept it alongside `symbol`; any supplied
path and scope continue to constrain the selection. A reference binds the
index location, complete revision/working-tree/generation snapshot, extraction
policy, node identity, symbol name, definition range and indexed source hash.
The native selector requires a globally unique syntax-node identity. It
refuses malformed references, unknown or outdated references, mismatched names
or paths, excluded targets and colliding node identities. It never falls back
to name selection after a reference fails.

Legacy Rust methods and MCP arguments remain supported. `SymbolSelector` and
the `*_selected` methods add explicit selection, including `static`, `observed`
and `all` evidence modes. A backend that does not implement reference selection
rejects it explicitly. No extraction format or cache revision changes; the
JavaScript-enabled binary continues to use extraction revision 101.

Compact tables append reference columns, preserving existing column positions.
References remain strings, so large numeric node IDs need not pass through a
JavaScript floating-point representation. Snippets also expose their indexed
source hash. Incoming observed results now expose the selected target in both
response profiles.

Observed endpoint import also corrects a source-range error: a declaration name
must match the endpoint function and intersect the requested line, rather
than contain the byte at the line's beginning. Two same-name methods on the same line still remain ambiguous.
Runtime evidence remains observed evidence; exact selection does not convert
it into a static proof or resolve a dynamic gap.

## Research and reuse

Existing snapshot, canonical hashing, syntax-node lookup and bounded Stdio test
infrastructure were extended. No server, package or external configuration was
installed. The [LSP document symbol contract](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#documentSymbol)
and [SCIP schema](https://github.com/scip-code/scip/blob/main/scip.proto) were
reviewed for the distinction between symbol identity and source ranges; CGRX
keeps its native byte ranges and opaque snapshot-bound references.

## Validation scope

New regressions cover two distinct Go methods in one file, both call directions,
follow-up navigation through returned references, source hashes, reopen,
refresh, deletion, malformed or unknown references, path/name/scope mismatches,
other index instances and colliding IDs with indexed and uncached lookup.
Four imported observed calls exercise both selected methods and the `all` merge.

An actual Stdio MCP test exercises full and token-efficient profiles, two Git
repositories with the same commit, strict legacy ambiguity and stale-reference
refusal. Usage logs retain only metadata and typed error codes; the test checks
that source text, raw queries, reference values and argument objects are absent.

The saved eight Go compiler examples from the preceding iteration are reused
at commit `ed1fb609a5fee406be760f21ab99ebcb9b074155`. Their compiler results and
source hashes remain authoritative for those constructed examples. They are
implementation-informed regressions, not independent held-out evidence.

The final workspace checks pass: 892 default tests and 904 with JavaScript
opted in, each with nine existing ignored tests. The combined CLI/language
JavaScript, PHP and Swift checks pass 729 tests with three existing ignored
checks. Both workspace all-target Clippy profiles pass with warnings denied.
The original schema token ceiling (4150) and initialization instruction length
ceiling (512 bytes) remain unchanged. Earlier failing runs are retained
separately from the final checks.

The reviewed JavaScript-enabled binary is SHA-256
`f7b827feb37eebebbdcea1bd3435d78ca93d968e3dd06e7f6b54d6a2efee3689`.
Public replay selects all six designated concrete targets and reads their exact
definitions and incoming `Allow` sites in both profiles; both original dynamic
abstentions remain unchanged. The interface-element negative has one concrete
`Other.Run` definition and preserves the original unique-name policy. It is
retained separately from the seven cases with two same-name definitions.
All ten saved native indexes retain identical node/edge segment hashes after
query replay, and all 226 original source assertions revalidate.

The complete schema measures 4137 tokens under the unchanged 4150 ceiling.
Across the eight frozen discovery requests, compact wire responses increase
from 2774 to 4037 bytes, and full-profile responses from 7834 to 10402 bytes.
These are measured response-byte costs for this small workload; they do not
measure total agent tokens, task latency or competitor resource efficiency.

## Limits

The reference is valid only in its issuing index location and snapshot; agents
must rediscover after a change. `explain_symbol`, similarity and visualization
entry-point selection still use their existing name/path contracts. Compact
references add response bytes and tokens. Broad resource efficiency, complete
negative grading and overall competitive superiority remain unmeasured.
