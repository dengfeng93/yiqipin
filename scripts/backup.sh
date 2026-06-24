#!/bin/sh
# 数据库备份脚本 — 每日凌晨4:00由 cron 触发
# 保留最近30天的备份

BACKUP_DIR="/backups"
DB_NAME="${PGDATABASE:-yiqipin}"
DB_USER="${PGUSER:-yiqipin}"
DB_HOST="${PGHOST:-postgres}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup of $DB_NAME..."
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
    echo "[$(date)] Backup FAILED"
    exit 1
fi

# 清理30天前的备份
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
echo "[$(date)] Cleaned backups older than 30 days"
