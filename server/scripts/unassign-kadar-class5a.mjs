import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

const KADAR_ID = 'usr_1787066287949_dsdty';

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    // Show what Kadar is currently class teacher of
    const before = await client.query(
      `SELECT id, name, class_teacher_id
       FROM class_sections
       WHERE class_teacher_id = $1 AND institution_code = 'TST001'
       ORDER BY name`,
      [KADAR_ID]
    );
    console.log('Before — Kadar is class teacher of:');
    console.table(before.rows);

    // Find Class 5 A
    const class5a = await client.query(
      `SELECT id, name, class_teacher_id
       FROM class_sections
       WHERE institution_code = 'TST001' AND name = 'Class 5 A'`
    );
    if (class5a.rows.length === 0) {
      console.log('Class 5 A not found, nothing to do.');
      return;
    }
    if (class5a.rows[0].class_teacher_id !== KADAR_ID) {
      console.log(`Class 5 A's class_teacher_id is "${class5a.rows[0].class_teacher_id}" — not Kadar. Nothing to do.`);
      return;
    }

    // Remove Kadar from Class 5 A
    await client.query(
      `UPDATE class_sections SET class_teacher_id = '' WHERE id = $1`,
      [class5a.rows[0].id]
    );
    console.log(`Removed Kadar as class teacher of Class 5 A (${class5a.rows[0].id}).`);

    // Verify
    const after = await client.query(
      `SELECT id, name, class_teacher_id
       FROM class_sections
       WHERE class_teacher_id = $1 AND institution_code = 'TST001'
       ORDER BY name`,
      [KADAR_ID]
    );
    console.log('\nAfter — Kadar is class teacher of:');
    console.table(after.rows);

    const verify = await client.query(
      `SELECT name, class_teacher_id
       FROM class_sections
       WHERE institution_code = 'TST001' AND name IN ('Class 5 A', 'Class 6 A')
       ORDER BY name`
    );
    console.log('\nClass 5 A and Class 6 A after update:');
    console.table(verify.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
