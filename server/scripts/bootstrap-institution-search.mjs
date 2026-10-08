// Idempotent bootstrap for trigram-backed institution search
// (ILIKE %term% on institution_name / institution_code in institution.repository.ts).
// Run from server/ with: node scripts/bootstrap-institution-search.mjs (plain pg, no TS needed)
//
// pg_trgm GIN indexes let Postgres satisfy `ILIKE '%term%'` with a bitmap index
// scan instead of a sequential scan, which matters once institutions reach
// high six/six-figures rows.

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
  `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  `CREATE INDEX IF NOT EXISTS idx_institutions_name_trgm ON institutions USING gin (institution_name gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS idx_institutions_code_trgm ON institutions USING gin (institution_code gin_trgm_ops)`,
];

async function main() {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    for (const sql of statements) {
      await client.query(sql);
      console.log('[Bootstrap] applied:', sql);
    }
    console.log('[Bootstrap] Done. Institution search (ILIKE %term%) is trigram-index-backed.');
  } finally {
    await client.end();
  }
}

main();
