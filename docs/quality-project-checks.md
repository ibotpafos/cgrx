# Isolated project checks for quality patches

Call `prepare_candidate_patch` with `candidate_id` and `run_project_checks: true`.
The default remains syntax-only: merely listing findings never runs project code.

Create `.cgrx/quality-checks.json` in the target repository. Review its commands
before opting in. All three stages are required; commands are argument arrays,
not shell strings. `{path}` expands to the candidate's repository-relative path.
For example, a project with Prettier, TypeScript and a configured test script:

```json
{
  "version": 1,
  "timeout_ms": 10000,
  "format": ["prettier", "--write", "{path}"],
  "typecheck": ["tsc", "--noEmit", "--pretty", "false"],
  "tests": ["npm", "run", "test", "--", "--run"]
}
```

Adapt the test arguments to your runner. Do not use watch mode. Executables resolve
from the copied `node_modules/.bin`, then the MCP process PATH. Explicit commands
only: no dependency installation or guessed scripts. All dependencies must already
be installed in the repository or available through PATH. Commands must use an
executable name, not an absolute or relative executable path; use `node script.js`
for repository scripts. Never put credentials in arguments.

The verifier copies the current working tree, including uncommitted files and
local node_modules, to two separate private temporary directories. It applies the
actual candidate diff only to MODIFIED, then runs format → typecheck → tests on
both BASELINE and MODIFIED. The returned diff includes formatting of the candidate
file, and retains the original-source hash precondition. A formatter changing
other source files fails verification. Typecheck/tests changing sources also fail.
Failures in BASELINE are reported, not silently attributed to the patch.

`patch_verification` contains `baseline` and `modified` stage results: status,
argv, exit code, duration and output size. The top-level stage fields summarize
MODIFIED. Raw output is withheld because scripts may print secrets.
`project_checks_passed` requires all six stages to pass and original sources to
remain unchanged. Missing configuration/dependencies, invalid config, copy limits,
timeouts, excessive output, failed typechecks or tests never count as success.

Default limits: 50,000 entries and 256 MiB per copy, 20 seconds per copy, 100–30,000 ms per
command (default 10 seconds), 128 KiB combined output per command. On Unix each
command has its own process group; timeout/output limits kill its descendants.
Kilo/OpenCode connections should allow at least 240 seconds for a full verification.

**This is filesystem-copy isolation, NOT an OS or network security sandbox.**
Run only trusted repository scripts. They can still access host/network resources.
The child environment drops inherited credentials; HOME, TMPDIR and npm cache point
to temporary space. npm is offline and lifecycle hooks disabled, but explicitly
requested scripts can still use the network. No Git metadata, CGRX state, build
caches, `.env*`, `.npmrc`, `.netrc`, SSH/AWS directories or `.pem`/`.key` files are
copied. Internal symlinks are rebased into each copy; external/dangling links fail.
Projects requiring excluded files or external package-store links need a different
self-contained dependency setup. No source is intentionally edited in the working
repository; copies and captured logs are removed afterwards.

Supported automatic patch generation remains TypeScript endpoint/path literal
extraction. Passing checks is review evidence, never proof of semantic equivalence
or a reason to merge automatically.

## Monorepo setup and agent gates

The source inventory uses `git ls-files --cached --others --exclude-standard`
plus local dependency directories. Ignored media, private local evidence and nested
agent worktrees are not scanned. Dependencies are independent copies, not hardlinks.
Optional `snapshot_max_bytes`, `snapshot_max_files`, `snapshot_timeout_ms` raise
limits to at most 8 GiB, 500,000 entries and 120 seconds per copy. Default limits
remain unchanged. Allow 600 seconds in the client for large monorepo checks.

The repository's `.cgrx/quality-checks.json` invokes
`scripts/cgrx-quality-check.mjs`: candidate-only Prettier formatting, then the
owning workspace's real typecheck/test scripts. The driver refuses direct runs
outside verifier copies, watch/deploy/migrate/seed/browser workflows and missing
scripts. Rust uses offline workspace fmt/check/tests; Go uses gofmt and offline
compile/test commands. Toolchain caches are reused; they are NOT isolated caches.
Source copies remain independent. This remains a trusted-code, non-OS sandbox.

Agent policy: call prepare_candidate_patch with run_project_checks=true; require
project_checks_passed, all six stages passed, stable sources and the current
source-hash precondition. Syntax-only/blocked/unavailable/timeout/failure never
authorizes application. Unsupported changes need equivalent isolated checks and
review, not a fabricated candidate. Never bypass a baseline failure silently.

### Repository bootstrap (outside verification copies)

For this Rust/TypeScript repository, install the declared web dependencies with
`npm ci --ignore-scripts` and the pinned formatter/contract tooling with
`npm ci --prefix scripts/mcp-contract --ignore-scripts`. Neither command is run
by the verifier. Other projects may provide Prettier through their existing
node_modules or a dedicated local tools/cgrx-quality package.

A preexisting broken dependency link, external tool symlink, or workspace binary
pointing to an excluded dist/build tree blocks snapshot creation. Repair the
installed dependency graph outside verification, or supply self-contained local
tools; do not weaken the gate or mark these checks passed. Stage details distinguish
this prerequisite failure from a type error or failing test.
