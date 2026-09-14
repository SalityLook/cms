#!/usr/bin/env bash
# Production start script for pm2 — loads the monorepo root .env, sets this
# app's port, and runs the built Nitro server. See CLAUDE.md Gotcha #8 for
# why the root .env isn't picked up automatically.
set -euo pipefail
cd "$(dirname "$0")"
set -a
source ../../.env
set +a
export PORT=3000
export NODE_ENV=production
exec node .output/server/index.mjs
