const { Client } = require('pg');
const client = new Client({
  host: '192.168.5.116',
  port: 5866,
  user: 'dev_ai_01',
  password: 'dev_ai_01',
  database: 'dev_ai_01',
});

async function main() {
  await client.connect();

  // Create users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid NOT NULL PRIMARY KEY,
      wechat_openid character varying NOT NULL UNIQUE,
      phone character varying UNIQUE,
      nickname character varying(50) NOT NULL,
      avatar character varying,
      interests text array NOT NULL DEFAULT '{}',
      role character varying NOT NULL DEFAULT 'user',
      muted_until TIMESTAMP WITH TIME ZONE,
      is_incognito boolean NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      deleted_at TIMESTAMP
    )
  `);
  console.log('users table ready');

  // Insert test user (idempotent)
  const result = await client.query(`
    INSERT INTO users (id, wechat_openid, nickname)
    VALUES ('00000000-0000-0000-0000-000000000001', 'dev_test_openid', 'TestUser')
    ON CONFLICT (id) DO NOTHING
    RETURNING id, nickname
  `);
  console.log('Test user:', JSON.stringify(result.rows[0]));

  // Also create user_profiles table (needed for /auth/me)
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id uuid NOT NULL PRIMARY KEY,
      showup_rate numeric(5,2) NOT NULL DEFAULT '0',
      showup_count integer NOT NULL DEFAULT '0',
      total_joined integer NOT NULL DEFAULT '0',
      recent_pigeon_count integer NOT NULL DEFAULT '0',
      total_created integer NOT NULL DEFAULT '0',
      circle_completion_rate numeric(5,2) NOT NULL DEFAULT '0',
      new_user_badge boolean NOT NULL DEFAULT true,
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  console.log('user_profiles table ready');

  await client.end();
  console.log('Done');
}

main().catch(e => { console.error(e.message); process.exit(1); });
