import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

const KADAR_ID = 'usr_1787066287949_dsdty';

const PERIODS = [
  { label: 'Period 1', start: '09:00', end: '10:00' },
  { label: 'Period 2', start: '10:00', end: '11:00' },
  { label: 'Period 3', start: '11:00', end: '12:00' },
  { label: 'Period 4', start: '12:00', end: '13:00' },
  { label: 'Lunch',   start: '13:00', end: '14:00' },
  { label: 'Period 5', start: '14:00', end: '15:00' },
  { label: 'Period 6', start: '15:00', end: '16:00' },
];

const SUBJECT_ROTATION = [
  'Mathematics',
  'English',
  'Science',
  'Social Studies',
  'Computer Science',
  'Mathematics',
];

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    // 1) Resolve class
    const cls = await client.query(
      `SELECT id, name FROM class_sections WHERE institution_code = 'TST001' AND name = 'Class 6 A'`
    );
    if (cls.rows.length === 0) {
      console.log('Class 6 A not found.');
      return;
    }
    const classId = cls.rows[0].id;

    // 2) Wipe any existing periods for TST001 and insert the new ones.
    //    This will invalidate any timetable slots pointing at old periods, so we drop timetable data for this class too.
    await client.query(`DELETE FROM timetable_slots WHERE class_section_id = $1`, [classId]);
    await client.query(`DELETE FROM timetables WHERE class_section_id = $1`, [classId]);
    await client.query(`DELETE FROM periods WHERE institution_code = 'TST001'`);

    const periodIds = [];
    for (let i = 0; i < PERIODS.length; i++) {
      const p = PERIODS[i];
      const id = newId('per');
      await client.query(
        `INSERT INTO periods (id, institution_code, label, start_time, end_time, sort_order)
         VALUES ($1, 'TST001', $2, $3, $4, $5)`,
        [id, p.label, p.start, p.end, i]
      );
      periodIds.push({ id, ...p });
    }
    console.log('Periods inserted:');
    console.table(periodIds);

    // 3) Resolve subject IDs (we use Mathematics for all 6 because Kadar is the only teacher)
    const subjectsRes = await client.query(
      `SELECT id, name FROM subjects WHERE institution_code = 'TST001' AND name = ANY($1)`,
      [SUBJECT_ROTATION]
    );
    const subjectByName = Object.fromEntries(subjectsRes.rows.map((r) => [r.name, r.id]));
    const missing = SUBJECT_ROTATION.filter((n) => !subjectByName[n]);
    if (missing.length > 0) {
      console.error('Missing subjects in DB:', missing);
      return;
    }

    // 4) Create a new timetable for Class 6 A
    const timetableId = newId('tt');
    await client.query(
      `INSERT INTO timetables (id, institution_code, class_section_id, version, effective_from, created_by)
       VALUES ($1, 'TST001', $2, 1, CURRENT_DATE, $3)`,
      [timetableId, classId, KADAR_ID]
    );
    console.log(`Timetable created: ${timetableId} (version 1, effective from today)`);

    // 5) Insert slots: Mon-Fri (1..5) × 5 teaching periods (skip Lunch = index 4).
    //    Each day uses the same subject rotation. Lunch slot is not created.
    const teachingPeriods = periodIds.filter((p) => p.label !== 'Lunch');
    const slotRows = [];
    for (let day = 1; day <= 5; day++) {
      for (let i = 0; i < teachingPeriods.length; i++) {
        const period = teachingPeriods[i];
        const subjectName = SUBJECT_ROTATION[i];
        const subjectId = subjectByName[subjectName];
        slotRows.push({
          id: newId('ts'),
          timetable_id: timetableId,
          institution_code: 'TST001',
          class_section_id: classId,
          subject_id: subjectId,
          teacher_id: KADAR_ID,
          period_id: period.id,
          day_of_week: day,
          room: `Room ${100 + i}`,
        });
      }
    }

    // Bulk insert
    for (const s of slotRows) {
      await client.query(
        `INSERT INTO timetable_slots
           (id, timetable_id, institution_code, class_section_id, subject_id, teacher_id, period_id, day_of_week, room)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [s.id, s.timetable_id, s.institution_code, s.class_section_id, s.subject_id, s.teacher_id, s.period_id, s.day_of_week, s.room]
      );
    }
    console.log(`Inserted ${slotRows.length} timetable slots (5 days × 6 periods, lunch skipped).`);

    // 6) Print the final weekly grid
    const grid = await client.query(
      `SELECT p.label, p.start_time, p.end_time, s.name AS subject_name, u.full_name AS teacher_name, ts.day_of_week, ts.room
       FROM timetable_slots ts
       LEFT JOIN periods p ON p.id = ts.period_id
       LEFT JOIN subjects s ON s.id = ts.subject_id
       LEFT JOIN users u ON u.id = ts.teacher_id
       WHERE ts.class_section_id = $1
       ORDER BY ts.day_of_week, p.sort_order`,
      [classId]
    );
    console.log('\nClass 6 A weekly timetable:');
    console.table(grid.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
