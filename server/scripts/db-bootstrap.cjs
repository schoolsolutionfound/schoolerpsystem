const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const baselinePath = path.join(__dirname, '..', 'drizzle', '0000_full_schema.sql');
const EXPECTED_TABLES = 68;
const EXPECTED_FKS = 81;
const EXPECTED_UNIQUE_INDEXES = 60;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Baseline migration not found at ${baselinePath}`);
  }

  const sql = fs.readFileSync(baselinePath, 'utf8');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    application_name: 'school-erp-bootstrap',
  });

  await client.connect();
  let inTransaction = false;
  try {
    const existing = await client.query(`
      select count(*)::int as n
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
        and table_name <> 'drizzle_migrations'
    `);
    const existingTables = existing.rows[0].n;

    if (existingTables > 0) {
      throw new Error(
        `Refusing to bootstrap: public schema already has ${existingTables} tables. ` +
          'This command only runs against an empty database.'
      );
    }

    await client.query('BEGIN');
    inTransaction = true;
    await client.query(`SET LOCAL statement_timeout = '180s'`);
    await client.query(sql);

    const tables = await client.query(`
      select count(*)::int as n
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
        and table_name <> 'drizzle_migrations'
    `);
    const fks = await client.query(`
      select count(*)::int as n
      from pg_constraint c
      join pg_namespace n on n.oid = c.connamespace
      where c.contype = 'f'
        and n.nspname = 'public'
    `);
    const uniqueIndexes = await client.query(`
      select count(*)::int as n
      from pg_index i
      join pg_class c on c.oid = i.indexrelid
      join pg_namespace n on n.oid = c.relnamespace
      left join pg_constraint con
        on con.conindid = i.indexrelid
       and con.contype in ('p', 'u')
      where n.nspname = 'public'
        and i.indisunique
        and con.oid is null
    `);

    const tableCount = tables.rows[0].n;
    const fkCount = fks.rows[0].n;
    const uniqueIndexCount = uniqueIndexes.rows[0].n;

    if (
      tableCount !== EXPECTED_TABLES ||
      fkCount !== EXPECTED_FKS ||
      uniqueIndexCount !== EXPECTED_UNIQUE_INDEXES
    ) {
      throw new Error(
        `Baseline verification failed: tables=${tableCount}/${EXPECTED_TABLES}, ` +
          `fks=${fkCount}/${EXPECTED_FKS}, uniqueIndexes=${uniqueIndexCount}/${EXPECTED_UNIQUE_INDEXES}`
      );
    }

    await client.query('COMMIT');
    inTransaction = false;
    console.log(
      `[db:bootstrap] Created ${tableCount} tables, ${uniqueIndexCount} standalone unique indexes, and ${fkCount} foreign keys.`
    );
  } catch (error) {
    if (inTransaction) {
      await client.query('ROLLBACK').catch(() => {});
    }
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`[db:bootstrap] ${error.message}`);
  process.exit(1);
});
