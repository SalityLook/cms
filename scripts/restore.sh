#!/usr/bin/env bash
# Restore database + uploaded media for SelfTaught CMS from a backup made by
# scripts/backup.sh.
#
# Usage:
#   ./scripts/restore.sh path/to/db-<timestamp>.sql.gz [path/to/media-<timestamp>.tar.gz]
#
# WARNING: this overwrites the current database content and media folder.
# Meant for disaster recovery / moving to a new server, not routine use.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_BACKUP="${1:?Usage: $0 <db-backup.sql.gz> [media-backup.tar.gz]}"
MEDIA_BACKUP="${2:-}"

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

read -rp "This will overwrite the current database at DATABASE_URL. Continue? [y/N] " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "Aborted."
  exit 1
fi

echo "Restoring database from $DB_BACKUP ..."
gunzip -c "$DB_BACKUP" | psql "$DATABASE_URL"

if [ -n "$MEDIA_BACKUP" ]; then
  MEDIA_PATH_RAW="${MEDIA_LOCAL_PATH:-../../data/media}"
  MEDIA_DIR="$REPO_ROOT/apps/admin/$MEDIA_PATH_RAW"
  MEDIA_PARENT="$(dirname "$MEDIA_DIR")"
  mkdir -p "$MEDIA_PARENT"
  echo "Restoring media from $MEDIA_BACKUP into $MEDIA_PARENT ..."
  tar -xzf "$MEDIA_BACKUP" -C "$MEDIA_PARENT"
fi

echo "Restore complete."
