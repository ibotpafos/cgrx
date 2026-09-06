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

## Rust dependencies

Dependencies are pinned in Cargo.lock and downloaded during source installation.
[licenses/dependencies.md](licenses/dependencies.md) lists versions and declared
licenses. Binary distributions include available dependency license/notice files
in the licenses directory. Tree-sitter grammars retain their upstream authorship.
