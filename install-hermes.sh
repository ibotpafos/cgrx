#!/bin/bash
# CGRX installer for Hermes Agent
# Usage: curl -fsSL https://raw.githubusercontent.com/ibotpafos/cgrx/main/install-hermes.sh | bash
# Or locally: ./install-hermes.sh

set -euo pipefail

CGRX_VERSION="${CGRX_VERSION:-v0.1.0}"
CGRX_INSTALL_DIR="${CGRX_INSTALL_DIR:-$HOME/.local/bin}"
CGRX_REPO="https://github.com/ibotpafos/cgrx"

echo "=== CGRX installer for Hermes Agent ==="
echo ""

# 1. Check prerequisites
if ! command -v hermes &> /dev/null; then
    echo "ERROR: hermes not found in PATH. Install Hermes first:"
    echo "  curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash"
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    echo "ERROR: cargo not found. Install Rust first:"
    echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# 2. Build CGRX from source (pinned version)
BUILD_DIR=$(mktemp -d)
trap "rm -rf $BUILD_DIR" EXIT

echo "[1/4] Cloning CGRX $CGRX_VERSION..."
git clone --depth 1 --branch "$CGRX_VERSION" "$CGRX_REPO" "$BUILD_DIR/cgrx" 2>/dev/null || {
    echo "  Tag $CGRX_VERSION not found, using main..."
    git clone --depth 1 "$CGRX_REPO" "$BUILD_DIR/cgrx"
}

echo "[2/4] Building CGRX (release)..."
cd "$BUILD_DIR/cgrx"
cargo build --locked --release -p cgrx-cli 2>&1 | tail -3

# 3. Install binary
echo "[3/4] Installing to $CGRX_INSTALL_DIR/cgrx..."
mkdir -p "$CGRX_INSTALL_DIR"
cp target/release/cgrx "$CGRX_INSTALL_DIR/cgrx"
chmod +x "$CGRX_INSTALL_DIR/cgrx"

# Backup existing
if [ -f "$CGRX_INSTALL_DIR/cgrx" ] && [ "$CGRX_INSTALL_DIR/cgrx" -ef "$BUILD_DIR/cgrx/target/release/cgrx" ]; then
    echo "  (fresh install)"
elif [ -f "$CGRX_INSTALL_DIR/cgrx" ]; then
    cp "$CGRX_INSTALL_DIR/cgrx" "$CGRX_INSTALL_DIR/cgrx.backup.$(date +%s)"
    echo "  (backed up existing)"
fi

# 4. Connect to Hermes
echo "[4/4] Connecting to Hermes..."
hermes mcp add cgrx --command "$CGRX_INSTALL_DIR/cgrx" --args serve --multi-repo 2>&1 | head -5

echo ""
echo "=== CGRX installed ==="
echo "  Binary: $CGRX_INSTALL_DIR/cgrx"
echo "  Version: $("$CGRX_INSTALL_DIR/cgrx" --version 2>&1 | head -1)"
echo "  MCP: hermes mcp list"
echo ""
echo "Restart Hermes to load CGRX tools, then use:"
echo "  cgrx status --repo <path>"
echo "  cgrx search_graph --query <symbol>"
echo "  cgrx scan_risks --repo <path>"
