import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const rawDbUrl = process.env.DATABASE_URL;
if (!rawDbUrl) {
  console.error('[Check Dev User] DATABASE_URL is not set. Set it in server/.env (see server/.env.example).');
  process.exit(1);
}
const connectionString: string = rawDbUrl;

async function checkUser() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query(`SELECT id, email, full_name, role, created_at FROM users WHERE email = 'developer@schoolerp.com'`);
    console.log('[PostgreSQL Verification] Database Connection:', connectionString.split('@')[1]);
    console.log('[PostgreSQL Verification] Found Developer Rows in DB:', res.rows);
  } catch (err: any) {
    console.error('[PostgreSQL Error]', err.message);
  } finally {
    await client.end();
  }
}

checkUser();
