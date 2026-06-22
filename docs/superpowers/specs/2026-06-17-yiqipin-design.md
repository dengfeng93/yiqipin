# 一起拼 — 产品设计规格书

> 版本: v1.3 | 日期: 2026-06-22 | 状态: 已确认（多模型审查融合修订）

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
打开App(0s) → 首页看到卡片(0.5s) → 上滑加入/右滑详情(1s) → 进入聊天(1.5s) → 出门
```

---

## 三、功能范围

### 3.1 MVP 核心功能

| 模块 | 功能 |
|------|------|
| 用户 | 微信授权登录 + 手机号绑定、个人主页（基础+信用统计）、兴趣标签、新人友好徽章 |
| 圈子浏览 | 圆盘卡片（上滑加入/右滑详情）+ 列表模式切换、顶部搜索+筛选（类型/距离/时间）、无局时降级展示心愿单列表 |
| 心愿池 | 无附近圈子时展示"附近X人也想[活动]"候补列表，+1参团，人数达标系统自动建圈（2h即时局）|
| 圈子 | 创建（3步极简：类型→时间+地点→发布）、加入/退出、动态人数上限（按活动类型）、活动类型分类、三级时间标签（🔥即将开始/今天/📅计划中）、限定圈子标签（仅女性/仅新手）|
| 生命周期 | 活动时间+24h后自动归档；解散前6h创建者可一键转为"永久私密搭子群"（仅限原成员，不出现在公域）|
| 聊天 | 文字+图片+表情、WebSocket实时推送、系统消息混排、敏感词拦截、快捷短语、消息撤回（2分钟内）、拼单规则置顶提醒 |
| 信用 | 简化评价（到场？是/否 + 可选标签）、到场率展示、近期鸽子率（近7天）、新用户24h观察期 |
| 审核 | 举报→人工审核→三档处罚（警告/禁言/封号）、腾讯云图片内容安全审核 |
| 支付 | 微信支付 + 支付宝（预留，v1仅保留扩展点）|
| 拼单 | 拼单分类强制填写拼单规则、人均预算提示、聊天室规则置顶 |
| 管理后台 | React Web：用户管理、圈子管理、举报审核、敏感词库管理、心愿池阈值配置 |

### 3.2 v2 预留功能

- 押金体系（活动到场签到自动退）
- 创建者会员（9.9元/月）
- 等级体系 + 徽章成就
- 极简AA收款（人均预算→群收款截图）
- 搭子系统完善（互相关注→私聊→优先展示）
- 关联附近场馆（创建时可搜索、自动填充地址）
- 实时位置共享（虚拟围栏，活动前1小时可见）
- 推广位（商家创建官方圈子）
- 拼单抽佣
- 微信服务通知

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
- 创建者到场率 / 新人友好徽章
- 上滑加入 / 右滑查看详情（减少误触）

手势说明：
- **上滑** → 直接加入圈子（需二次确认）
- **右滑** → 进入详情页查看完整信息
- **左滑** → 跳过，下一张

三级时间标签：
- 1小时内开始 → 红色"🔥 即将开始"
- 今天内（1-6小时）→ 橙色"☀️ 今天"
- 明天及以后 → 蓝色"📅 计划中"

卡片排序：即将开始 > 人数多 > 距离近

空状态（分级降级）：
1. 有附近圈子 → 正常卡片浏览
2. 无附近圈子 → 展示心愿单卡片（如"附近3人想打篮球"）+ "+1候补"按钮
3. 无心愿单 → 降级展示系统预设热门活动推荐 + 引导创建

### 4.3 创建圈子（3步极简）

```
步骤1: 选活动类型（大图标网格，一键）
步骤2: 填时间（默认"现在"）+ 准备时间（5/15/30分钟可选）+ 地点（自动定位，可手动微调）+ 人数（活动类型推荐默认值，可±2微调）
步骤3: 确认发布
```

- 不要求封面图、不要求长描述。标题自动生成："[昵称]发起的[活动类型]"
- 发布后如果选了准备时间，圈子状态显示"🏠 发起人准备中"，给发起人留换衣服出门的缓冲
- 拼单分类创建时强制填写"拼单规则"（如：到货后群内发AA收款码），发布后聊天室置顶该规则
- 可选限定标签："仅女性" / "仅新手" / "不限"

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
- 长按自己消息可撤回（2分钟内），撤回后显示"消息已撤回"，撤回记录快照保留供举报调证
- 圈子解散后输入框变灰："圈子已结束，无法发言"
- 拼单圈子聊天顶部置顶栏：显示拼单规则

### 4.6 消息Tab

- 我加入的圈子列表
- 最后一条消息预览 + 未读红点
- 已结束的圈子折叠到底部

### 4.7 我的页面（精简版）

- 头像/昵称/评分
- 数据统计：发起/参与/好评率/鸽子
- 入口：我的圈子、评价记录、设置

### 4.8 设置页

- 隐私设置：隐身模式开关、匿名加入默认开关
- 通知设置：圈子消息提醒
- 账号安全：绑定/更换手机号
- 关于：版本号、用户协议、隐私政策
- 注销账号

### 4.9 新手引导

3屏引导 → 获取位置权限 → 微信登录 → 兴趣标签选择 → 进入首页

### 4.10 心愿池（冷启动核心机制）

触发条件：
- 用户定位后，若3-10km范围内无任何进行中的同城圈子

交互替代：
- 不展示空白页，改为展示"为你发现X个心愿单"列表（按距离排序）
- 点击"+1"候补，后端记录

成局阈值（后台可配置）：

| 一级分类 | 二级示例 | 成局阈值 | 说明 |
|----------|----------|----------|------|
| 球类竞技 | 篮球 / 足球 | ≥ 6人 | 全场需要替补 |
| 球类竞技 | 羽毛球 / 网球 / 乒乓球 | ≥ 4人 | 双打配置 |
| 户外有氧 | 跑步 / 骑行 / 徒步 | ≥ 2人 | 两人即可成行 |
| 水上/健身 | 游泳 / 健身打卡 | ≥ 2人 | — |
| 休闲拼单 | 拼奶茶 / 拼外卖 / 拼车 | ≥ 3人 | — |
| 娱乐社交 | K歌 / 剧本杀 / 桌游 | ≥ 3人 | — |

自动创建逻辑：
- 阈值达成瞬间，系统以"首个心愿发起人"为创建者自动生成圈子
- 有效期：当前时间 + 2小时（强制即时局）
- 失败处理：创建后30分钟内无人真正点击"加入"落座，圈子自动失效解散，心愿单清空，相关用户收到"心愿未达成，继续等待"提示

### 4.11 活动类型与默认人数上限

`max_members` 不统一为100，改为动态默认值（用户创建时可手动微调±2人）：

| 一级分类 | 二级示例 | 默认上限 | 备注 |
|----------|----------|----------|------|
| 球类竞技 | 篮球 / 足球 | 10人 | 全场需要替补 |
| 球类竞技 | 羽毛球 / 网球 / 乒乓球 | 4人 | 双打配置 |
| 户外有氧 | 跑步 / 骑行 / 徒步 | 6人 | 小团队安全 |
| 水上/健身 | 游泳 / 健身打卡 | 4人 | 泳道/器械有限 |
| 休闲拼单 | 拼奶茶 / 拼外卖 / 拼车 | 6人 | 便于线下分单 |
| 娱乐社交 | K歌 / 剧本杀 / 桌游 | 8人 | 剧本杀标准配置 |

### 4.12 圈子全生命周期状态流转

```
创建(Active，准备时间倒计时)
  → 活动开始前（正常匹配）
  → 活动时间到达（开始签到）
  → 倒计时24h开始
  → 第18小时（结束前6h）：创建者收到系统弹窗"是否转为长期搭子群？"
      ├── 点击【是】→ 状态变为 private_permanent（私密永久）
      │   - 聊天记录永久保留
      │   - 不再出现在发现页（仅成员可见）
      │   - 成员可继续发言
      │   - v2可迁移为搭子关系
      ├── 点击【否】或【忽略】→ 满24h后自动执行 archived（只读归档）
      │   - 聊天记录保留备查
      │   - 不可发言
      │   - 仅管理员可查看
      └── 创建者连续2次未签到 → 圈内系统警告，降低成局率展示
```

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

- **"帮我组局"分享**：创建圈子后 Flutter 端 widget 截图生成分享图（含"已有X人加入"社会证明 + App下载码）→ 微信/朋友圈 → 跳App加入
- **活动卡片留念**：活动结束后 Flutter 端自动生成战绩卡片（类型/地点/日期/队友），用户自发截图分享
- **实时社交证明**：首页展示"附近有XX人在组局""今天已有XX个圈子成局"
- **邀请激励**：邀请新用户双方各获得信用档案优质标记（提升"新来城市型"用户的信任度）

---

## 七、技术架构

### 7.1 技术栈

| 层 | 选型 |
|----|------|
| App | Flutter + Riverpod（状态管理）+ flutter_secure_storage（Token存储）|
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
│ 反向代理  │  │ api      │  │ worker   │  │  React   │
│ SSL终止  │  │ :3000    │  │ (定时任务)│  │ 静态文件  │
│ :80→443  │  │          │  │          │  │          │
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
├── wishpool/      # 心愿池：候补+1、阈值检测、自动建圈
├── chat/          # WebSocket网关、消息收发、敏感词拦截、图片审核
├── payment/       # 支付接口（v1扩展点）
├── review/        # 评价（到场/否+标签）、举报、内容审核
├── upload/        # COS STS临时令牌签发
├── admin/         # 管理后台API（含心愿池阈值配置）
├── notification/  # 系统消息、推送预留
├── common/        # 守卫、拦截器、过滤器、DTO
└── schedule/      # 定时任务（worker角色执行）
```

### 7.4 数据库核心表

```sql
-- 用户
users (id, wechat_openid, phone, nickname, avatar, interests[], 
       role, is_anonymous, created_at, deleted_at)

-- 用户信用档案
user_profiles (user_id, showup_rate, showup_count, total_joined,
               recent_pigeon_count,       -- 近7天鸽子次数
               total_created, circle_completion_rate,
               new_user_badge boolean default true)

-- 活动分类
categories (id, name, icon, parent_id, sort, 
            default_max_members int,      -- 动态默认人数上限
            wish_threshold int)           -- 心愿池成局阈值

-- 心愿池
wish_items (id, user_id, category_id, location geography(Point, 0),
            range_km, created_at, status)
-- status: waiting | fulfilled | expired

-- 圈子 (PostGIS空间索引，存储GCJ-02坐标)
circles (
  id, creator_id, category_id, title, description, cover_image,
  location geography(Point, 0),        -- GCJ-02坐标系(SRID=0)，非WGS-84
  address text, range_km decimal(3,1) default 3,
  max_members int, start_time timestamp,
  prep_time int,                       -- 准备时间(分钟): 0/5/15/30
  start_type enum('now','today','tomorrow','custom'),
  status enum('active','preparing','dissolved','private_permanent','archived'),
  restrict_tag enum('all','female_only','newbie_only'),
  group_rule text,                     -- 拼单规则（拼单分类必填）
  dissolved_at timestamp, created_at
);
CREATE INDEX idx_circles_location ON circles USING GIST(location);
CREATE INDEX idx_circles_start_time ON circles(start_time);
CREATE INDEX idx_circles_status ON circles(status) WHERE status IN ('active','preparing');

-- 圈子成员
circle_members (
  circle_id, user_id, role, joined_at, last_read_at,
  checked_in boolean default false
)

-- 圈子消息
circle_messages (id, circle_id, user_id, type, content, image_url, 
                 is_recalled boolean default false, 
                 recall_snapshot jsonb,        -- 撤回时保留快照供举报调证
                 created_at)
-- type: text | image | system

-- 评价（简化为到场判定）
user_reviews (id, circle_id, reviewer_id, target_user_id, 
              showed_up boolean,              -- 到场？是/否
              tags text[],                    -- 可选标签: ['准时','迟到','鸽子']
              comment text)

-- 违规记录
violation_records (id, user_id, circle_id, msg_id, action, reason, 
                   reviewed_by, created_at)
-- action: warn | mute_Nh | kick | ban

-- 举报
reports (id, reporter_id, target_user_id, circle_id, reason, 
         images[], status, handled_by)

-- 敏感词库
sensitive_words (id, word, level, created_by, created_at)
-- level: 1(拦截) | 2(需审核)

-- 支付（v1扩展点）
payments (id, user_id, type, amount, channel, transaction_id, status)
```

### 7.5 API 设计（v1）

```
# 认证
POST  /api/v1/auth/wechat-login
POST  /api/v1/auth/bind-phone
GET   /api/v1/auth/me
DELETE /api/v1/auth/me              # 注销账号

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
POST   /api/v1/circles/:id/join     # body: { anonymous?: boolean }
POST   /api/v1/circles/:id/leave
GET    /api/v1/circles/:id/members
GET    /api/v1/circles/:id/messages # 历史消息 ?before=&limit=50
DELETE /api/v1/circles/:id/messages/:msg_id  # 撤回消息（2分钟内）
POST   /api/v1/circles/:id/checkin  # 签到
POST   /api/v1/circles/:id/expand   # 扩大搜索范围
POST   /api/v1/circles/:id/convert  # 转为永久搭子群（仅创建者）

# 心愿池
GET    /api/v1/wishes               # 附近心愿单列表（lat,lng,range,category）
POST   /api/v1/wishes               # 发布候补 +1（body: { category_id }）
DELETE /api/v1/wishes/:id           # 取消候补

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
  { event: 'send_msg', data: { circle_id, type: 'text'|'image', content, image_url?, 
                               client_id } }
                                -- client_id用于ack去重
  { event: 'recall_msg', data: { circle_id, msg_id } }

服务端 → 客户端:
  { event: 'new_msg', data: { id, circle_id, user, type, content, image_url, created_at } }
  { event: 'msg_ack', data: { client_id, msg_id } }         -- 消息送达确认
  { event: 'msg_recalled', data: { circle_id, msg_id } }    -- 消息被撤回
  { event: 'system',  data: { circle_id, action, user?, timestamp } }
  { event: 'error',   data: { code, message } }
  { event: 'muted',   data: { circle_id, until, reason } }

心跳: 服务端30s无消息断开，客户端每25s发ping
重连: 指数退避(1s→2s→4s→30s max)，重连后自动Re-Join所有圈子Room
离线补拉: 统一走WebSocket（客户端连接后发送 pull_offline_msg 事件），避免HTTP和WS两套维护
```

### 7.7 WebSocket 消息可靠性

- **ACK机制**: 客户端发消息带 client_id，服务端落库后回 msg_ack（含 server msg_id），客户端收到ACK才从"发送中"转为"已发送"
- **离线消息**: 用户不在线时消息照样落库，下次在线通过 HTTP API 补拉历史
- **撤回**: 2分钟内可撤回，服务端标记 is_recalled=true + 保留 recall_snapshot快照（供举报调证），广播 msg_recalled 事件
- **发送中状态**: 客户端先乐观展示"发送中"，收到ACK后确认，5秒未收到ACK则重试

### 7.8 关键架构决策

| 决策 | 说明 |
|------|------|
| 坐标系 | 统一使用GCJ-02（火星坐标），PostGIS SRID=0。高德SDK返回GCJ-02，无需转换，避免误差 |
| api + worker 双实例 | 同一份NestJS代码，环境变量区分角色。api处理HTTP/WS，worker只跑定时任务 |
| Worker 分布式锁 | Redis 锁防止多 worker 实例重复执行定时任务（`@nestjs/schedule` + Redis）|
| 圈子排序 | Redis ZSET 维护"即将开始圈子"按 start_time 排序，避免每次SQL计算时间差 |
| COS STS临时令牌 | 客户端不持有COS密钥，后端签发STS，直传 |
| PostGIS查询缓存 | Redis缓存地理位置查询（按网格分桶），TTL 30s |
| 图片内容安全 | 腾讯云图片审核API（鉴黄/涉政），发图消息必经审核，命中则拦截 |
| Rate Limiting | 建圈5次/天、发消息1条/秒、举报10次/天、心愿候补5次/天 |
| Token 存储 | Flutter 端使用 flutter_secure_storage 加密存储 JWT |
| 离线消息 | 统一走 WebSocket（pull_offline_msg 事件），不混用HTTP，架构更纯粹 |
| 连接池 | TypeORM max 20连接 |
| 文件上传限制 | 图片 max 10MB，仅允许 jpg/png/gif/webp，Nginx + NestJS 双重限制 |
| PgBouncer | 暂不需要，v2评估 |
| 读写分离 | 暂不需要，v2评估 |

### 7.9 CI/CD 策略

| 环节 | 方案 |
|------|------|
| 代码仓库 | GitHub / Gitee |
| CI | GitHub Actions：每次PR跑 lint + test + build |
| CD | 手动触发：SSH到CVM → git pull → docker compose up -d --build |
| 分支策略 | `main` 保护分支，功能在 feature 分支开发，PR合并 |
| 环境变量 | `.env` 文件不提交，CVM上手动管理，模板文件 `.env.example` 提交 |

### 7.10 测试策略

| 层 | 最低要求 | 框架 |
|----|----------|------|
| NestJS 单元测试 | 核心业务逻辑覆盖率 > 60% | Jest（内置）|
| NestJS 集成测试 | Auth、Circle、Chat 模块各至少 2 条集成用例 | Supertest |
| Flutter Widget测试 | 关键页面（首页/聊天/创建圈子）各1条 | Flutter Test |
| 契约测试 | 暂不要求，v2评估 | — |
| E2E | 暂不要求，v2评估 | — |

---

## 八、安全与非功能需求

### 8.1 安全

- JWT Token 有效期: access 2h / refresh 7d，存储在 flutter_secure_storage
- 敏感词库拦截发消息（sensitive_words表，管理后台可维护）
- 腾讯云图片内容安全审核（鉴黄/涉政/暴恐），发图必经审核，命中即拦截
- 位置隐私：对外模糊距离，加入后才展示具体地点
- 可选隐身模式：可关闭"被发现"
- 匿名仅前端展示层：创建者和平台后端仍可见完整用户信息，满足安全合规
- 举报需提供理由 + 可选截图，恶意举报者反向处罚
- 账号注销：`DELETE /api/v1/auth/me`，软删除，30天后物理清除
- 图片上传限制：max 10MB，仅允许 jpg/png/gif/webp
- Nginx `client_max_body_size 10m` + NestJS multer 双重校验
- 微信 OpenID 不对外暴露，后端映射为内部 user_id
- 撤回消息保留快照（recall_snapshot），供举报调证

### 8.2 性能

- 附近圈子查询 < 200ms（PostGIS索引 + Redis缓存）
- 即将开始圈子排序 Redis ZSET 直接返回，避免每次SQL计算
- WebSocket消息送达 < 100ms
- 图片上传 COS 直传，不经过服务器
- 图片审核异步处理（发图→快速返回→后台审核→审核不通过则撤回+通知）

### 8.3 可靠性

- Docker Compose `restart: always`
- Nginx SSL 终止（Let's Encrypt 免费证书，certbot 自动续期）
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
| 2026-06-22a | 架构审查修订：坐标系修正、消息可靠性、未读计数、敏感词库、分布式锁、Token安全、CI/CD、测试策略、账号注销、匿名模式 |
| 2026-06-22b | 多模型融合修订：心愿池机制、动态人数上限、长期搭子群、三级时间标签、简化评价体系、准备时间、限定圈子、图片安全审核、Redis ZSET排序、离线补拉统一WS、撤回缩短至2分钟、上滑加入、拼单规则 |
