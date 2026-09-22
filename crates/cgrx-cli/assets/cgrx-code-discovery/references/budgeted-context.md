# Budgeted context

Use \`orient\` when a broad task benefits from a task-sized evidence capsule.
Provide a concrete task and explicit include/exclude, \`relation_kinds\`, and
\`max_depth\` scope. Omit \`budget\` for the adaptive 400-1000 token first pass,
or choose \`budget_preset\`: \`quick\` (400), \`standard\` (800), or \`deep\`
(1600). Prefer \`quick\` unless the task spans architecture or a refactor.

Expand only handles returned by that call, with the same \`repo\` and a bounded
budget. Never construct handles or reuse them across repositories, server
restarts, or eviction. Request a fresh handle after a stale or not-found error.

Treat dynamic-dispatch counts as unresolved call sites, not confirmed defects.
Use the compact per-kind and per-path counts first; inspect exact sites only for
paths that affect the task.

Use \`CALLS\` and \`IMPLEMENTS\` in orient scopes. Use the dedicated architecture,
usage, outline, or text-search paths when the requested relationship is outside
that scope.
