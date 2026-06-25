-- ============================================================
-- v1 缺失表创建脚本（无需 PostGIS / uuid-ossp）
-- PostgreSQL 10.6 兼容
-- UUID 由应用层 randomUUID() 生成
-- ============================================================

-- 活动分类表
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  icon VARCHAR(10) NOT NULL DEFAULT '📌',
  parent_id UUID,
  sort INT DEFAULT 0,
  default_max_members INT DEFAULT 10,
  wish_threshold INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (id, name, icon, parent_id, sort, default_max_members, wish_threshold) VALUES
  ('10000000-0000-0000-0000-000000000001', '篮球', '🏀', NULL, 1, 10, 6),
  ('10000000-0000-0000-0000-000000000002', '足球', '⚽', NULL, 2, 10, 6),
  ('10000000-0000-0000-0000-000000000003', '羽毛球', '🏸', NULL, 3, 4, 4),
  ('10000000-0000-0000-0000-000000000004', '网球', '🎾', NULL, 4, 4, 4),
  ('10000000-0000-0000-0000-000000000005', '乒乓球', '🏓', NULL, 5, 4, 4),
  ('10000000-0000-0000-0000-000000000006', '跑步', '🏃', NULL, 6, 6, 2),
  ('10000000-0000-0000-0000-000000000007', '骑行', '🚴', NULL, 7, 6, 2),
  ('10000000-0000-0000-0000-000000000008', '徒步', '🥾', NULL, 8, 6, 2),
  ('10000000-0000-0000-0000-000000000009', '游泳', '🏊', NULL, 9, 4, 2),
  ('10000000-0000-0000-0000-000000000010', '健身打卡', '💪', NULL, 10, 4, 2),
  ('10000000-0000-0000-0000-000000000011', '拼奶茶', '🧋', NULL, 11, 6, 3),
  ('10000000-0000-0000-0000-000000000012', '拼外卖', '🍱', NULL, 12, 6, 3),
  ('10000000-0000-0000-0000-000000000013', '拼车', '🚗', NULL, 13, 6, 3),
  ('10000000-0000-0000-0000-000000000014', 'K歌', '🎤', NULL, 14, 8, 3),
  ('10000000-0000-0000-0000-000000000015', '剧本杀', '🎭', NULL, 15, 8, 3),
  ('10000000-0000-0000-0000-000000000016', '桌游', '🎲', NULL, 16, 8, 3)
ON CONFLICT DO NOTHING;

-- 圈子表（location 使用 text 替代 PostGIS geography）
CREATE TABLE IF NOT EXISTS circles (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES users(id),
  category_id UUID REFERENCES categories(id),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  address VARCHAR(200),
  location TEXT NOT NULL,
  max_members INT DEFAULT 10,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  start_type VARCHAR(10) DEFAULT 'now',
  prep_time INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'preparing',
  restrict_tag VARCHAR(20) DEFAULT 'all',
  group_rule TEXT,
  cover_image VARCHAR(500),
  range_km DECIMAL(3,1) DEFAULT 3,
  dissolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_circles_status ON circles(status);
CREATE INDEX IF NOT EXISTS idx_circles_category ON circles(category_id);
CREATE INDEX IF NOT EXISTS idx_circles_creator ON circles(creator_id);

-- 圈子成员表
CREATE TABLE IF NOT EXISTS circle_members (
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(10) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_anonymous BOOLEAN DEFAULT false,
  checked_in BOOLEAN DEFAULT false,
  PRIMARY KEY (circle_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_circle_members_user ON circle_members(user_id);

-- 圈子消息表
CREATE TABLE IF NOT EXISTS circle_messages (
  id UUID PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(10) NOT NULL DEFAULT 'text',
  content TEXT,
  image_url TEXT,
  is_recalled BOOLEAN DEFAULT FALSE,
  recall_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_circle_messages_circle ON circle_messages(circle_id, created_at DESC);

-- 心愿池表（location 使用 text 替代 PostGIS geography）
CREATE TABLE IF NOT EXISTS wish_items (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  category_id UUID REFERENCES categories(id),
  title VARCHAR(200) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location TEXT NOT NULL,
  max_members INT DEFAULT 10,
  wish_count INT DEFAULT 1,
  threshold INT DEFAULT 3,
  converted_circle_id UUID,
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wish_items_status ON wish_items(status);
CREATE INDEX IF NOT EXISTS idx_wish_items_user ON wish_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wish_items_category ON wish_items(category_id);

-- 用户评价表
CREATE TABLE IF NOT EXISTS user_reviews (
  id UUID PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID NOT NULL REFERENCES users(id),
  circle_id UUID REFERENCES circles(id),
  showed_up BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[],
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_reviews_target_user ON user_reviews(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_reviewer ON user_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_circle ON user_reviews(circle_id);

-- 举报表
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  circle_id UUID REFERENCES circles(id),
  type VARCHAR(30) NOT NULL,
  reason TEXT NOT NULL,
  detail TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  handled_by UUID,
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_target_user ON reports(target_user_id);

-- 违规记录表
CREATE TABLE IF NOT EXISTS violation_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  circle_id UUID,
  msg_id UUID,
  action VARCHAR(20) NOT NULL,
  reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_violation_records_user ON violation_records(user_id);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_time ON notifications(user_id, created_at DESC);

-- 支付表
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  channel VARCHAR(20) DEFAULT 'wechat',
  transaction_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
