#!/usr/bin/env bash
# Builds the admin panel and pushes ONLY the compiled output to a separate,
# source-free repository — the one Plesk's frontend Node.js app pulls from.
#
# That repo never receives a .tsx/.ts source file in any commit, ever,
# because this script only ever copies admin/deploy-build/ into it.
#
# First-time setup:
#   1. Create a new empty private repo on GitHub (no README/license).
#   2. Set DEPLOY_REPO_URL below (or export it before running this script).
#
# Usage: bash scripts/push-build.sh "Optional commit message"

set -euo pipefail
cd "$(dirname "$0")/.."

DEPLOY_REPO_URL="${DEPLOY_REPO_URL:-https://github.com/voiceofanees/aerolinks-admin-dist.git}"
DEPLOY_REPO_DIR=".deploy-repo"
COMMIT_MSG="${1:-Build $(date '+%Y-%m-%d %H:%M:%S')}"

echo "==> Building deployable output..."
bash scripts/build-for-deploy.sh

echo "==> Preparing local clone of the build-artifacts repo..."
if [ ! -d "$DEPLOY_REPO_DIR/.git" ]; then
  git clone "$DEPLOY_REPO_URL" "$DEPLOY_REPO_DIR"
fi

echo "==> Syncing build output into the deploy repo..."
# Clear out everything except .git, then copy the fresh build in.
find "$DEPLOY_REPO_DIR" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -r deploy-build/. "$DEPLOY_REPO_DIR/"

cd "$DEPLOY_REPO_DIR"
git add -A

if git diff --cached --quiet; then
  echo "==> No changes since last build — nothing to push."
  exit 0
fi

git commit -m "$COMMIT_MSG"
git push origin HEAD:main

echo ""
echo "==> Pushed. On Plesk, open the frontend Node.js site's Git tab and"
echo "    click 'Pull Updates', then restart the Node.js app."
