#!/usr/bin/env bash
set -euo pipefail
# One entrypoint for Treksor V1.4 from Git Bash on Windows.
# Never resets, pulls, removes worktrees, changes tracked user data or publishes.
BRANCH="feature/v14-unified-simple-progress-20261120"
TRACK="refs/remotes/origin/$BRANCH"
SOURCE="$HOME/TreksorApp"
DEST="$HOME/TreksorDevCompleto"

if [ ! -d "$SOURCE/.git" ] && [ ! -f "$SOURCE/.git" ]; then
  echo "No se encontro la carpeta original ~/TreksorApp. No se modifico nada." >&2
  exit 1
fi
cd "$SOURCE"
git fetch origin "+refs/heads/$BRANCH:$TRACK"

if [ -e "$DEST" ]; then
  cd "$DEST"
  if [ "$(git rev-parse --show-toplevel 2>/dev/null)" != "$(pwd -P)" ]; then
    echo "TreksorDevCompleto existe pero no es la raiz de un repositorio Git. No se sobrescribio." >&2
    exit 1
  fi
else
  git worktree add -b treksor-dev-unificado-v14 "$DEST" "$TRACK"
  cd "$DEST"
fi

TEMP="$(mktemp ../Treksor-progress-XXXXXX.cjs)"
trap 'rm -f "$TEMP"' EXIT
git show "$TRACK:patches/apply-unified-progress-windows.cjs" > "$TEMP"
node --check "$TEMP"
node "$TEMP" --check
node "$TEMP"
if [ ! -f node_modules/typescript/package.json ]; then
  npm ci
fi
echo
echo "TREKSOR V1.4 LISTO EN: $(pwd)"
echo "Las pestañas serán Home / Guide / Progress / Community."
echo "Para abrir el nuevo código, DETENÉ cualquier Expo anterior con Ctrl+C y ejecutá:"
echo "  cd ~/TreksorDevCompleto"
echo "  TREKSOR_IPHONE_DEV=1 npx expo start --dev-client --lan --clear"
