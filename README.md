# 一起拼 — 生产部署检查清单

## 部署前准备

1. [ ] 腾讯云 CVM 创建 (2核4G, Ubuntu 22.04)
2. [ ] 安装 Docker + Docker Compose
3. [ ] 配置 .env 文件 (JWT_SECRET使用64位随机字符串)
4. [ ] 配置腾讯云 COS bucket (私有读写)
5. [ ] 配置微信开放平台 AppID/Secret
6. [ ] 配置高德地图 API Key
7. [ ] 配置域名 DNS 指向服务器 IP

## 首次部署

8. [ ] 运行 certbot 获取 Let's Encrypt SSL 证书
   ```bash
   docker compose -f docker-compose.prod.yml run --rm certbot \
     certonly --webroot -w /var/www/certbot -d yiqipin.cn -d www.yiqipin.cn
   ```
9. [ ] 启动所有服务
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
10. [ ] 验证健康检查: `curl https://yiqipin.cn/api/v1/health`
11. [ ] 配置 Sentry DSN
12. [ ] 配置腾讯云图片审核 API

## 日常运维

- 查看日志: `docker compose -f docker-compose.prod.yml logs -f api`
- 重启服务: `docker compose -f docker-compose.prod.yml restart api`
- 数据库备份存储在 `./backups/` 目录
- 备份保留30天自动清理

## SSL 证书续期

Certbot 已配置自动续期，每月1号凌晨3:00执行:
```bash
docker compose -f docker-compose.prod.yml exec certbot certbot renew --quiet
```
