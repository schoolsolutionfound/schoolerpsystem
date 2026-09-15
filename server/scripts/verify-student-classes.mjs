// Verify the new student_classes table is used by the read-side helper.

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

    // Total students in TST001
    const students = await client.query(
      `SELECT id, full_name, roll_no_usn, scope->>'classSectionId' AS scope_class
       FROM users
       WHERE institution_code = 'TST001' AND role = 'student'
       ORDER BY roll_no_usn`
    );
    console.log(`Total students in TST001: ${students.rows.length}`);

    // For each, check student_classes
    let viaTable = 0, viaScope = 0, neither = 0;
    for (const s of students.rows) {
      const fromTable = await client.query(
        `SELECT sc.class_section_id, cs.name
         FROM student_classes sc
         JOIN class_sections cs ON cs.id = sc.class_section_id
         WHERE sc.student_id = $1 AND sc.is_active = TRUE
         LIMIT 1`,
        [s.id]
      );
      if (fromTable.rows.length > 0) viaTable++;
      else if (s.scope_class) viaScope++;
      else neither++;
    }
    console.log(`  Resolved via student_classes table: ${viaTable}`);
    console.log(`  Resolved via legacy scope field:   ${viaScope}`);
    console.log(`  Not enrolled anywhere:             ${neither}`);

    // Unique constraint check: try inserting a duplicate
    console.log('\nConstraint sanity: try inserting a duplicate row for the first student...');
    if (students.rows.length > 0) {
      try {
        await client.query(
          `INSERT INTO student_classes
             (id, institution_code, student_id, class_section_id, academic_year, is_active)
           VALUES ($1, 'TST001', $2, $3, $4, TRUE)`,
          [
            `sc_dup_${Date.now()}`,
            students.rows[0].id,
            students.rows[0].scope_class,
            'A',
          ]
        );
        console.log('  ⚠ Duplicate insert succeeded — constraint not enforced');
      } catch (err) {
        console.log('  ✓ Duplicate insert rejected:', err.message.split('\n')[0]);
      }
    }
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
