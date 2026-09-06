#!/bin/sh
# CGRX user-local installer. No sudo, shell profile edits, or client config edits.
set -eu
version=${CGRX_VERSION:-v0.1.0-alpha.6}
dest=${CGRX_INSTALL_DIR:-"$HOME/.local/bin"}
source_install=0
for arg in "$@"; do
    case "$arg" in
        --source) source_install=1 ;;
        --help) printf '%s\n' 'Usage: sh install.sh [--source]' 'CGRX_VERSION=v0.1.0-alpha.6 CGRX_INSTALL_DIR=$HOME/.local/bin'; exit 0 ;;
        *) echo "Unknown option: $arg" >&2; exit 2 ;;
    esac
done
# Tags are literal URL/path components, never shell expressions.
case "$version" in v[0-9]*) ;; *) echo 'Invalid version tag' >&2; exit 2 ;; esac
case "$version" in *[!a-zA-Z0-9._-]*|*..*) echo 'Invalid version tag' >&2; exit 2 ;; esac
case "$dest" in /*) ;; *) echo 'CGRX_INSTALL_DIR must be absolute' >&2; exit 2 ;; esac
os=$(uname -s)
arch=$(uname -m)
case "$os" in Darwin|Linux) ;; *) echo "Unsupported platform: $os; use Linux/WSL or macOS" >&2; exit 2 ;; esac
if [ "$os/$arch" != Darwin/arm64 ] && [ "$os/$arch" != Darwin/aarch64 ]; then source_install=1; fi
if [ "$source_install" = 1 ]; then
    command -v cargo >/dev/null 2>&1 || { echo 'Source install needs Rust 1.89.0 (rustup), Git and a C compiler' >&2; exit 1; }
else
    command -v curl >/dev/null 2>&1 || { echo 'curl is required' >&2; exit 1; }
fi
mkdir -p "$dest"
lock="$dest/.cgrx-install.lock"
mkdir "$lock" 2>/dev/null || { echo "Another install is active (or left a stale lock): $lock" >&2; exit 1; }
stage=''
cleanup() {
    if [ -n "$stage" ]; then rm -rf "$stage"; fi
    rmdir "$lock" 2>/dev/null || :
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM HUP
stage=$(mktemp -d "$dest/.cgrx-install.XXXXXX")
if [ "$source_install" = 1 ]; then
    echo "Building CGRX $version with Rust 1.89.0 (requires Git and a C compiler)..."
    cargo +1.89.0 install --locked --git https://github.com/ibotpafos/cgrx.git --tag "$version" --root "$stage/source" cgrx-cli
    cp "$stage/source/bin/cgrx" "$stage/cgrx"
else
    asset="cgrx-$version-aarch64-apple-darwin.tar.gz"
    base="https://github.com/ibotpafos/cgrx/releases/download/$version"
    curl --fail --location --silent --show-error --proto '=https' --tlsv1.2 --connect-timeout 20 --max-time 300 -o "$stage/$asset" "$base/$asset"
    curl --fail --location --silent --show-error --proto '=https' --tlsv1.2 --connect-timeout 20 --max-time 60 -o "$stage/SHA256SUMS" "$base/SHA256SUMS"
    expected=$(awk -v name="$asset" '$2 == name {print $1}' "$stage/SHA256SUMS")
    case "$expected" in ''|*[!a-fA-F0-9]*) echo 'Missing or invalid release checksum' >&2; exit 1 ;; esac
    [ "${#expected}" -eq 64 ] || { echo 'Invalid release checksum length' >&2; exit 1; }
    if command -v shasum >/dev/null 2>&1; then
        actual=$(shasum -a 256 "$stage/$asset" | awk '{print $1}')
    else
        actual=$(sha256sum "$stage/$asset" | awk '{print $1}')
    fi
    [ "$actual" = "$expected" ] || { echo 'Release checksum mismatch; previous install unchanged' >&2; exit 1; }
    # Extract only file bytes to a chosen path, never archive-controlled paths.
    tar -xzOf "$stage/$asset" cgrx > "$stage/cgrx"
fi
chmod 755 "$stage/cgrx"
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"cgrx-installer","version":"1"}}}' | "$stage/cgrx" serve --multi-repo > "$stage/probe.json"
grep -q '"protocolVersion"' "$stage/probe.json" || { echo 'MCP initialization check failed' >&2; exit 1; }
if [ -d "$dest/cgrx" ]; then echo 'Destination cgrx is a directory' >&2; exit 1; fi
backup=''
if [ -e "$dest/cgrx" ] || [ -L "$dest/cgrx" ]; then
    backup=$(mktemp "$dest/cgrx.backup.XXXXXX")
    cp -p "$dest/cgrx" "$backup"
fi
# Same filesystem: rename replaces the executable only after verification.
mv -f "$stage/cgrx" "$dest/cgrx"
printf 'Installed CGRX %s: %s/cgrx\n' "$version" "$dest"
if [ -n "$backup" ]; then printf 'Previous binary preserved: %s\n' "$backup"; fi
printf '%s\n' 'MCP initialize: PASS. Client configurations were not modified.'
printf 'Use the absolute executable path above with: serve --multi-repo\n'
case ":$PATH:" in *":$dest:"*) ;; *) printf 'Add this directory to PATH if needed: %s\n' "$dest" ;; esac
