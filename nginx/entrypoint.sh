#!/bin/sh
CERT=/etc/letsencrypt/live/yiqipin.cn/fullchain.pem

if [ ! -f "$CERT" ]; then
  echo "=== 首次部署: 无 SSL 证书，使用 HTTP-only 模式申请证书 ==="
  sed -i 's/listen 443 ssl.*/#https-disabled/g' /etc/nginx/conf.d/default.conf
  nginx
  sleep 2
  certbot certonly --webroot -w /var/www/certbot \
    -d yiqipin.cn -d www.yiqipin.cn \
    --email admin@yiqipin.cn --agree-tos --non-interactive
  sed -i 's/#https-disabled/listen 443 ssl http2;/g' /etc/nginx/conf.d/default.conf
  nginx -s reload
  echo "=== SSL 证书获取完成 ==="
else
  echo "=== SSL 证书已存在，正常启动 ==="
  echo '0 3 * * 0 /usr/local/bin/certbot-renew.sh >> /var/log/certbot.log 2>&1' | crontab -
  crond
  nginx -g 'daemon off;'
fi
