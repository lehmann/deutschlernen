#!/usr/bin/env bash
# auto-update.sh — pulls latest commits and redeploys only when there are changes.
# Called by deutschlernen-update.timer every 5 minutes.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

git fetch origin main --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

# Nothing to do
[[ "$LOCAL" == "$REMOTE" ]] && exit 0

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Atualização: ${LOCAL:0:7} → ${REMOTE:0:7}"
git pull --ff-only
npm install
npm run build
sudo systemctl restart deutschlernen
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deploy concluído"
