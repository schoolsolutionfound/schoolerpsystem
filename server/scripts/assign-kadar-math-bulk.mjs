import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

const KADAR_ID = 'usr_1787066287949_dsdty';

const TARGETS = [
  'Class 5 A',
  'Class 5 B',
  'Class 6 A',
  'Class 6 B',
  'Class 6 C',
  'Class 7 A',
  'Class 7 B',
  'Class 7 C',
  'Class 8 A',
  'Class 8 B',
  'Class 9 A',
  'Class 9 B',
  'Class 9 C',
  'Class 10 C',
];

function newId() {
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    // Resolve Mathematics subject
    const sub = await client.query(
      `SELECT id FROM subjects WHERE institution_code = 'TST001' AND name = 'Mathematics'`
    );
    if (sub.rows.length === 0) {
      console.log('Mathematics subject not found.');
      return;
    }
    const subjectId = sub.rows[0].id;

    let created = 0, reassigned = 0, unchanged = 0, notFound = 0;
    const log = [];

    for (const name of TARGETS) {
      const cls = await client.query(
        `SELECT id FROM class_sections WHERE institution_code = 'TST001' AND name = $1`,
        [name]
      );
      if (cls.rows.length === 0) {
        log.push({ class: name, action: 'NOT_FOUND' });
        notFound++;
        continue;
      }
      const classId = cls.rows[0].id;

      const existing = await client.query(
        `SELECT id, teacher_id FROM subject_teachers
         WHERE class_section_id = $1 AND subject_id = $2`,
        [classId, subjectId]
      );

      if (existing.rows.length === 0) {
        const id = newId();
        await client.query(
          `INSERT INTO subject_teachers (id, institution_code, class_section_id, subject_id, teacher_id)
           VALUES ($1, 'TST001', $2, $3, $4)
           ON CONFLICT (class_section_id, subject_id) DO NOTHING`,
          [id, classId, subjectId, KADAR_ID]
        );
        log.push({ class: name, action: 'CREATED' });
        created++;
      } else if (existing.rows[0].teacher_id === KADAR_ID) {
        log.push({ class: name, action: 'ALREADY_KADAR' });
        unchanged++;
      } else {
        const oldTeacher = existing.rows[0].teacher_id;
        await client.query(
          `UPDATE subject_teachers SET teacher_id = $1, updated_at = NOW() WHERE id = $2`,
          [KADAR_ID, existing.rows[0].id]
        );
        log.push({ class: name, action: `REASSIGNED from ${oldTeacher}` });
        reassigned++;
      }
    }

    console.log('\nLog:');
    console.table(log);
    console.log(`\nSummary: created=${created}, reassigned=${reassigned}, unchanged=${unchanged}, not_found=${notFound}`);

    // Final verification
    const verify = await client.query(
      `SELECT cs.name AS class_name, s.name AS subject_name, u.full_name AS teacher_name
       FROM subject_teachers st
       LEFT JOIN class_sections cs ON cs.id = st.class_section_id
       LEFT JOIN subjects s ON s.id = st.subject_id
       LEFT JOIN users u ON u.id = st.teacher_id
       WHERE st.teacher_id = $1
         AND s.name = 'Mathematics'
         AND cs.institution_code = 'TST001'
       ORDER BY cs.name`,
      [KADAR_ID]
    );
    console.log(`\nKadar now teaches Mathematics for ${verify.rows.length} class(es):`);
    console.table(verify.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
