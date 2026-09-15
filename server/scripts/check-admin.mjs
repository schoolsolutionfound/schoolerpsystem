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

    // 1) Show institution
    const inst = await client.query(
      `SELECT id, institution_code, institution_name, institution_type
       FROM institutions
       WHERE institution_code = 'TST001'`
    );
    console.log('\nInstitution (TST001):');
    console.table(inst.rows);

    // 2) Counts of users by role scoped to TST001
    const byRole = await client.query(
      `SELECT role, COUNT(*)::int AS count
       FROM users
       WHERE institution_code = 'TST001'
       GROUP BY role
       ORDER BY role`
    );
    console.log('\nUsers by role for TST001:');
    console.table(byRole.rows);

    // 3) Any admin / institution-admin users on this institution
    const admins = await client.query(
      `SELECT id, email, full_name, role, institution_code, institution_name, created_at
       FROM users
       WHERE institution_code = 'TST001'
         AND role IN ('admin', 'institution admin', 'institution_admin')
       ORDER BY created_at DESC`
    );
    console.log('\nAdmins attached to TST001:');
    console.table(admins.rows);

    // 4) Total user count for the institution
    const total = await client.query(
      `SELECT COUNT(*)::int AS total FROM users WHERE institution_code = 'TST001'`
    );
    console.log('Total users in TST001:', total.rows[0].total);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
