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

    const user = await client.query(
      `SELECT id, email, full_name, role, institution_code, institution_name, roll_no_usn, scope
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      ['safwanhaneef786@gmail.com']
    );
    console.log('User:');
    console.table(user.rows);

    if (user.rows.length > 0) {
      const u = user.rows[0];
      // Check current class_sections.class_teacher_id doesn't matter; what we want is whether the
      // student is already linked to Class 6 A. The schema doesn't have a direct class_section_id
      // on users; the link is via scope.classSectionId or a separate student_classes table.
      const tables = await client.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_name IN ('student_classes', 'class_students', 'enrollments', 'student_enrollments')`
      );
      console.log('\nPossible enrollment tables:');
      console.table(tables.rows);
    }

    const class6a = await client.query(
      `SELECT id, name, class_teacher_id FROM class_sections
       WHERE institution_code = 'TST001' AND name = 'Class 6 A'`
    );
    console.log('\nClass 6 A:');
    console.table(class6a.rows);

    // Show all students in TST001
    const students = await client.query(
      `SELECT id, email, full_name, roll_no_usn, department, academic_year, section, scope
       FROM users
       WHERE institution_code = 'TST001' AND role = 'student'
       ORDER BY full_name`
    );
    console.log('\nStudents in TST001:');
    console.table(students.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
