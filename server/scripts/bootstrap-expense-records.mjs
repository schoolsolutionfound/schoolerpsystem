// Idempotent bootstrap for the expense_records table
// (matches src/modules/shared/db/schema.ts -> expenseRecords). Run with:
// node scripts/bootstrap-expense-records.mjs  (plain pg, no TS needed)

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
  `CREATE TABLE IF NOT EXISTS expense_records (
    id TEXT PRIMARY KEY,
    institution_code VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    payee_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100),
    designation VARCHAR(100),
    department VARCHAR(100),
    vehicle_no VARCHAR(50),
    amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'bank_transfer',
    payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'paid',
    invoice_no VARCHAR(50),
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_expense_records_inst ON expense_records (institution_code)`,
  `CREATE INDEX IF NOT EXISTS idx_expense_records_category ON expense_records (category)`,
  `CREATE INDEX IF NOT EXISTS idx_expense_records_status ON expense_records (status)`,
];

async function main() {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    for (const sql of statements) {
      await client.query(sql);
      console.log('[Bootstrap] applied:', sql.split('\n')[0].trim());
    }
    console.log('[Bootstrap] Done. expense_records table + indexes are in place.');
  } finally {
    await client.end();
  }
}

main();
