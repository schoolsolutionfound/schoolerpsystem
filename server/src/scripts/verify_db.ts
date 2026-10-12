import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/schoolerp';

async function check() {
  const client = new Client({ connectionString: url });
  await client.connect();

  console.log('--- DB VERIFICATION REPORT ---');
  
  // 1. Tables check
  const resTables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  const tableNames = resTables.rows.map((t: any) => t.table_name);
  console.log('ALL TABLES IN DB:', tableNames);

  const libraryTables = [
    'library_categories',
    'library_authors',
    'library_books',
    'library_book_copies',
    'library_loans',
    'library_reservations',
    'library_fines',
    'library_payment_transactions',
    'library_question_papers',
    'library_settings'
  ];

  console.log('\n--- LIBRARY TABLES & COLUMNS ---');
  for (const tableName of libraryTables) {
    const exists = tableNames.includes(tableName);
    console.log(`\nTable ${tableName}: ${exists ? 'EXISTS' : 'MISSING'}`);
    if (exists) {
      const resCols = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);
      for (const col of resCols.rows) {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
      }
    }
  }

  console.log('\n--- INDEXES & CONSTRAINTS ---');
  const resIdx = await client.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename LIKE 'library_%'
    ORDER BY tablename, indexname;
  `);
  for (const idx of resIdx.rows) {
    console.log(`[${idx.tablename}] ${idx.indexname}: ${idx.indexdef}`);
  }

  await client.end();
}

check().catch((err) => {
  console.error('Error during DB verification:', err);
  process.exit(1);
});
