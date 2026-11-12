# Change verification

Call `scan_risks(repo, mode="changes", limit=20)` after edits. It compares the
working tree with `HEAD` by default. To include committed changes, pass `base`
as a full or short commit OID, tag, branch, or expression such as `HEAD~3`.
The server resolves the reference once and returns the pinned `base_revision`
(`base` in the compact profile). It compares that commit to the current working
tree, including staged and unstaged edits and indexed untracked sources; it does
not compare two historical trees or implicitly use a merge base.

Historical baselines use the same syntax extraction as normal indexing, without
applying current compiler artifacts to old sources. Their graph is isolated from
the live HEAD index and project memory. Invalid or unavailable commits fail
explicitly. Test execution claims still require the exact current revision and
file hash, not just the historical base. Refresh after further edits before
reusing spans.

Treat findings, impacts, refactors, and related tests as candidates. Inspect
their evidence and the referenced source. A related test has a proven bounded
call path, not proof that its assertions cover the behavior or that a runner
will discover it. Choose commands from the repository's own instructions and
record actual results separately from `execution_status="not_run"`.

Read changed paths and coverage gaps even when candidate arrays are empty.
`partial=false` and an empty result do not prove the patch bug-free. Dynamic
dispatch and unresolved relationships can preserve uncertainty without erasing
independent positive evidence.
