// Throwaway script to create/update a DB user with a Spring-compatible BCrypt hash.
// Usage: node create-user.mjs
import bcrypt from 'bcryptjs';
import pg from 'pg';

const EMAIL      = 'rahul.bhagat@its.bajajlife.com';
const PASSWORD   = 'Bajaj@2175';
const USERNAME   = 'rahul.bhagat';
const FULL_NAME  = 'Rahul Bhagat';
const ROLE       = 'ADMIN'; // ADMIN | MANAGER | SME | TESTER | VIEWER
const TEAM       = 'Platform';
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

// Spring BCryptPasswordEncoder uses strength 12 and $2a$ hashes.
const passwordHash = bcrypt.hashSync(PASSWORD, 12);

const { Client } = pg;
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5433),
  database: process.env.DB_NAME || 'tmt_new_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root@123',
});

const upsertSql = `
  INSERT INTO users
    (id, tenant_id, username, email, password_hash, full_name, role, team, active, created_at, updated_at)
  VALUES
    (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, now(), now())
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    username      = EXCLUDED.username,
    full_name     = EXCLUDED.full_name,
    role          = EXCLUDED.role,
    team          = EXCLUDED.team,
    active        = true,
    updated_at    = now()
  RETURNING id, email, role, tenant_id, active;
`;

// Fallback if there is no unique constraint on email (no ON CONFLICT target).
const existsSql = `SELECT id FROM users WHERE email = $1 LIMIT 1;`;
const insertSql = `
  INSERT INTO users
    (id, tenant_id, username, email, password_hash, full_name, role, team, active, created_at, updated_at)
  VALUES
    (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, now(), now())
  RETURNING id, email, role, tenant_id, active;
`;
const updateSql = `
  UPDATE users SET
    password_hash = $4,
    username      = $2,
    full_name     = $5,
    role          = $6,
    team          = $7,
    active        = true,
    tenant_id     = COALESCE(tenant_id, $1),
    updated_at    = now()
  WHERE email = $3
  RETURNING id, email, role, tenant_id, active;
`;

const params = [DEFAULT_TENANT_ID, USERNAME, EMAIL, passwordHash, FULL_NAME, ROLE, TEAM];

try {
  await client.connect();
  console.log('Connected to DB. BCrypt hash:', passwordHash);

  let result;
  try {
    result = await client.query(upsertSql, params);
  } catch (e) {
    // 42P10 = there is no unique/exclusion constraint matching ON CONFLICT
    if (e.code === '42P10') {
      const found = await client.query(existsSql, [EMAIL]);
      result = found.rowCount > 0
        ? await client.query(updateSql, params)
        : await client.query(insertSql, params);
    } else {
      throw e;
    }
  }

  console.log('✅ User saved:', result.rows[0]);
} catch (err) {
  console.error('❌ Failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
