// Idempotent bootstrap for the audit log + user-table indexes
// (matches src/modules/shared/db/schema.ts). Run with: npx tsx src/scripts/bootstrapAuditEvents.ts
// or: node scripts/bootstrap-audit-events.mjs (plain pg, no TS needed)

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
  `CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type VARCHAR(50) NOT NULL DEFAULT 'platform',
    target_id TEXT,
    target_label TEXT,
    details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events (created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_users_institution_role ON users (institution_code, role)`,
  `CREATE INDEX IF NOT EXISTS idx_users_admin_role ON users (role) WHERE role = 'admin'`,
];

async function main() {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    for (const sql of statements) {
      await client.query(sql);
      console.log('[Bootstrap] applied:', sql.split('\n')[0].trim());
    }
    console.log('[Bootstrap] Done. audit_events + users indexes are in place.');
  } finally {
    await client.end();
  }
}

main();
