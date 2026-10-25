#!/usr/bin/env bash
# Midland Commercials - server deploy script
# Location on server: ~/midland/deploy.sh
set -euo pipefail

APP_DIR="$HOME/midland"
APP_NAME="midland-backend"
BRANCH="main"

# nvm wala node ho toh load kar lo (non-interactive SSH me PATH nahi milta)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd "$APP_DIR"

echo "==> Latest code pull"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Dependencies install"
npm ci

echo "==> Frontend build (client/dist)"
npm run build

echo "==> Backend syntax check"
npm run check --workspace backend

echo "==> PM2 restart"
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
else
  NODE_ENV=production pm2 start npm --name "$APP_NAME" -- start
fi
pm2 save

echo "==> Health check"
PORT=$(grep -E '^PORT=' backend/.env | cut -d= -f2 || echo 5001)
PORT=${PORT:-5001}
for i in {1..10}; do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" > /dev/null; then
    echo "Deploy successful - app healthy on port ${PORT}"
    exit 0
  fi
  sleep 3
done

echo "Health check failed. Logs:"
pm2 logs "$APP_NAME" --lines 40 --nostream
exit 1
