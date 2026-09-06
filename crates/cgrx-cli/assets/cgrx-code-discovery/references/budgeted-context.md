# Budgeted context

Use \`orient\` when a broad task benefits from a task-sized evidence capsule.
Provide a concrete task, a small token budget, and explicit include/exclude,
\`relation_kinds\`, and \`max_depth\` scope.

Expand only handles returned by that call, with the same \`repo\` and a bounded
budget. Never construct handles or reuse them across repositories, server
restarts, or eviction. Request a fresh handle after a stale or not-found error.

Use \`CALLS\` and \`IMPLEMENTS\` in orient scopes. Use the dedicated architecture,
usage, outline, or text-search paths when the requested relationship is outside
that scope.
