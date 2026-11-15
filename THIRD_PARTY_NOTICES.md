# Third-party notices

CGRX source is MIT-licensed. Dependency/resource copyrights remain with
their respective authors.

## Bundled tokenizer

crates/cgrx-capsule/resources/o200k_base.cgrxtok is a deterministic compiled
representation of OpenAI's o200k_base tokenizer data.
Upstream: [openai/tiktoken](https://github.com/openai/tiktoken).
The MIT notice is in [licenses/tiktoken-MIT.txt](licenses/tiktoken-MIT.txt).
Source and compiled resource hashes are recorded in the resource directory.
This tokenizer data is an upstream component, not CGRX authorship.
License source revision: 4e71bbe0c078468e00fefbf94b39849389f346e5.

## Web Git Graph

The local graph explorer bundles `@web-git-graph/web` 1.0.7 and
`@web-git-graph/protocol` 1.0.7 for its read-only Git history view.
Upstream: [GIS-Info/web-git-graph](https://github.com/GIS-Info/web-git-graph).
Both packages are MIT-licensed. The bundled notice is in
[licenses/web-git-graph-MIT.txt](licenses/web-git-graph-MIT.txt).

## Optional GitHub MCP prototype

`scripts/github_mcp_bridge.py` uses the official Python MCP SDK `mcp` 2.3.0
([modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk),
MIT) and `httpx2` 2.10.0
([pydantic/httpx2](https://github.com/pydantic/httpx2), BSD-3-Clause).
They are pinned in the script metadata and installed only into uv's optional
script environment; they are not bundled in the CGRX Rust executable.

The adapter connects to GitHub's hosted MCP service. Its search index is not
part of the MIT-licensed [GitHub MCP server](https://github.com/github/github-mcp-server).

## Rust dependencies

The GitHub prototype uses RustCrypto `sha1` 0.10.6 (MIT OR Apache-2.0) for Git
blob identity interoperability, independently of the local repository's hash
format. It does not use SHA-1 for authorization or as a security guarantee;
source fingerprints additionally use the existing BLAKE3 implementation.
Upstream: [RustCrypto SHA-1](https://docs.rs/sha1/0.10.6/sha1/).

Dependencies are pinned in Cargo.lock and downloaded during source installation.
[licenses/dependencies.md](licenses/dependencies.md) lists versions and declared
licenses. Binary distributions include available dependency license/notice files
in the licenses directory. Tree-sitter grammars retain their upstream authorship.

## ast-grep-core

Syntax-only review hints use ast-grep-core 0.39.6 (MIT).
Upstream: https://github.com/ast-grep/ast-grep .

## similar

Review-only patches use similar 2.7.0 (Apache-2.0), https://github.com/mitsuhiko/similar .
