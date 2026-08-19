#!/usr/bin/env bash
# Builds the admin panel and assembles a clean, deployable folder containing
# ONLY the compiled output — no .tsx/.ts source, no dev dependencies.
#
# Usage: run from the admin/ directory: bash scripts/build-for-deploy.sh
# Output: admin/deploy-build/  <- zip this and upload to Plesk, or rsync it.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Building..."
npm run build

# Next.js standalone output nests under the app's path relative to the repo
# root (this app isn't at the repo root, hence the extra "admin/" segment).
STANDALONE=".next/standalone/admin"

if [ ! -d "$STANDALONE" ]; then
  echo "ERROR: $STANDALONE not found. Did the build succeed, or did the" >&2
  echo "       monorepo path structure change?" >&2
  exit 1
fi

echo "==> Assembling deployable folder..."
rm -rf deploy-build
cp -r "$STANDALONE" deploy-build

# public/ and .next/static/ are NOT included in standalone output by design —
# Next.js expects you to copy them in yourself.
mkdir -p deploy-build/public
cp -r public/. deploy-build/public/
mkdir -p deploy-build/.next/static
cp -r .next/static/. deploy-build/.next/static/

echo "==> Done. Deployable app is in: admin/deploy-build/"
echo "    Contains: server.js, .next/ (compiled), node_modules (pruned), public/"
echo "    Does NOT contain: any .tsx/.ts source, dev dependencies."
echo ""
echo "    Plesk Node.js app settings:"
echo "      Application Root   -> wherever you upload deploy-build/'s contents"
echo "      Application Startup File -> server.js"
echo "      Custom environment variable PORT will be set by Plesk automatically."
