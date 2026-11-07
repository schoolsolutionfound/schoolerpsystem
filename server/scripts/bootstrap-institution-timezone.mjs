// Idempotent bootstrap for the institutions.timezone column.
// Run from server/ with: node scripts/bootstrap-institution-timezone.mjs

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const rawDbUrl = process.env.DATABASE_URL;
if (!rawDbUrl) {
  console.error('[Bootstrap] DATABASE_URL is not set. Set it in server/.env (see server/.env.example).');
  process.exit(1);
}

const statements = [
  `ALTER TABLE institutions ADD COLUMN IF NOT EXISTS timezone varchar(64) NOT NULL DEFAULT 'Asia/Kolkata'`,
];

async function main() {
  const client = new pg.Client({ connectionString: rawDbUrl });
  await client.connect();
  try {
    for (const sql of statements) {
      await client.query(sql);
      console.log('[Bootstrap] applied:', sql);
    }
    console.log('[Bootstrap] Done. institutions.timezone is available.');
  } finally {
    await client.end();
  }
}

main();
