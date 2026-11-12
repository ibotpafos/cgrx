# Agent pre-apply rules


## Required quality patch gate

For a quality candidate, call prepare_candidate_patch(repo, candidate_id,
run_project_checks=true) before applying anything. Require
patch_verification.status=project_checks_passed, all three stages passed on BOTH
baseline and modified copies, source_modified=false and stable checked sources.
Only apply the returned formatted diff if its source hash still matches.
Syntax-only, blocked, unavailable, timeout and baseline failures never authorize
a patch. Re-list stale candidates; review graph impact; verify after application.
Unsupported patches need equivalent isolated project checks and review, not a
fabricated candidate. Never silently bypass a missing script/tool or failing test.
Review the repository's .cgrx/quality-checks.json commands before opting in.
Filesystem copies are not a security sandbox. Never use deploy/migrate/seed/watch
commands as checks or download dependencies during verification.
