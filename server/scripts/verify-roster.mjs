// Smoke test: query student_classes for a class, verify the roster matches what
// the old (department, academicYear, section) triple would have produced.

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

    // Class 6 A
    const cls = await client.query(
      `SELECT id, department, academic_year, section FROM class_sections
       WHERE institution_code = 'TST001' AND name = 'Class 6 A'`
    );
    const klass = cls.rows[0];

    // New path
    const newRoster = await client.query(
      `SELECT sc.id, sc.student_id, u.full_name, u.roll_no_usn
       FROM student_classes sc
       JOIN users u ON u.id = sc.student_id
       WHERE sc.class_section_id = $1 AND sc.is_active = TRUE
       ORDER BY u.roll_no_usn`,
      [klass.id]
    );

    // Old path (string triple)
    const oldRoster = await client.query(
      `SELECT id, full_name, roll_no_usn
       FROM users
       WHERE institution_code = 'TST001'
         AND role = 'student'
         AND scope->>'department' = $1
         AND scope->>'academicYear' = $2
         AND scope->>'section' = $3
       ORDER BY roll_no_usn`,
      [klass.department, klass.academic_year, klass.section]
    );

    console.log(`Class 6 A: ${klass.id}`);
    console.log(`  New path (student_classes):  ${newRoster.rows.length} students`);
    console.log(`  Old path (scope triple):     ${oldRoster.rows.length} students`);

    const newIds = new Set(newRoster.rows.map((r) => r.student_id));
    const oldIds = new Set(oldRoster.rows.map((r) => r.id));
    const inBoth = [...newIds].filter((id) => oldIds.has(id));
    const newOnly = [...newIds].filter((id) => !oldIds.has(id));
    const oldOnly = [...oldIds].filter((id) => !newIds.has(id));
    console.log(`  In both: ${inBoth.length}`);
    console.log(`  Only in new: ${newOnly.length} → ${newOnly.map((id) => id.slice(-6)).join(', ')}`);
    console.log(`  Only in old: ${oldOnly.length} → ${oldOnly.map((id) => id.slice(-6)).join(', ')}`);

    console.log('\nNew-path roster:');
    console.table(newRoster.rows.map((r) => ({ id: r.student_id.slice(-6), name: r.full_name, roll: r.roll_no_usn })));
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
