import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

const KADAR_ID = 'usr_1787066287949_dsdty';

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    // 1) Ensure teacher still exists
    const teacher = await client.query(
      `SELECT id, full_name, role, institution_code
       FROM users
       WHERE id = $1`,
      [KADAR_ID]
    );
    if (teacher.rows.length === 0) {
      console.error(`Teacher ${KADAR_ID} not found.`);
      return;
    }
    console.log('Teacher found:', teacher.rows[0]);

    // 2) Check if Class 6 already exists
    const existing = await client.query(
      `SELECT id, name, department, academic_year, section, class_teacher_id
       FROM class_sections
       WHERE institution_code = 'TST001'
         AND LOWER(name) = 'class 6 a'`
    );

    let classRow;
    if (existing.rows.length > 0) {
      classRow = existing.rows[0];
      console.log('Class 6 A already exists:', classRow);
      console.log('Skipping insert; will update class_teacher_id only.');
      await client.query(
        `UPDATE class_sections SET class_teacher_id = $1 WHERE id = $2`,
        [KADAR_ID, classRow.id]
      );
    } else {
      const newCsId = newId('cs');
      const inserted = await client.query(
        `INSERT INTO class_sections
           (id, institution_code, name, department, academic_year, section, class_teacher_id)
         VALUES ($1, 'TST001', 'Class 6 A', 'Class 6', 'A', 'A', $2)
         RETURNING id, name, department, academic_year, section, class_teacher_id, institution_code`,
        [newCsId, KADAR_ID]
      );
      classRow = inserted.rows[0];
      console.log('Created class_sections row:', classRow);
    }

    // 3) Verify
    const verify = await client.query(
      `SELECT cs.id, cs.name, cs.class_teacher_id, u.full_name AS teacher_name
       FROM class_sections cs
       LEFT JOIN users u ON u.id = cs.class_teacher_id
       WHERE cs.id = $1`,
      [classRow.id]
    );
    console.log('\nFinal state:');
    console.table(verify.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
