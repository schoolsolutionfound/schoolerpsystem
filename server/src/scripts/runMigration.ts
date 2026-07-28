import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/schoolerp';

async function migrate() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    console.log('[Migration Script] Connected to PostgreSQL...');

    await client.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "title" text DEFAULT '';
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "scope" text DEFAULT '{}';
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" text DEFAULT '[]';
    `);

    console.log('[Migration Script] Migration executed successfully! Columns added to users table.');
  } catch (err: any) {
    console.warn('[Migration Script Warning]', err.message);
  } finally {
    await client.end();
  }
}

migrate();
