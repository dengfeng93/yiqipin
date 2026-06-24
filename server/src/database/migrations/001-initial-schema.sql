CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wechat_openid VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  nickname VARCHAR(50) NOT NULL,
  avatar TEXT,
  interests TEXT[] DEFAULT '{}',
  role VARCHAR(20) DEFAULT 'user',
  muted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_users_wechat_openid ON users(wechat_openid);

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  showup_rate DECIMAL(5,2) DEFAULT 0,
  showup_count INT DEFAULT 0,
  total_joined INT DEFAULT 0,
  recent_pigeon_count INT DEFAULT 0,
  total_created INT DEFAULT 0,
  circle_completion_rate DECIMAL(5,2) DEFAULT 0,
  new_user_badge BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  icon VARCHAR(10) NOT NULL DEFAULT '📌',
  parent_id UUID REFERENCES categories(id),
  sort INT DEFAULT 0,
  default_max_members INT DEFAULT 10,
  wish_threshold INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, icon, parent_id, sort, default_max_members, wish_threshold) VALUES
  ('篮球', '🏀', NULL, 1, 10, 6),
  ('足球', '⚽', NULL, 2, 10, 6),
  ('羽毛球', '🏸', NULL, 3, 4, 4),
  ('网球', '🎾', NULL, 4, 4, 4),
  ('乒乓球', '🏓', NULL, 5, 4, 4),
  ('跑步', '🏃', NULL, 6, 6, 2),
  ('骑行', '🚴', NULL, 7, 6, 2),
  ('徒步', '🥾', NULL, 8, 6, 2),
  ('游泳', '🏊', NULL, 9, 4, 2),
  ('健身打卡', '💪', NULL, 10, 4, 2),
  ('拼奶茶', '🧋', NULL, 11, 6, 3),
  ('拼外卖', '🍱', NULL, 12, 6, 3),
  ('拼车', '🚗', NULL, 13, 6, 3),
  ('K歌', '🎤', NULL, 14, 8, 3),
  ('剧本杀', '🎭', NULL, 15, 8, 3),
  ('桌游', '🎲', NULL, 16, 8, 3);

-- ============================================================
-- 敏感词库
-- ============================================================
CREATE TABLE sensitive_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word VARCHAR(100) NOT NULL,
  level SMALLINT DEFAULT 1 CHECK (level IN (1, 2)),
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sensitive_words_word ON sensitive_words(word);

INSERT INTO sensitive_words (word, level) VALUES
  ('代办', 2), ('证件', 2), ('贷款', 2),
  ('假证', 1), ('发票', 2), ('套现', 1),
  ('赌博', 1), ('色情', 1), ('涉黄', 1);

-- ============================================================
-- 违规记录表
-- ============================================================
CREATE TABLE violation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  circle_id UUID,
  msg_id UUID,
  action VARCHAR(20) NOT NULL CHECK (action IN ('warn','mute_1h','mute_6h','mute_24h','kick','ban')),
  reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_violation_records_user ON violation_records(user_id);

-- ============================================================
-- 支付表（v1 预留）
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX idx_payments_user ON payments(user_id);

-- ============================================================
-- 圈子表
-- ============================================================
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id),
  category_id UUID REFERENCES categories(id),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  address VARCHAR(200),
  location GEOGRAPHY(Point, 0) NOT NULL,
  max_members INT DEFAULT 10,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  start_type VARCHAR(10) DEFAULT 'now',
  prep_time INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'preparing' CHECK (status IN ('preparing','active','archived','dissolved','private_permanent')),
  restrict_tag VARCHAR(20) DEFAULT 'all',
  group_rule TEXT,
  cover_image VARCHAR(500),
  range_km DECIMAL(3,1) DEFAULT 3,
  dissolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_circles_status ON circles(status);
CREATE INDEX idx_circles_location ON circles USING GIST(location);
CREATE INDEX idx_circles_category ON circles(category_id);
CREATE INDEX idx_circles_creator ON circles(creator_id);

-- ============================================================
-- 圈子成员表
-- ============================================================
CREATE TABLE circle_members (
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(10) DEFAULT 'member' CHECK (role IN ('creator','member','guest')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_anonymous BOOLEAN DEFAULT false,
  checked_in BOOLEAN DEFAULT false,
  PRIMARY KEY (circle_id, user_id)
);
CREATE INDEX idx_circle_members_user ON circle_members(user_id);

-- ============================================================
-- 圈子消息表
-- ============================================================
CREATE TABLE circle_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (type IN ('text','image','system')),
  content TEXT,
  image_url TEXT,
  is_recalled BOOLEAN DEFAULT FALSE,
  recall_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_circle_messages_circle ON circle_messages(circle_id, created_at DESC);
CREATE INDEX idx_circle_messages_user ON circle_messages(user_id);

-- ============================================================
-- 心愿池表
-- ============================================================
CREATE TABLE wish_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  category_id UUID REFERENCES categories(id),
  user_id UUID NOT NULL REFERENCES users(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point, 0) NOT NULL,
  max_members INT DEFAULT 10,
  wish_count INT DEFAULT 1,
  threshold INT DEFAULT 3,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting','fulfilled','expired','converted')),
  converted_circle_id UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_wish_items_status ON wish_items(status);
CREATE INDEX idx_wish_items_location ON wish_items USING GIST(location);
CREATE INDEX idx_wish_items_user ON wish_items(user_id);
CREATE INDEX idx_wish_items_category ON wish_items(category_id);

-- ============================================================
-- 用户评价表
-- ============================================================
CREATE TABLE user_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID NOT NULL REFERENCES users(id),
  circle_id UUID REFERENCES circles(id),
  showed_up BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[],
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_reviews_target_user ON user_reviews(target_user_id);
CREATE INDEX idx_user_reviews_reviewer ON user_reviews(reviewer_id);
CREATE INDEX idx_user_reviews_circle ON user_reviews(circle_id);

-- ============================================================
-- 举报表
-- ============================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  circle_id UUID REFERENCES circles(id),
  type VARCHAR(30) NOT NULL,
  reason TEXT NOT NULL,
  detail TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','dismissed','reviewed')),
  handled_by UUID,
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_target_user ON reports(target_user_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_incognito BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_time ON notifications(user_id, created_at DESC);
