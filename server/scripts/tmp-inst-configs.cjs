const { db } = require('./src/modules/shared/db/index.js');
(async () => {
  const rows = await db.execute("SELECT institution_code, institution_type, departments, academic_years, courses, sections FROM institutions ORDER BY institution_code");
  for (const r of rows.rows ?? rows) {
    console.log(JSON.stringify({ code: r.institution_code, type: r.institution_type, departments: r.departments, academicYears: r.academic_years, courses: r.courses, sections: r.sections }));
  }
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
