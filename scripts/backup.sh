#!/usr/bin/env bash
# Backup database + uploaded media for SelfTaught CMS.
#
# Usage:
#   ./scripts/backup.sh [output-dir]
#
# Reads DATABASE_URL and MEDIA_LOCAL_PATH from .env at repo root (same
# convention as every other root script — see CLAUDE.md Gotcha #8).
# Produces two files per run, timestamped so backups don't overwrite each
# other: db-<timestamp>.sql.gz and media-<timestamp>.tar.gz.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-$REPO_ROOT/backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if [ ! -f "$REPO_ROOT/.env" ]; then
  echo "Error: $REPO_ROOT/.env not found." >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
source "$REPO_ROOT/.env"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL is not set in .env" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

DB_BACKUP="$OUT_DIR/db-$TIMESTAMP.sql.gz"
echo "Dumping database to $DB_BACKUP ..."
pg_dump "$DATABASE_URL" | gzip > "$DB_BACKUP"

# MEDIA_LOCAL_PATH is relative to apps/admin or apps/frontend (see CLAUDE.md
# Gotcha #11) — resolve it from apps/admin since that's where uploads happen.
MEDIA_PATH_RAW="${MEDIA_LOCAL_PATH:-../../data/media}"
MEDIA_DIR="$(cd "$REPO_ROOT/apps/admin" 2>/dev/null && cd "$MEDIA_PATH_RAW" 2>/dev/null && pwd || true)"

if [ -n "$MEDIA_DIR" ] && [ -d "$MEDIA_DIR" ]; then
  MEDIA_BACKUP="$OUT_DIR/media-$TIMESTAMP.tar.gz"
  echo "Archiving media from $MEDIA_DIR to $MEDIA_BACKUP ..."
  tar -czf "$MEDIA_BACKUP" -C "$(dirname "$MEDIA_DIR")" "$(basename "$MEDIA_DIR")"
else
  echo "Warning: media directory not found (nothing uploaded yet?), skipping media backup." >&2
fi

echo "Done. Backup files in $OUT_DIR:"
ls -lh "$OUT_DIR" | grep "$TIMESTAMP" || true
