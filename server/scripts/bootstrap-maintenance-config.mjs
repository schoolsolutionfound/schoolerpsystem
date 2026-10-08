// Idempotent bootstrap for maintenance mode columns on institutions
// Run from server/ with: node scripts/bootstrap-maintenance-config.mjs (plain pg, no TS needed)

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const rawDbUrl = process.env.DATABASE_URL;
if (!rawDbUrl) {
  console.error('[Bootstrap] DATABASE_URL is not set. Set it in server/.env (see server/.env.example).');
  process.exit(1);
}
const connectionString = rawDbUrl;

const statements = [
  `ALTER TABLE institutions ADD COLUMN IF NOT EXISTS maintenance_enabled boolean NOT NULL DEFAULT false`,
  `ALTER TABLE institutions ADD COLUMN IF NOT EXISTS maintenance_min_version varchar(50) NOT NULL DEFAULT '0.0.0'`,
];

async function main() {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    for (const sql of statements) {
      await client.query(sql);
      console.log('[Bootstrap] applied:', sql);
    }
    console.log('[Bootstrap] Done. Maintenance mode columns are available on institutions.');
  } finally {
    await client.end();
  }
}

main();
