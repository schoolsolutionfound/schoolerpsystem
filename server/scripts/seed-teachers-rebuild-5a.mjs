import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

const KADAR_ID = 'usr_1787066287949_dsdty';

// (subject, full name, email) for the new teachers
const NEW_TEACHERS = [
  { subject: 'English',          fullName: 'Ms Anita',  email: 'anita.teacher@schoolerp.test' },
  { subject: 'Science',          fullName: 'Mr Vivek',  email: 'vivek.teacher@schoolerp.test' },
  { subject: 'Social Studies',   fullName: 'Ms Priya',  email: 'priya.teacher@schoolerp.test' },
  { subject: 'Computer Science', fullName: 'Mr Rohan',  email: 'rohan.teacher@schoolerp.test' },
];

// Subject rotation for Class 5 A: 5 teaching periods, lunch skipped
// Periods 1,2,3,4,5,6 → subjects, Mon-Fri same
const SUBJECT_ROTATION = [
  'English',          // Period 1 (09:00-10:00)
  'Science',          // Period 2 (10:00-11:00)
  'Social Studies',   // Period 3 (11:00-12:00)
  'Mathematics',      // Period 4 (12:00-13:00) — Kadar
  'Computer Science', // Period 5 (14:00-15:00) — after lunch
  'English',          // Period 6 (15:00-16:00)
];

const ROOMS = ['Room 100', 'Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105'];

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    // 1) Create 4 new teachers (skip if email already exists)
    console.log('=== 1) Creating new teachers ===');
    const teacherIdBySubject = {};
    for (const t of NEW_TEACHERS) {
      const existing = await client.query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
        [t.email]
      );
      if (existing.rows.length > 0) {
        teacherIdBySubject[t.subject] = existing.rows[0].id;
        console.log(`  ↻ Reusing existing ${t.email} → ${existing.rows[0].id}`);
        continue;
      }
      const id = newId('usr');
      const firebaseUid = `firebase_${id}`;
      await client.query(
        `INSERT INTO users
           (id, firebase_uid, email, full_name, role, institution_code, institution_name, institution_type,
            must_change_password, profile_completed, scope)
         VALUES ($1, $2, $3, $4, 'teacher', 'TST001', 'Test School', 'school',
                 true, false, '{}'::jsonb)`,
        [id, firebaseUid, t.email, t.fullName]
      );
      teacherIdBySubject[t.subject] = id;
      console.log(`  ✓ Created ${t.fullName} (${t.email}) → ${id}`);
    }

    // 2) Resolve subject IDs
    console.log('\n=== 2) Resolving subjects ===');
    const subjectsRes = await client.query(
      `SELECT id, name FROM subjects WHERE institution_code = 'TST001' AND name = ANY($1)`,
      [SUBJECT_ROTATION]
    );
    const subjectByName = Object.fromEntries(subjectsRes.rows.map((r) => [r.name, r.id]));
    console.log('Subjects:', subjectByName);

    // 3) Resolve Class 5 A
    const c5 = await client.query(
      `SELECT id FROM class_sections WHERE institution_code = 'TST001' AND name = 'Class 5 A'`
    );
    if (c5.rows.length === 0) {
      console.log('Class 5 A not found.');
      return;
    }
    const classId = c5.rows[0].id;

    // 4) Reassign subject_teachers for Class 5 A — CS/Eng/Sci/SST to new teachers; Math stays with Kadar
    console.log('\n=== 3) Reassigning subject_teachers for Class 5 A ===');
    for (const subjectName of Object.keys(subjectByName)) {
      const newTeacherId =
        subjectName === 'Mathematics' ? KADAR_ID : teacherIdBySubject[subjectName];
      if (!newTeacherId) {
        console.log(`  ⚠ No teacher for ${subjectName}, skipping`);
        continue;
      }
      const existing = await client.query(
        `SELECT id, teacher_id FROM subject_teachers
         WHERE class_section_id = $1 AND subject_id = $2`,
        [classId, subjectByName[subjectName]]
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
          [id, classId, subjectByName[subjectName], newTeacherId]
        );
        console.log(`  ✓ ${subjectName} → ${newTeacherId.slice(-6)} (new assignment)`);
      }
    }

    // 5) Delete all existing Class 5 A slots
    console.log('\n=== 4) Rebuilding Class 5 A timetable ===');
    const del = await client.query(
      `DELETE FROM timetable_slots WHERE class_section_id = $1`,
      [classId]
    );
    console.log(`  Deleted ${del.rowCount} old slots.`);

    // 6) Find or create a timetable row for Class 5 A
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
        [timetableId, classId, KADAR_ID]
      );
    }
    console.log(`  Using timetable ${timetableId}`);

    // 7) Load period IDs (sort by sort_order, skip Lunch)
    const periods = await client.query(
      `SELECT id, label, sort_order FROM periods
       WHERE institution_code = 'TST001' AND label != 'Lunch'
       ORDER BY sort_order`
    );
    console.log(`  Got ${periods.rows.length} teaching periods`);

    // 8) Insert slots Mon-Fri × 6 teaching periods
    let inserted = 0;
    for (let day = 1; day <= 5; day++) {
      for (let i = 0; i < periods.rows.length; i++) {
        const period = periods.rows[i];
        const subjectName = SUBJECT_ROTATION[i];
        const subjectId = subjectByName[subjectName];
        const teacherId =
          subjectName === 'Mathematics' ? KADAR_ID : teacherIdBySubject[subjectName];
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

    // 9) Final verification
    console.log('\n=== 5) Class 5 A weekly grid (Mon-Fri) ===');
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

    console.log('\n=== 6) All teachers in TST001 ===');
    const t = await client.query(
      `SELECT id, full_name, email FROM users WHERE institution_code = 'TST001' AND role = 'teacher' ORDER BY full_name`
    );
    console.table(t.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
