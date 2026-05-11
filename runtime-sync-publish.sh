#!/bin/zsh
set -euo pipefail

ROOT="/Users/rabeeshaban/Documents/New project/command-center"
NODE_BIN="$(command -v node || echo /usr/local/bin/node)"
GIT_BIN="$(command -v git || echo /usr/bin/git)"
LOCK_DIR="$ROOT/.runtime-sync.lock"

cd "$ROOT"

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "runtime-sync: lock busy, skipping"
  exit 0
fi

cleanup() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [ ! -x "$NODE_BIN" ]; then
  echo "runtime-sync: node not found at $NODE_BIN"
  exit 1
fi

if [ ! -x "$GIT_BIN" ]; then
  echo "runtime-sync: git not found at $GIT_BIN"
  exit 1
fi

"$NODE_BIN" runtime-sync.js

"$GIT_BIN" add data.runtime.json

if "$GIT_BIN" diff --cached --quiet -- data.runtime.json; then
  echo "runtime-sync: no runtime changes"
  exit 0
fi

STAMP="$(date -u '+%Y-%m-%d %H:%M UTC')"
"$GIT_BIN" commit -m "chore: refresh runtime state ($STAMP)" -- data.runtime.json
"$GIT_BIN" push origin main

echo "runtime-sync: committed and pushed"
