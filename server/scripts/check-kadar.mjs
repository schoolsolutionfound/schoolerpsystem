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

    const inst = await client.query(
      `SELECT id, institution_code, institution_name, institution_type FROM institutions`
    );
    console.log('\nInstitutions:');
    console.table(inst.rows);

    const kadar = await client.query(
      `SELECT id, email, full_name, role, institution_code
       FROM users
       WHERE LOWER(full_name) LIKE '%kadar%' OR LOWER(email) LIKE '%kadar%'`
    );
    console.log('\nUsers matching "kadar":');
    console.table(kadar.rows);

    const teachers = await client.query(
      `SELECT id, email, full_name, institution_code
       FROM users
       WHERE role = 'teacher' AND institution_code = 'TST001'
       ORDER BY full_name`
    );
    console.log('\nTeachers in TST001:');
    console.table(teachers.rows);

    const classes = await client.query(
      `SELECT id, name, department, academic_year, section, class_teacher_id
       FROM class_sections
       WHERE institution_code = 'TST001'
       ORDER BY name`
    );
    console.log('\nClass sections in TST001:');
    console.table(classes.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
