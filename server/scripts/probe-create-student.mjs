// Simulate the new createStudent flow: insert a user with the exact scope shape
// the patched admin.service.ts would produce.

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

function newId() {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    const cls = await client.query(
      `SELECT id, name, department, academic_year, section FROM class_sections
       WHERE institution_code = 'TST001' AND name = 'Class 6 A'`
    );
    if (cls.rows.length === 0) {
      console.log('Class 6 A not found.');
      return;
    }
    const klass = cls.rows[0];

    // Build the same scope shape the patched createStudent helper produces
    const scope = {
      department: klass.department,
      academicYear: klass.academic_year,
      section: klass.section,
      classSectionId: klass.id,
      classSectionName: klass.name,
    };

    // We don't go through Firebase; just create a test user row.
    // (skip the firebase_uid unique constraint by using a unique fake uid)
    const testEmail = `test.student.${Date.now()}@example.com`;
    const firebaseUid = `firebase_test_${Date.now()}`;
    const id = newId();

    await client.query(
      `INSERT INTO users
         (id, firebase_uid, email, full_name, role, institution_code, institution_name, institution_type,
          roll_no_usn, must_change_password, profile_completed, scope)
       VALUES ($1, $2, $3, $4, 'student', 'TST001', 'Test School', 'school',
               $5, false, false, $6::jsonb)`,
      [id, firebaseUid, testEmail, 'Test Classmate', 'C6A-002', JSON.stringify(scope)]
    );

    // Read back & verify the scope shape
    const verify = await client.query(
      `SELECT id, email, full_name, roll_no_usn, scope FROM users WHERE id = $1`,
      [id]
    );
    console.log('Test student created:');
    console.table(verify.rows);

    // Final roster of Class 6 A
    const roster = await client.query(
      `SELECT email, full_name, roll_no_usn, scope->>'classSectionId' AS class_section_id
       FROM users
       WHERE institution_code = 'TST001'
         AND role = 'student'
         AND scope->>'classSectionId' = $1
       ORDER BY full_name`,
      [klass.id]
    );
    console.log(`\nStudents in Class 6 A (${roster.rows.length}):`);
    console.table(roster.rows);

    // Cleanup the test student so we don't leave junk
    await client.query(`DELETE FROM users WHERE id = $1`, [id]);
    console.log(`\nCleaned up test student ${id}.`);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
