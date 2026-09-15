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

    // All subject_teachers rows for TST001, joined to subject + class
    const all = await client.query(
      `SELECT st.id,
              cs.name AS class_name,
              s.name AS subject_name,
              u.full_name AS teacher_name,
              st.teacher_id
       FROM subject_teachers st
       LEFT JOIN class_sections cs ON cs.id = st.class_section_id
       LEFT JOIN subjects s ON s.id = st.subject_id
       LEFT JOIN users u ON u.id = st.teacher_id
       WHERE st.institution_code = 'TST001'
       ORDER BY cs.name, s.name`
    );
    console.log(`\nAll subject-teacher assignments in TST001: ${all.rows.length} row(s)`);
    console.table(all.rows);

    // All classes where Kadar is the class teacher
    const kadarClasses = await client.query(
      `SELECT id, name, department, section, class_teacher_id
       FROM class_sections
       WHERE institution_code = 'TST001' AND class_teacher_id = 'usr_1787066287949_dsdty'
       ORDER BY name`
    );
    console.log('\nClasses where Kadar is class_teacher:');
    console.table(kadarClasses.rows);

    // All timetable slots where Kadar is the teacher
    const kadarSlots = await client.query(
      `SELECT ts.id, cs.name AS class_name, s.name AS subject_name,
              p.label AS period, p.start_time, p.end_time,
              ts.day_of_week, ts.room
       FROM timetable_slots ts
       LEFT JOIN class_sections cs ON cs.id = ts.class_section_id
       LEFT JOIN subjects s ON s.id = ts.subject_id
       LEFT JOIN periods p ON p.id = ts.period_id
       WHERE ts.teacher_id = 'usr_1787066287949_dsdty'
         AND ts.institution_code = 'TST001'
       ORDER BY ts.day_of_week, p.sort_order`
    );
    console.log(`\nTimetable slots where Kadar teaches: ${kadarSlots.rows.length} slot(s)`);
    console.table(kadarSlots.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
