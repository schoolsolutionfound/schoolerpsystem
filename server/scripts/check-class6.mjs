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

    const all = await client.query(
      `SELECT id, name, department, academic_year, section, class_teacher_id, created_at
       FROM class_sections
       WHERE institution_code = 'TST001'
       ORDER BY created_at DESC`
    );
    console.log('\nALL class_sections rows in TST001:');
    console.table(all.rows);
    console.log('Total rows:', all.rows.length);

    // Try fuzzy search for "class 6" / "Class 6"
    const fuzzy = await client.query(
      `SELECT id, name, department, academic_year, section
       FROM class_sections
       WHERE institution_code = 'TST001'
         AND (LOWER(name) LIKE '%class 6%' OR LOWER(name) LIKE '%class%6%' OR LOWER(department) LIKE '%class 6%')`
    );
    console.log('\nRows matching "class 6":');
    console.table(fuzzy.rows);

    // Also dump institution config (sections, courses, etc.)
    const inst = await client.query(
      `SELECT institution_code, institution_name, institution_type,
              departments, academic_years, sections, courses
       FROM institutions
       WHERE institution_code = 'TST001'`
    );
    console.log('\nInstitution config arrays:');
    console.log(JSON.stringify(inst.rows[0], null, 2));
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
