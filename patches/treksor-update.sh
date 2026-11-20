#!/usr/bin/env bash
# Treksor local updater: use in a SECOND Git Bash terminal; Expo can stay open.
set -euo pipefail
cd "$HOME/TreksorDevCompleto"
if [[ -n "$(git rev-parse --show-prefix)" ]]; then echo "ERROR: carpeta incorrecta"; exit 1; fi
CHANNEL="fix/v16-compact-screen-top-rhythm-20261120"
echo "TREKSOR | Revisando actualizaciones aprobadas..."
git fetch origin "$CHANNEL"
tmp="$(mktemp ../treksor-channel-XXXXXX.cjs)"
trap 'rm -f "$tmp"' EXIT
git show "FETCH_HEAD:patches/treksor-update-channel.cjs" > "$tmp"
node "$tmp"
echo ""
echo "TREKSOR | Listo. Expo sigue abierto; recarga la app con r en la ventana del QR si es necesario."
