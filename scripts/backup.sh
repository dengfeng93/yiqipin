#!/bin/sh
# 数据库备份脚本 — 每日凌晨3:00由 cron 触发
# 保留 N 天（默认7天）的备份，同时上传至腾讯云 COS

BACKUP_DIR="/backups"
DB_NAME="${PGDATABASE:-yiqipin}"
DB_USER="${PGUSER:-yiqipin}"
DB_HOST="${PGHOST:-postgres}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup of $DB_NAME..."
export PGPASSWORD="${PGPASSWORD}"
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
    echo "[$(date)] Backup FAILED"
    exit 1
fi

# 上传至 COS（如果配置了凭证）
if [ -f /usr/local/bin/upload_to_cos.py ] && [ -n "${COS_SECRET_ID}" ]; then
    echo "[$(date)] Uploading to COS..."
    python3 /usr/local/bin/upload_to_cos.py "$BACKUP_FILE"
    if [ $? -eq 0 ]; then
        echo "[$(date)] COS upload succeeded"
    else
        echo "[$(date)] COS upload FAILED (backup is still saved locally)"
    fi
fi

# 清理旧备份
find "$BACKUP_DIR" -name "*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
echo "[$(date)] Cleaned backups older than ${RETENTION_DAYS} days"
