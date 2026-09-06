# Change verification

Call \`scan_risks(repo, mode="changes", limit=20)\` after edits. It compares the
working tree with \`HEAD\`; refresh after further edits before reusing its spans.

Treat findings, impacts, refactors, and related tests as candidates. Inspect
their evidence and the referenced source. A related test has a proven bounded
call path, not proof that its assertions cover the behavior or that a runner
will discover it. Choose commands from the repository's own instructions and
record actual results separately from \`execution_status="not_run"\`.

Read changed paths and coverage gaps even when candidate arrays are empty.
\`partial=false\` and an empty result do not prove the patch bug-free. Dynamic
dispatch and unresolved relationships can preserve uncertainty without erasing
independent positive evidence.
