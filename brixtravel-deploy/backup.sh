#!/usr/bin/env bash
# Brixtravel daily backup — mirrors the Wapy pattern.
# Runs from cron at 03:30 daily (Wapy runs at 03:00).
#
# Install:
#   sudo cp backup.sh /opt/brixtravel/backup.sh
#   sudo chmod +x /opt/brixtravel/backup.sh
#   sudo crontab -e
#   30 3 * * * /opt/brixtravel/backup.sh >> /var/log/brixtravel-backup.log 2>&1

set -euo pipefail

STACK_DIR="/opt/brixtravel"
BACKUP_DIR="/opt/brixtravel/backups"
KEEP_DAYS=14
TS="$(date +%F_%H%M)"

cd "$STACK_DIR"

# shellcheck disable=SC1091
set -a; source .env; set +a

mkdir -p "$BACKUP_DIR"

# 1) DB dump
docker exec brixtravel-db \
  mariadb-dump -u root -p"$WP_DB_ROOT_PASSWORD" --single-transaction --quick \
  "$WP_DB_NAME" | gzip -9 > "$BACKUP_DIR/db_${TS}.sql.gz"

# 2) wp-content (uploads, themes, plugins)
docker run --rm \
  -v brixtravel_wp_data:/src:ro \
  -v "$BACKUP_DIR":/dst \
  alpine:3 \
  tar -czf "/dst/wpcontent_${TS}.tar.gz" -C /src wp-content

# 3) Prune
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +${KEEP_DAYS} -delete

echo "[$(date -Iseconds)] backup ok: db_${TS}.sql.gz + wpcontent_${TS}.tar.gz"
