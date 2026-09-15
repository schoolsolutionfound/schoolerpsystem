import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

function newId() {
  return `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildRows(institutionCode, type, departments, academicYears, courses) {
  const sections = (academicYears || []).map((s) => String(s).trim()).filter(Boolean);
  const deptList = (departments || []).map((d) => String(d).trim()).filter(Boolean);
  const yearList = (type === 'college' ? (courses || []) : (academicYears || []))
    .map((y) => String(y).trim())
    .filter(Boolean);

  const rows = [];
  if (type === 'school') {
    for (const klass of deptList) {
      if (sections.length === 0) {
        rows.push({ id: newId(), institutionCode, name: klass, department: klass, academicYear: '', section: '', classTeacherId: '' });
      } else {
        for (const sec of sections) {
          rows.push({
            id: newId(),
            institutionCode,
            name: `${klass} ${sec}`,
            department: klass,
            academicYear: sec,
            section: sec,
            classTeacherId: '',
          });
        }
      }
    }
  } else {
    for (const dept of deptList) {
      for (const year of yearList) {
        if (sections.length === 0) {
          rows.push({
            id: newId(),
            institutionCode,
            name: `${dept} ${year}`,
            department: dept,
            academicYear: year,
            section: '',
            classTeacherId: '',
          });
        } else {
          for (const sec of sections) {
            rows.push({
              id: newId(),
              institutionCode,
              name: `${dept} ${year} ${sec}`,
              department: dept,
              academicYear: year,
              section: sec,
              classTeacherId: '',
            });
          }
        }
      }
    }
  }
  return rows;
}

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    const inst = await client.query(
      `SELECT id, institution_code, institution_name, institution_type, departments, academic_years, courses
       FROM institutions WHERE institution_code = 'TST001'`
    );
    if (inst.rows.length === 0) {
      console.log('TST001 not found.');
      return;
    }
    const row = inst.rows[0];
    console.log('TST001 config:', {
      type: row.institution_type,
      departments: row.departments,
      academicYears: row.academic_years,
      courses: row.courses,
    });

    const toInsert = buildRows(
      row.institution_code,
      row.institution_type,
      row.departments || [],
      row.academic_years || [],
      row.courses || []
    );

    const existing = await client.query(
      `SELECT name FROM class_sections WHERE institution_code = 'TST001'`
    );
    const existingNames = new Set(existing.rows.map((r) => r.name));
    const fresh = toInsert.filter((r) => !existingNames.has(r.name));

    console.log(`\nExisting class_sections rows: ${existing.rows.length}`);
    console.log(`Would insert: ${toInsert.length}, new (not already present): ${fresh.length}`);

    if (fresh.length > 0) {
      const valuesSql = fresh
        .map(
          (_, i) =>
            `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
        )
        .join(', ');
      const params = fresh.flatMap((r) => [
        r.id,
        r.institutionCode,
        r.name,
        r.department,
        r.academicYear,
        r.section,
      ]);
      await client.query(
        `INSERT INTO class_sections (id, institution_code, name, department, academic_year, section)
         VALUES ${valuesSql}
         ON CONFLICT (institution_code, name) DO NOTHING`,
        params
      );
      console.log(`Inserted ${fresh.length} class_sections rows.`);
    }

    const after = await client.query(
      `SELECT name, department, academic_year, section, class_teacher_id
       FROM class_sections WHERE institution_code = 'TST001' ORDER BY name`
    );
    console.log('\nclass_sections after backfill:');
    console.table(after.rows);
    console.log('Total:', after.rows.length);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
