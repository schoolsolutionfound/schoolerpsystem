import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    console.log('[Institution Counts] DB:', connectionString.split('@')[1]);

    const byType = await client.query(
      `SELECT institution_type, COUNT(*)::int AS count
       FROM institutions
       GROUP BY institution_type
       ORDER BY institution_type`
    );
    console.log('\nBy institution_type:');
    console.table(byType.rows);

    const total = await client.query(`SELECT COUNT(*)::int AS total FROM institutions`);
    console.log('Total institutions:', total.rows[0].total);

    const all = await client.query(
      `SELECT id, institution_code, institution_name, institution_type, created_at
       FROM institutions
       ORDER BY created_at DESC`
    );
    console.log('\nAll institutions:');
    console.table(all.rows);

    const distinct = await client.query(
      `SELECT DISTINCT institution_type FROM institutions`
    );
    console.log('\nDistinct institution_type values in DB:', distinct.rows.map((r) => r.institution_type));
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
