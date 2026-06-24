#!/bin/bash
# certbot SSL 证书自动续期脚本
# 由 docker-compose.prod.yml 中 nginx 容器 cron 每周日凌晨3点触发

certbot renew --quiet --nginx

if [ $? -eq 0 ]; then
  nginx -s reload
  echo "$(date): SSL certificates renewed successfully"
else
  echo "$(date): certbot renew failed" >&2
fi
