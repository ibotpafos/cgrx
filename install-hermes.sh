#!/bin/bash
# CGRX installer for Hermes Agent
# Usage: curl -fsSL https://raw.githubusercontent.com/ibotpafos/cgrx/v0.1.0-alpha.19/install-hermes.sh | bash
# Or locally: ./install-hermes.sh [--source]
set -euo pipefail

for arg in "$@"; do
    if [ "$arg" = --help ]; then
        printf '%s\n' 'Usage: bash install-hermes.sh [--source]' 'Installs pinned CGRX and registers its MCP server with Hermes.'
        exit 0
    fi
done

export CGRX_VERSION="${CGRX_VERSION:-v0.1.0-alpha.19}"
export CGRX_INSTALL_DIR="${CGRX_INSTALL_DIR:-$HOME/.local/bin}"

if ! command -v hermes &> /dev/null; then
    echo "ERROR: hermes not found in PATH. Install Hermes first." >&2
    exit 1
fi

# Match the canonical installer's tag validation before constructing a URL.
case "$CGRX_VERSION" in v[0-9]*) ;; *) echo 'Invalid version tag' >&2; exit 2 ;; esac
case "$CGRX_VERSION" in *[!a-zA-Z0-9._-]*|*..*) echo 'Invalid version tag' >&2; exit 2 ;; esac

installer=''
if [ -n "${BASH_SOURCE[0]:-}" ]; then
    script_dir=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
    if [ -f "$script_dir/install.sh" ]; then installer="$script_dir/install.sh"; fi
fi
if [ -z "$installer" ]; then
    stage=$(mktemp -d)
    trap 'rm -rf "$stage"' EXIT
    installer="$stage/install.sh"
    curl --fail --location --silent --show-error --proto '=https' --tlsv1.2 \
        --connect-timeout 20 --max-time 60 -o "$installer" \
        "https://raw.githubusercontent.com/ibotpafos/cgrx/$CGRX_VERSION/install.sh"
fi

# Canonical installation owns verification, atomic replacement and old-binary backup.
sh "$installer" "$@"
hermes mcp add cgrx --command "$CGRX_INSTALL_DIR/cgrx" --args serve --multi-repo
echo "Restart Hermes to load CGRX tools."
