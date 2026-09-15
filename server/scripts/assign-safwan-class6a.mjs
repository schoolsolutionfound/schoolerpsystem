import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

const SAFWAN_EMAIL = 'safwanhaneef786@gmail.com';

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    // Resolve class
    const cls = await client.query(
      `SELECT id, name, department, academic_year, section FROM class_sections
       WHERE institution_code = 'TST001' AND name = 'Class 6 A'`
    );
    if (cls.rows.length === 0) {
      console.log('Class 6 A not found.');
      return;
    }
    const klass = cls.rows[0];

    // Resolve user
    const user = await client.query(
      `SELECT id, email, full_name, role, scope FROM users
       WHERE LOWER(email) = LOWER($1) AND institution_code = 'TST001'`,
      [SAFWAN_EMAIL]
    );
    if (user.rows.length === 0) {
      console.log('Safwan not found in TST001.');
      return;
    }
    const u = user.rows[0];
    if (u.role !== 'student') {
      console.log(`Safwan's role is "${u.role}", not "student". Refusing to overwrite.`);
      return;
    }

    // Build a roll number (avoid empty). Use a simple monotonic one.
    const existing = await client.query(
      `SELECT roll_no_usn FROM users
       WHERE institution_code = 'TST001' AND role = 'student' AND roll_no_usn LIKE 'C6A-%'
       ORDER BY roll_no_usn DESC LIMIT 1`
    );
    let nextNum = 1;
    if (existing.rows.length > 0) {
      const m = (existing.rows[0].roll_no_usn || '').match(/C6A-(\d+)/);
      if (m) nextNum = parseInt(m[1], 10) + 1;
    }
    const newRoll = `C6A-${String(nextNum).padStart(3, '0')}`;

    const newScope = {
      ...(u.scope && typeof u.scope === 'object' ? u.scope : {}),
      classSectionId: klass.id,
      classSectionName: klass.name,
      department: klass.department,
      academicYear: klass.academic_year,
      section: klass.section,
    };

    await client.query(
      `UPDATE users
         SET roll_no_usn = $1,
             scope = $2::jsonb,
             profile_completed = TRUE,
             updated_at = NOW()
       WHERE id = $3`,
      [newRoll, JSON.stringify(newScope), u.id]
    );

    // Verify
    const verify = await client.query(
      `SELECT id, email, full_name, role, roll_no_usn, scope
       FROM users WHERE id = $1`,
      [u.id]
    );
    console.log('\nSafwan after update:');
    console.table(verify.rows);

    // Also confirm: how many students are in Class 6 A now?
    const roster = await client.query(
      `SELECT id, email, full_name, roll_no_usn, scope
       FROM users
       WHERE institution_code = 'TST001'
         AND role = 'student'
         AND scope->>'classSectionId' = $1
       ORDER BY full_name`,
      [klass.id]
    );
    console.log(`\nStudents in Class 6 A (${roster.rows.length}):`);
    console.table(roster.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
