#!/bin/bash
# CGRX Dev Helper — быстрый запуск CGRX-тулов для разработки
# Использование: ./dev-cgrx.sh <tool> '<json-args>'
# Пример: ./dev-cgrx.sh search_graph '{"repo": ".", "query": "check_security_gates", "limit": 5}'

TOOL="${1:-help}"
ARGS="${2:-{}}"
REPO="${REPO:-.}"

# Если передан repo: auto — подставляем текущий git root
if [ "$REPO" = "auto" ] || [ "$REPO" = "." ]; then
    REPO="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

CGRX="${CGRX:-$HOME/.local/bin/cgrx}"

# Подставляем repo в args если не задан
if echo "$ARGS" | grep -q '"repo"'; then
    ARGS="$ARGS"
else
    ARGS="{\"repo\": \"$REPO\", $ARGS}"
fi

# Убираем лишние запятые
ARGS=$(echo "$ARGS" | sed 's/^, *//')

python3 - "$TOOL" "$ARGS" << 'PYEOF'
import json, subprocess, sys

tool = sys.argv[1]
args = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}

cgrx = "/Users/ila/.local/bin/cgrx"
server = subprocess.Popen(
    [cgrx, "serve"],
    stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True
)

# Initialize
init = {"jsonrpc": "2.0", "id": 1, "method": "initialize",
        "params": {"protocolVersion": "2025-06-18", "capabilities": {},
                   "clientInfo": {"name": "dev-cgrx", "version": "1"}}}
server.stdin.write(json.dumps(init) + "\n")
server.stdin.flush()
server.stdout.readline()

# Call tool
req = {"jsonrpc": "2.0", "id": 2, "method": "tools/call",
       "params": {"name": tool, "arguments": args}}
server.stdin.write(json.dumps(req) + "\n")
server.stdin.flush()
resp = json.loads(server.stdout.readline())
server.terminate()

if "error" in resp:
    print(f"ERROR: {resp['error']['message']}", file=sys.stderr)
    sys.exit(1)

content = resp.get("result", {}).get("content", [])
for c in content:
    if c.get("type") == "text":
        try:
            data = json.loads(c["text"])
            print(json.dumps(data, indent=2, ensure_ascii=False))
        except:
            print(c["text"])
PYEOF
