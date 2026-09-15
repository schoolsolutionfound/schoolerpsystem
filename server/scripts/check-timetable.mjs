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

    // 1) The teacher
    const teacher = await client.query(
      `SELECT id, full_name, email, role, institution_code
       FROM users
       WHERE LOWER(full_name) LIKE '%kadar%'`
    );
    console.log('\nTeacher:');
    console.table(teacher.rows);

    // 2) The class (Class 6 A)
    const klass = await client.query(
      `SELECT id, name, department, academic_year, section, class_teacher_id
       FROM class_sections
       WHERE institution_code = 'TST001' AND name = 'Class 6 A'`
    );
    console.log('\nClass 6 A:');
    console.table(klass.rows);

    // 3) Timetables for that class
    if (klass.rows.length > 0) {
      const tts = await client.query(
        `SELECT id, class_section_id, version, effective_from, created_at
         FROM timetables
         WHERE class_section_id = $1
         ORDER BY version DESC`,
        [klass.rows[0].id]
      );
      console.log('\nTimetables for Class 6 A:');
      console.table(tts.rows);

      if (tts.rows.length > 0) {
        const slots = await client.query(
          `SELECT id, timetable_id, day_of_week, period_id, subject_id, teacher_id, room
           FROM timetable_slots
           WHERE timetable_id = ANY($1)
           ORDER BY day_of_week, period_id`,
          [tts.rows.map((r) => r.id)]
        );
        console.log('\nTimetable slots:');
        console.table(slots.rows);
      } else {
        console.log('\nNo timetables exist for Class 6 A.');
      }
    }

    // 4) Subject-teacher assignments for Class 6 A
    const st = await client.query(
      `SELECT st.id, st.class_section_id, st.subject_id, st.teacher_id,
              s.name AS subject_name, u.full_name AS teacher_name
       FROM subject_teachers st
       LEFT JOIN users u ON u.id = st.teacher_id
       LEFT JOIN subjects s ON s.id = st.subject_id
       WHERE st.class_section_id = $1`,
      [klass.rows[0]?.id || '']
    );
    console.log('\nSubject-teacher assignments for Class 6 A:');
    console.table(st.rows);

    // 5) All subjects
    const subs = await client.query(
      `SELECT id, name, code FROM subjects WHERE institution_code = 'TST001' ORDER BY name`
    );
    console.log('\nSubjects in TST001:');
    console.table(subs.rows);

    // 6) All periods
    const periods = await client.query(
      `SELECT id, label, start_time, end_time, sort_order
       FROM periods
       WHERE institution_code = 'TST001'
       ORDER BY sort_order, start_time`
    );
    console.log('\nPeriods in TST001:');
    console.table(periods.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
