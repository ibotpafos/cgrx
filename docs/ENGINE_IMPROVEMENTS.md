# CGRX Engine Improvements Plan

## Current State (Baseline)

### Performance
- **Indexing**: 707ms for 235 files, 2.3MB source, 2779 nodes, 3610 edges
- **Orient**: 191ms average (FAST mode, 1000 tokens)
- **Binary size**: 20MB (arm64 Mach-O)
- **Storage**: 59MB for indexed state
- **Language support**: 14 languages (Rust, Go, Java, TS/JS/TSX, Python, C, C++, C#, Ruby, PHP, Swift, Scala, Elixir, Kotlin)
- **MCP tools**: 21 tools
- **Test coverage**: 698 tests passing

### Architecture Issues
1. **runtime.rs is 6666 lines** — too large, needs decomposition
2. **nodes.seg is 59MB** — needs compression
3. **edges.seg is 2 bytes** — suspicious, needs investigation
4. **terms.fst is 10 bytes** — FST index may be incomplete
5. **Coverage gaps**: 17606 in watched mode (mostly EXCLUDED_PATH)

### Graph Quality
- **Nodes**: 2779 symbols
- **Edges**: 3610 relations
- **Edge density**: 1.3 edges/node (low — should be 2-5 for good call graphs)
- **Missing edges**: Many function calls not resolved (dynamic dispatch, method calls)

## Priority 1: Graph Accuracy (Week 1)

### 1.1 Fix edges.seg (Critical)
**Problem**: edges.seg is only 2 bytes — edges are not being stored properly.

**Root cause**: Need to investigate why edges are not persisted.

**Solution**: Debug and fix edge storage in cgrx-store.

**Success criteria**: edges.seg > 1MB for this codebase.

### 1.2 Improve Edge Resolution
**Problem**: Many function calls are not resolved (edge density 1.3).

**Current limitations**:
- No method call resolution (obj.method())
- No trait method dispatch
- No closure/function pointer resolution
- No macro expansion

**Solution**:
1. Add method call resolution for Rust, Go, TypeScript
2. Add trait/interface method dispatch
3. Add closure detection
4. Improve macro handling

**Success criteria**: Edge density > 3.0 edges/node.

### 1.3 Fix FST Index
**Problem**: terms.fst is 10 bytes — search index is incomplete.

**Solution**: Debug FST generation in cgrx-store.

**Success criteria**: terms.fst > 100KB for this codebase.

## Priority 2: Performance (Week 2)

### 2.1 Compress nodes.seg ✅ DONE
**Problem**: 59MB for 2779 nodes is too large (~21KB/node).

**Solution**: zstd compression with CZST magic header in segment.rs.

**Result**: 59MB → 2.6MB (22.7x smaller, 95.6% savings). Overhead: +4% indexing, +6% orient.
4. Use delta encoding for spans

**Success criteria**: nodes.seg < 10MB for this codebase.

### 2.2 Parallel Indexing
**Problem**: Indexing is single-threaded.

**Solution**:
1. Parallel file parsing with rayon
2. Parallel edge resolution
3. Parallel FST generation

**Success criteria**: Indexing < 200ms for this codebase.

### 2.3 Incremental Indexing
**Problem**: Full re-index on every change.

**Solution**:
1. Track changed files via git
2. Only re-parse changed files
3. Update edges incrementally
4. Regenerate FST incrementally

**Success criteria**: Incremental index < 50ms for single file change.

## Priority 3: Code Quality (Week 3)

### 3.1 Decompose runtime.rs
**Problem**: 6666 lines is too large.

**Solution**: Split into modules:
- runtime/orient.rs — orient logic
- runtime/search.rs — search logic
- runtime/tracing.rs — trace_path, find_usages
- runtime/refactors.rs — suggest_refactors
- runtime/risks.rs — scan_risks
- runtime/gates.rs — check_*_gates
- runtime/index.rs — index logic
- runtime/state.rs — state management

**Success criteria**: No file > 1000 lines.

### 3.2 Improve Error Handling
**Problem**: Many unwrap() calls, inconsistent error types.

**Solution**:
1. Replace unwrap() with proper error handling
2. Use thiserror for error types
3. Add context to errors
4. Add error recovery where possible

**Success criteria**: Zero unwrap() in production code.

### 3.3 Add Documentation
**Problem**: Many functions lack documentation.

**Solution**:
1. Add doc comments to all public functions
2. Add examples to doc comments
3. Generate rustdoc
4. Add architecture documentation

**Success criteria**: 100% public API documented.

## Priority 4: New Features (Week 4)

### 4.1 Streaming Results
**Problem**: Large results are truncated.

**Solution**:
1. Add cursor-based pagination
2. Add streaming for orient/expand
3. Add streaming for get_architecture

**Success criteria**: No truncation for results < 10000 items.

### 4.2 explain_symbol Enhancement
**Problem**: explain_symbol doesn't include source code.

**Solution**:
1. Include source code in explain_symbol
2. Add syntax highlighting hints
3. Add related symbols
4. Add documentation comments

**Success criteria**: explain_symbol returns complete context.

### 4.3 Dead Code Detection ✅ DONE
**Problem**: No way to find unused code.

**Solution**: New `detect_dead_code` MCP tool (22nd tool). Finds symbols with zero incoming CALLS arcs.

**Result**: Found 1649 dead symbols in CGRX codebase with language filtering support.

**Success criteria**: New check_dead_code tool.

## Priority 5: Standards Compliance (Week 5)

### 5.1 LSP Compatibility
**Problem**: Not compatible with LSP protocol.

**Solution**:
1. Add LSP server mode
2. Support textDocument/didOpen, didChange, didSave
3. Support textDocument/definition, references, hover
4. Support workspace/symbol

**Success criteria**: Works with VS Code, Neovim, Emacs.

### 5.2 SARIF Compliance
**Problem**: SARIF output is basic.

**Solution**:
1. Add full SARIF 2.1.0 support
2. Add code flows
3. Add thread flow locations
4. Add suppression handling

**Success criteria**: Valid SARIF output for all gates.

### 5.3 SCIP Compatibility
**Problem**: Not compatible with SCIP protocol.

**Solution**:
1. Add SCIP export
2. Add SCIP import
3. Support all SCIP symbol formats

**Success criteria**: Interop with Sourcegraph, scip-* tools.

## Success Metrics

### Accuracy
- Edge density: > 3.0 edges/node
- Resolution rate: > 80% of function calls resolved
- False positive rate: < 5%

### Performance
- Indexing: < 200ms for 1000 files
- Orient: < 100ms for 1000 tokens
- Search: < 50ms for symbol lookup
- Trace: < 100ms for 4-hop trace

### Quality
- Test coverage: > 90%
- Documentation: 100% public API
- Zero unwrap() in production code
- Zero unsafe code

### Compatibility
- LSP: Works with VS Code, Neovim, Emacs
- SARIF: Valid output for all gates
- SCIP: Interop with Sourcegraph
- MCP: Works with all MCP clients

## Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Graph Accuracy | Fix edges.seg, improve edge resolution, fix FST |
| 2 | Performance | Compress storage, parallel indexing, incremental indexing |
| 3 | Code Quality | Decompose runtime.rs, improve errors, add docs |
| 4 | New Features | Streaming, explain_symbol, dead code detection |
| 5 | Standards | LSP, SARIF, SCIP compatibility |

## Resources

### Documentation
- `docs/COMPETITIVE.md` — competitive analysis
- `docs/ROADMAP.md` — product roadmap
- `docs/security-gates.md` — security gate docs
- `docs/framework-gates.md` — framework gate docs

### Source Code
- `crates/cgrx-cli/src/runtime.rs` — main runtime logic
- `crates/cgrx-store/` — storage layer
- `crates/cgrx-retrieval/` — retrieval algorithms
- `crates/cgrx-languages/` — language parsers

### Tests
- `tests/` — integration tests
- `fixtures/` — test fixtures
- `contracts/` — API contracts
