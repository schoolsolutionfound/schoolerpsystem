// Idempotent bootstrap for sections + class_subjects columns on institutions
// Run from server/ with: node scripts/bootstrap-sections-class-subjects.mjs

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const rawDbUrl = process.env.DATABASE_URL;
if (!rawDbUrl) {
  console.error('[Bootstrap] DATABASE_URL is not set. Set it in server/.env.');
  process.exit(1);
}

const statements = [
  `ALTER TABLE institutions ADD COLUMN IF NOT EXISTS sections jsonb DEFAULT '[]'::jsonb`,
  `ALTER TABLE institutions ADD COLUMN IF NOT EXISTS class_subjects jsonb DEFAULT '{}'::jsonb`,
];

async function main() {
  const client = new pg.Client({ connectionString: rawDbUrl });
  await client.connect();
  try {
    for (const sql of statements) {
      await client.query(sql);
      console.log('[Bootstrap] applied:', sql);
    }
    console.log('[Bootstrap] Done. sections + class_subjects columns are available on institutions.');
  } finally {
    await client.end();
  }
}

main();
