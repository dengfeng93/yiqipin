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
