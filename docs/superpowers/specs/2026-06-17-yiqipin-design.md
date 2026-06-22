# 一起拼 — 产品设计规格书

> 版本: v1.0 | 日期: 2026-06-17 | 状态: 已确认

---

## 一、产品概述

### 1.1 一句话定位

**附近的人，马上组局。** —— 解决"在家无聊，想约人打球/游泳/跑步/拼单，但附近没朋友"的问题。

### 1.2 核心价值

| 用户痛点 | 解决方案 |
|----------|----------|
| 在家无聊想运动/拼单，找不到人 | LBS 3-10km范围，刷附近圈子即时加入 |
| 附近没朋友、刚搬家/毕业 | 基于地理位置匹配陌生人组局 |
| 约好了但被放鸽子 | 信用评分体系 + 鸽子记录公开 |
| 不知道附近有什么局 | 探探式圆盘卡片浏览，即将开始的优先展示 |

### 1.3 产品定位 vs 竞品

| 竞品 | 差异 |
|------|------|
| 陌陌（附近动态） | "社交"打底，活动是手段；一起拼是"组局"打底，社交是结果 |
| 小红书（同城约玩） | 太重内容（先发帖再约）；一起拼直接组局，路径更短 |
| 豆瓣小组（同城活动） | 提前多天预约；一起拼主打"即时"——现在就要，马上成局 |

---

## 二、用户与场景

### 2.1 目标用户

| 类型 | 场景 | 核心需求 |
|------|------|----------|
| 轻度冲动型（最多） | 周末下午无聊 | 马上能参加的局，决策成本极低 |
| 重度玩家型 | 每周固定打球跑步 | 固定搭子，关注信用/水平 |
| 新来城市型 | 刚搬家/毕业 | 社交 > 活动，希望认识附近的人 |
| 尝鲜型 | 朋友分享引入 | 第一次打开要马上看到内容 |

### 2.2 核心路径（目标触达时间）

```
打开App(0s) → 首页看到卡片(0.5s) → 右滑/点击加入(1s) → 进入聊天(1.5s) → 出门
```

---

## 三、功能范围

### 3.1 MVP 核心功能

| 模块 | 功能 |
|------|------|
| 用户 | 微信授权登录 + 手机号绑定、个人主页（基础+信用统计）、兴趣标签 |
| 圈子浏览 | 圆盘卡片（探探式滑动）+ 列表模式切换、顶部搜索+筛选（类型/距离/时间）|
| 圈子 | 创建（3步极简）、加入/退出、100人上限、活动类型分类、即时/预约标签 |
| 生命周期 | 活动时间+24h后自动解散、支持一键扩大搜索范围 |
| 聊天 | 文字+图片+表情、WebSocket实时推送、系统消息混排、敏感词拦截、快捷短语 |
| 信用 | 互评1-5星、好评率展示、鸽子记录、新用户24h观察期 |
| 审核 | 举报→人工审核→三档处罚（警告/禁言/封号）|
| 支付 | 微信支付 + 支付宝（预留，v1仅保留扩展点）|
| 管理后台 | React Web：用户管理、圈子管理、举报审核 |

### 3.2 v2 预留功能

- 押金体系（活动到场签到自动退）
- 创建者会员（9.9元/月）
- 等级体系 + 徽章成就
- 搭子系统（活动后沉淀关系）
- 推广位（商家创建官方圈子）
- 拼单抽佣

---

## 四、页面与交互

### 4.1 App 导航结构

```
3个底部Tab + 中间悬浮创建按钮：

发现 (圈子浏览)     ＋ (创建圈子)     消息 (聊天列表)    我的 (个人中心)
```

### 4.2 首页圆盘卡片

单张卡片内容（优先级排序）：
- 类型图标 + 距离
- 标题（大字）
- 当前人数/上限
- 活动时间 + 倒计时感
- 创建者评分
- 左滑跳过 / 右滑加入

视觉区分：
- 1小时内开始 → 红色"🔥 即将开始"
- 24小时后 → 蓝色"📅 计划中"

卡片排序：即将开始 > 人数多 > 距离近

空状态：引导创建 + 展示系统预设圈子

### 4.3 创建圈子（3步极简）

```
步骤1: 选活动类型（大图标网格，一键）
步骤2: 填时间（默认"现在"）+ 地点（自动定位）+ 人数（活动类型推荐默认值）
步骤3: 确认发布
```

不要求封面图、不要求长描述。标题自动生成："[昵称]发起的[活动类型]"。

### 4.4 圈子详情页

- 圈子信息（类型/地点/时间/人数/创建者评分）
- 成员头像列表
- 「加入」按钮（核心CTA）
- 加入后才可见聊天入口
- 点击地点 → 调起高德地图导航
- 举报入口

### 4.5 聊天页

- 文字 + 图片 + 表情
- 系统消息混排（灰色小字区分）
- 快捷表情栏
- 快捷短语："我在路上""我到了""还有位置吗""+1"
- 圈子解散后输入框变灰："圈子已结束，无法发言"

### 4.6 消息Tab

- 我加入的圈子列表
- 最后一条消息预览 + 未读红点
- 已结束的圈子折叠到底部

### 4.7 我的页面（精简版）

- 头像/昵称/等级/评分
- 数据统计：发起/参与/好评率/鸽子
- 入口：我的圈子、评价记录、设置

### 4.8 新手引导

3屏引导 → 获取位置权限 → 微信登录 → 兴趣标签选择 → 进入首页

---

## 五、视觉调性

| 维度 | 方向 |
|------|------|
| 主色调 | 橙色/暖黄色（活力、冲动、运动感）|
| 辅色 | 深灰（信任感）|
| 卡片 | 大圆角 + 轻微阴影 |
| 字体 | 标题粗体，距离/时间等宽数字 |
| 图标 | 彩色 emoji 风格（🏀⚽🏸）|
| 动效 | 加入成功卡片飞入聊天转场 |
| App图标 | 橙底白图，两人+运动元素，圆润动感 |

---

## 六、传播机制

- **"帮我组局"分享**：创建圈子后生成分享图 → 微信/朋友圈 → 跳App加入
- **活动卡片留念**：活动结束后自动生成战绩卡片（类型/地点/日期/队友），用户自发截图分享
- **实时社交证明**：首页展示"附近有XX人在组局""今天已有XX个圈子成局"
- **邀请激励**：邀请新用户双方各得经验值加成

---

## 七、技术架构

### 7.1 技术栈

| 层 | 选型 |
|----|------|
| App | Flutter + Riverpod（状态管理）|
| 后端 | NestJS + TypeScript（模块化单体）|
| 数据库 | PostgreSQL 15 + PostGIS 3 |
| 缓存 | Redis 7 |
| 存储 | 腾讯云 COS（图片 + 备份）|
| 地图 | 高德地图 SDK（定位 + 签到范围判断）|
| 实时通信 | Socket.IO（WebSocket）|
| 管理后台 | React 18 + Ant Design 5 + Zustand |
| 部署 | 腾讯云 CVM + Docker Compose |
| 日志 | Pino（结构化JSON）|
| 错误追踪 | Sentry |
| 支付 | 微信支付 + 支付宝（v1预留扩展点）|

### 7.2 部署架构

```
Docker Compose:

┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Nginx   │  │ NestJS   │  │ NestJS   │  │  Admin   │
│  反向代理 │  │ api      │  │ worker   │  │  React   │
│  :80     │  │ :3000    │  │ (定时任务)│  │ 静态文件  │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘
     │             │             │
     └─────────────┼─────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌─────────┐ ┌──────┐ ┌──────────┐
   │PostgreSQL│ │Redis │ │COS(图片) │
   │+PostGIS  │ │缓存   │ │+备份归档 │
   │:5432     │ │:6379 │ │          │
   └─────────┘ └──────┘ └──────────┘
        ▲
   ┌────┴──────┐
   │pg_dump    │  ← 每日凌晨3点备份到COS
   │(cron容器) │
   └───────────┘
```

### 7.3 NestJS 模块划分

```
src/
├── auth/          # 微信登录、手机绑定、JWT
├── user/          # 用户CRUD、信用档案、兴趣标签
├── circle/        # 圈子CRUD、搜索、匹配、解散定时
├── chat/          # WebSocket网关、消息收发、敏感词拦截
├── payment/       # 支付接口（v1扩展点）
├── review/        # 评价、举报、内容审核
├── upload/        # COS STS临时令牌签发
├── admin/         # 管理后台API
├── notification/  # 系统消息、推送预留
├── common/        # 守卫、拦截器、过滤器、DTO
└── schedule/      # 定时任务（worker角色执行）
```

### 7.4 数据库核心表

```sql
-- 用户
users (id, wechat_openid, phone, nickname, avatar, interests[], 
       role, created_at)

-- 用户信用档案
user_profiles (user_id, rating_avg, total_ratings, pigeon_count, 
               total_joined, total_created, circle_completion_rate)

-- 活动分类
categories (id, name, icon, parent_id, sort)

-- 圈子 (PostGIS空间索引)
circles (
  id, creator_id, category_id, title, description, cover_image,
  location geography(Point, 4326),
  address text, range_km decimal(3,1) default 3,
  max_members int, start_time timestamp,
  start_type enum('now','today','tomorrow','custom'),
  status enum('active','dissolved','archived'),
  dissolved_at timestamp, created_at
);
CREATE INDEX idx_circles_location ON circles USING GIST(location);
CREATE INDEX idx_circles_start_time ON circles(start_time);
CREATE INDEX idx_circles_status ON circles(status) WHERE status='active';

-- 圈子成员
circle_members (circle_id, user_id, role, joined_at)

-- 圈子消息
circle_messages (id, circle_id, user_id, type, content, image_url, created_at)
-- type: text | image | system

-- 评价
user_reviews (id, circle_id, reviewer_id, target_user_id, rating, comment)

-- 违规记录
violation_records (id, user_id, circle_id, msg_id, action, reason, 
                   reviewed_by, created_at)
-- action: warn | mute_Nh | kick | ban

-- 举报
reports (id, reporter_id, target_user_id, circle_id, reason, 
         images[], status, handled_by)

-- 支付（v1扩展点）
payments (id, user_id, type, amount, channel, transaction_id, status)
```

### 7.5 API 设计（v1）

```
# 认证
POST  /api/v1/auth/wechat-login
POST  /api/v1/auth/bind-phone
GET   /api/v1/auth/me

# 用户
GET    /api/v1/users/:id
PATCH  /api/v1/users/me
GET    /api/v1/users/me/circles
GET    /api/v1/users/:id/reviews

# 圈子
GET    /api/v1/circles              # 附近圈子（lat,lng,range,category,time,instant）
GET    /api/v1/circles/cards        # 圆盘卡片流
GET    /api/v1/circles/:id
POST   /api/v1/circles              # 创建
PATCH  /api/v1/circles/:id          # 编辑
DELETE /api/v1/circles/:id          # 解散
POST   /api/v1/circles/:id/join
POST   /api/v1/circles/:id/leave
GET    /api/v1/circles/:id/members
POST   /api/v1/circles/:id/checkin  # 签到
POST   /api/v1/circles/:id/expand   # 扩大搜索范围

# 搜索
GET    /api/v1/search               # ?q=&lat=&lng=
GET    /api/v1/categories           # 分类列表

# 上传
POST   /api/v1/upload/token         # COS STS令牌

# 评价 & 举报
POST   /api/v1/reviews
POST   /api/v1/reports

# 健康检查
GET    /api/health
```

### 7.6 WebSocket 消息协议

```
连接: ws://host/chat?token={jwt}

客户端 → 服务端:
  { event: 'send_msg', data: { circle_id, type: 'text'|'image', content, image_url? } }

服务端 → 客户端:
  { event: 'new_msg', data: { id, circle_id, user, type, content, image_url, created_at } }
  { event: 'system',  data: { circle_id, action, user?, timestamp } }
  { event: 'error',   data: { code, message } }
  { event: 'muted',   data: { circle_id, until, reason } }

心跳: 30s无消息断开，客户端指数退避重连(1s→2s→4s→30s max)，重连后自动Re-Join
```

### 7.7 关键架构决策

| 决策 | 说明 |
|------|------|
| api + worker 双实例 | 同一份NestJS代码，环境变量区分角色。api处理HTTP/WS，worker只跑定时任务 |
| COS STS临时令牌 | 客户端不持有COS密钥，后端签发STS，直传 |
| PostGIS查询缓存 | Redis缓存地理位置查询（按网格分桶），TTL 30s |
| Rate Limiting | 建圈5次/天、发消息1条/秒、举报10次/天 |
| 连接池 | TypeORM max 20连接 |
| PgBouncer | 暂不需要，v2评估 |
| 读写分离 | 暂不需要，v2评估 |

---

## 八、安全与非功能需求

### 8.1 安全

- JWT Token 有效期: access 2h / refresh 7d
- 敏感词库拦截发消息
- 位置隐私：对外模糊距离，加入后才展示具体地点
- 可选隐身模式：可关闭"被发现"
- 举报需提供理由，恶意举报者反向处罚

### 8.2 性能

- 附近圈子查询 < 200ms（PostGIS索引 + Redis缓存）
- WebSocket消息送达 < 100ms
- 图片上传 COS 直传，不经过服务器

### 8.3 可靠性

- Docker Compose `restart: always`
- 健康检查端点 `/api/health`
- 每日凌晨3点 pg_dump → COS，保留7天
- Sentry 错误监控

### 8.4 北极星指标

**成局率** = 创建圈子后实际有人到场的比例

- 目标 > 60%
- 驱动因素：圈子密度、匹配效率、通知触达

---

## 九、App Store 上架信息

| 字段 | 内容 |
|------|------|
| 主标题 | 一起拼 - 附近组局找搭子 |
| 副标题 | 打球跑步拼单K歌，马上成局 |
| 关键词 | 组局 搭子 附近 打球 拼单 K歌 跑步 社交 |
| 分类 | 社交 |

---

## 十、变更记录

| 日期 | 变更 |
|------|------|
| 2026-06-17 | 初始版本，完整设计规格 |
