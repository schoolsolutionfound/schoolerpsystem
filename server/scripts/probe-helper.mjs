// Sanity check: simulate what createStudent will do, and verify scope gets classSectionId
// populated when a class_sections row exists matching the triple.

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

    // Simulate a class triple for Class 6 A
    const department = 'Class 6';
    const academicYear = 'A';
    const section = 'A';

    const all = await client.query(
      `SELECT id, name, department, academic_year, section FROM class_sections WHERE institution_code = 'TST001'`
    );

    const match = all.rows.find(
      (c) =>
        (c.department || '').trim().toLowerCase() === department.toLowerCase() &&
        (c.academic_year || '').trim().toLowerCase() === academicYear.toLowerCase() &&
        (c.section || '').trim().toLowerCase() === section.toLowerCase()
    );

    const expectedScope = {
      department,
      academicYear,
      section,
      ...(match ? { classSectionId: match.id, classSectionName: match.name } : {}),
    };

    console.log('Helper output for triple (Class 6, A, A):');
    console.log(JSON.stringify(expectedScope, null, 2));
    console.log('Match:', match);

    // Also test for an unknown triple
    const dept2 = 'Class 99';
    const yr2 = 'X';
    const sec2 = 'Z';
    const match2 = all.rows.find(
      (c) =>
        (c.department || '').trim().toLowerCase() === dept2.toLowerCase() &&
        (c.academic_year || '').trim().toLowerCase() === yr2.toLowerCase() &&
        (c.section || '').trim().toLowerCase() === sec2.toLowerCase()
    );
    const expectedScope2 = { department: dept2, academicYear: yr2, section: sec2 };
    console.log('\nHelper output for triple (Class 99, X, Z) [no match expected]:');
    console.log(JSON.stringify(expectedScope2, null, 2));
    console.log('Match:', match2 || '(none — scope will not have classSectionId)');
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
