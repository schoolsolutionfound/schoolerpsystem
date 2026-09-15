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

    // Current state of Class 5 A
    const c5 = await client.query(
      `SELECT id, name, class_teacher_id FROM class_sections
       WHERE institution_code = 'TST001' AND name = 'Class 5 A'`
    );
    console.log('Class 5 A:');
    console.table(c5.rows);

    const periods = await client.query(
      `SELECT id, label, start_time, end_time, sort_order
       FROM periods WHERE institution_code = 'TST001' ORDER BY sort_order`
    );
    console.log('\nPeriods:');
    console.table(periods.rows);

    const c5Slots = await client.query(
      `SELECT ts.id, p.label, s.name AS subject_name, u.full_name AS teacher_name, ts.day_of_week
       FROM timetable_slots ts
       LEFT JOIN periods p ON p.id = ts.period_id
       LEFT JOIN subjects s ON s.id = ts.subject_id
       LEFT JOIN users u ON u.id = ts.teacher_id
       WHERE ts.class_section_id = $1
       ORDER BY ts.day_of_week, p.sort_order NULLS LAST`,
      [c5.rows[0]?.id || '']
    );
    console.log(`\nClass 5 A current slots: ${c5Slots.rows.length}`);
    if (c5Slots.rows.length > 0) console.table(c5Slots.rows.slice(0, 5));

    // Teachers
    const teachers = await client.query(
      `SELECT id, full_name, email, role FROM users
       WHERE institution_code = 'TST001' AND role = 'teacher' ORDER BY full_name`
    );
    console.log(`\nCurrent teachers: ${teachers.rows.length}`);
    console.table(teachers.rows);

    // Existing subject_teachers for Class 5 A
    const st = await client.query(
      `SELECT st.id, s.name AS subject_name, u.full_name AS teacher_name
       FROM subject_teachers st
       LEFT JOIN subjects s ON s.id = st.subject_id
       LEFT JOIN users u ON u.id = st.teacher_id
       WHERE st.class_section_id = $1
       ORDER BY s.name`,
      [c5.rows[0]?.id || '']
    );
    console.log('\nClass 5 A subject-teacher assignments:');
    console.table(st.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
