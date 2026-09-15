import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

const TEACHERS = {
  Mathematics: 'usr_1787066287949_dsdty', // Kadar
  English: 'usr_1788405167547_a4rct7',     // Anita
  Science: 'usr_1788405167553_kdqona',     // Vivek
  'Social Studies': 'usr_1788405167556_jrwyaj', // Priya
  'Computer Science': 'usr_1788405167559_qug6ew', // Rohan
};

// Same subject rotation as Class 5 A
const SUBJECT_ROTATION = [
  'English',          // Period 1
  'Science',          // Period 2
  'Social Studies',   // Period 3
  'Mathematics',      // Period 4
  'Computer Science', // Period 5
  'English',          // Period 6
];

const ROOMS = ['Room 100', 'Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105'];

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    // Class 6 A
    const c6 = await client.query(
      `SELECT id FROM class_sections WHERE institution_code = 'TST001' AND name = 'Class 6 A'`
    );
    if (c6.rows.length === 0) {
      console.log('Class 6 A not found.');
      return;
    }
    const classId = c6.rows[0].id;

    // Subjects
    const subjectsRes = await client.query(
      `SELECT id, name FROM subjects WHERE institution_code = 'TST001' AND name = ANY($1)`,
      [Object.keys(TEACHERS)]
    );
    const subjectByName = Object.fromEntries(subjectsRes.rows.map((r) => [r.name, r.id]));

    // 1) Reassign subject_teachers for Class 6 A
    console.log('=== Reassigning subject_teachers for Class 6 A ===');
    for (const subjectName of Object.keys(TEACHERS)) {
      const newTeacherId = TEACHERS[subjectName];
      const subjectId = subjectByName[subjectName];
      const existing = await client.query(
        `SELECT id, teacher_id FROM subject_teachers
         WHERE class_section_id = $1 AND subject_id = $2`,
        [classId, subjectId]
      );
      if (existing.rows.length > 0) {
        if (existing.rows[0].teacher_id === newTeacherId) {
          console.log(`  ↻ ${subjectName} already on ${newTeacherId.slice(-6)}`);
        } else {
          await client.query(
            `UPDATE subject_teachers SET teacher_id = $1, updated_at = NOW() WHERE id = $2`,
            [newTeacherId, existing.rows[0].id]
          );
          console.log(`  ✓ ${subjectName} reassigned to ${newTeacherId.slice(-6)}`);
        }
      } else {
        const id = newId('st');
        await client.query(
          `INSERT INTO subject_teachers (id, institution_code, class_section_id, subject_id, teacher_id)
           VALUES ($1, 'TST001', $2, $3, $4)
           ON CONFLICT (class_section_id, subject_id) DO NOTHING`,
          [id, classId, subjectId, newTeacherId]
        );
        console.log(`  ✓ ${subjectName} → ${newTeacherId.slice(-6)} (new assignment)`);
      }
    }

    // 2) Delete all existing Class 6 A slots
    console.log('\n=== Rebuilding Class 6 A timetable ===');
    const del = await client.query(
      `DELETE FROM timetable_slots WHERE class_section_id = $1`,
      [classId]
    );
    console.log(`  Deleted ${del.rowCount} old slots.`);

    // 3) Find or create a timetable row
    let timetableId;
    const tt = await client.query(
      `SELECT id FROM timetables WHERE class_section_id = $1 ORDER BY version DESC LIMIT 1`,
      [classId]
    );
    if (tt.rows.length > 0) {
      timetableId = tt.rows[0].id;
    } else {
      timetableId = newId('tt');
      await client.query(
        `INSERT INTO timetables (id, institution_code, class_section_id, version, effective_from, created_by)
         VALUES ($1, 'TST001', $2, 1, CURRENT_DATE, $3)`,
        [timetableId, classId, TEACHERS.Mathematics]
      );
    }
    console.log(`  Using timetable ${timetableId}`);

    // 4) Load teaching periods (skip Lunch)
    const periods = await client.query(
      `SELECT id, label, sort_order FROM periods
       WHERE institution_code = 'TST001' AND label != 'Lunch'
       ORDER BY sort_order`
    );
    console.log(`  Got ${periods.rows.length} teaching periods`);

    // 5) Insert Mon-Fri × 6 slots
    let inserted = 0;
    for (let day = 1; day <= 5; day++) {
      for (let i = 0; i < periods.rows.length; i++) {
        const period = periods.rows[i];
        const subjectName = SUBJECT_ROTATION[i];
        const subjectId = subjectByName[subjectName];
        const teacherId = TEACHERS[subjectName];
        const id = newId('ts');
        await client.query(
          `INSERT INTO timetable_slots
             (id, timetable_id, institution_code, class_section_id, subject_id, teacher_id, period_id, day_of_week, room)
           VALUES ($1, $2, 'TST001', $3, $4, $5, $6, $7, $8)`,
          [id, timetableId, classId, subjectId, teacherId, period.id, day, ROOMS[i]]
        );
        inserted++;
      }
    }
    console.log(`  ✓ Inserted ${inserted} new slots (5 days × 6 periods, lunch skipped)`);

    // 6) Final verification
    console.log('\n=== Class 6 A weekly grid (Mon-Fri) ===');
    const grid = await client.query(
      `SELECT p.label AS period, p.start_time, p.end_time, s.name AS subject, u.full_name AS teacher, ts.day_of_week, ts.room
       FROM timetable_slots ts
       JOIN periods p ON p.id = ts.period_id
       JOIN subjects s ON s.id = ts.subject_id
       JOIN users u ON u.id = ts.teacher_id
       WHERE ts.class_section_id = $1
       ORDER BY ts.day_of_week, p.sort_order`,
      [classId]
    );
    console.table(grid.rows);

    // 7) Class teacher unchanged
    const teacher = await client.query(
      `SELECT cs.name, u.full_name AS class_teacher
       FROM class_sections cs
       LEFT JOIN users u ON u.id = cs.class_teacher_id
       WHERE cs.id = $1`,
      [classId]
    );
    console.log('\nClass teacher of Class 6 A:');
    console.table(teacher.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
