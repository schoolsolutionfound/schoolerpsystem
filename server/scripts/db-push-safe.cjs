const path = require('path');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const requiredIndexes = [
  'uq_admission_courses_inst_id',
  'uq_attendance_records_inst_id',
  'uq_bus_routes_inst_id',
  'uq_bus_stops_inst_id',
  'uq_bus_vehicles_inst_id',
  'uq_class_sections_inst_id',
  'uq_exam_subjects_inst_id',
  'uq_exams_inst_id',
  'uq_fee_structures_inst_id',
  'uq_lib_books_inst_id',
  'uq_lib_categories_inst_id',
  'uq_lib_copies_inst_id',
  'uq_lib_fines_inst_id',
  'uq_lib_loans_inst_id',
  'uq_payment_orders_inst_id',
  'uq_periods_inst_id',
  'uq_placement_drives_inst_id',
  'uq_subjects_inst_id',
  'uq_timetable_slots_inst_id',
  'uq_timetables_inst_id',
  'uq_users_inst_id',
  'uq_users_inst_uid',
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const versionResult = await client.query(`select current_setting('server_version_num')::int as version`);
    const version = versionResult.rows[0].version;
    const major = Math.floor(version / 10000);

    if (major < 18) {
      await client.end();
      const args = ['drizzle-kit', 'push', ...process.argv.slice(2)];
      const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
      });
      process.exit(result.status === null ? 1 : result.status);
    }

    const tableResult = await client.query(`
      select count(*)::int as n
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
        and table_name <> 'drizzle_migrations'
    `);
    const tableCount = tableResult.rows[0].n;

    if (tableCount === 0) {
      console.error(
        '[db:push] Empty PostgreSQL database detected. Run `npm run db:bootstrap` to create the baseline schema, then re-run db:push.'
      );
      process.exit(1);
    }

    const fkResult = await client.query(`select count(*)::int as n from pg_constraint where contype = 'f'`);
    const indexResult = await client.query(
      `select indexname from pg_indexes where schemaname = 'public' and indexname = any($1::text[])`,
      [requiredIndexes]
    );
    const found = new Set(indexResult.rows.map((row) => row.indexname));
    const missing = requiredIndexes.filter((name) => !found.has(name));
    const fkCount = fkResult.rows[0].n;

    if (fkCount < 81 || missing.length > 0) {
      console.error(
        `[db:push] PostgreSQL ${major} schema is incomplete (fkCount=${fkCount}, missingIndexes=${missing.join(',') || 'none'}). ` +
          'drizzle-kit 0.30 is not PostgreSQL 18 compatible; this database needs a reviewed migration or restore from backup.'
      );
      process.exit(1);
    }

    console.log(`[db:push] PostgreSQL ${major} schema already contains ${fkCount} foreign keys and all required indexes; skipping drizzle-kit push.`);
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`[db:push] ${error.message}`);
  process.exit(1);
});
