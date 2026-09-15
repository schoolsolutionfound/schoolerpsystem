import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

const CLASS_TEACHER_ID = 'usr_1787066287949_dsdty'; // Kadar (class teacher of 6A)

const NEW_STUDENTS = [
  { first: 'Aarav',  last: 'Khan',     email: 'aarav.student@schoolerp.test' },
  { first: 'Diya',   last: 'Sharma',   email: 'diya.student@schoolerp.test' },
  { first: 'Ishaan', last: 'Verma',    email: 'ishaan.student@schoolerp.test' },
  { first: 'Kavya',  last: 'Iyer',     email: 'kavya.student@schoolerp.test' },
  { first: 'Manav',  last: 'Joshi',    email: 'manav.student@schoolerp.test' },
  { first: 'Neha',   last: 'Reddy',    email: 'neha.student@schoolerp.test' },
  { first: 'Rohit',  last: 'Patel',    email: 'rohit.student@schoolerp.test' },
  { first: 'Saanvi', last: 'Nair',     email: 'saanvi.student@schoolerp.test' },
  { first: 'Vivaan', last: 'Mehta',    email: 'vivaan.student@schoolerp.test' },
];

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function pickStatus(rollSuffix, dayOffset) {
  // Simple deterministic mix so the data is varied but reproducible.
  // Safwan (001) is always present. The 9 new ones cycle through statuses.
  const key = (rollSuffix + dayOffset * 3) % 10;
  if (key < 7) return 'present';
  if (key < 9) return 'late';
  return 'absent';
}

function isoDate(daysAgo) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    // === #3: Add 9 students to Class 6 A ===
    console.log('=== 1) Creating 9 new students in Class 6 A ===');
    const c6 = await client.query(
      `SELECT id, name, department, academic_year, section FROM class_sections
       WHERE institution_code = 'TST001' AND name = 'Class 6 A'`
    );
    if (c6.rows.length === 0) {
      console.log('Class 6 A not found.');
      return;
    }
    const klass = c6.rows[0];

    const createdStudentIds = [];

    // Existing roll numbers in C6A-*
    const existing = await client.query(
      `SELECT roll_no_usn FROM users
       WHERE institution_code = 'TST001' AND role = 'student' AND roll_no_usn LIKE 'C6A-%'`
    );
    const usedRolls = new Set(existing.rows.map((r) => r.roll_no_usn));
    let nextRoll = 2;
    while (usedRolls.has(`C6A-${String(nextRoll).padStart(3, '0')}`)) nextRoll++;

    const scope = {
      department: klass.department,
      academicYear: klass.academic_year,
      section: klass.section,
      classSectionId: klass.id,
      classSectionName: klass.name,
    };

    for (const s of NEW_STUDENTS) {
      const email = s.email;
      const existing2 = await client.query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
        [email]
      );
      if (existing2.rows.length > 0) {
        createdStudentIds.push(existing2.rows[0].id);
        console.log(`  ↻ Reusing existing ${email} → ${existing2.rows[0].id}`);
        continue;
      }
      const id = newId('usr');
      const firebaseUid = `firebase_${id}`;
      const roll = `C6A-${String(nextRoll).padStart(3, '0')}`;
      nextRoll++;
      const fullName = `${s.first} ${s.last}`;
      await client.query(
        `INSERT INTO users
           (id, firebase_uid, email, full_name, role, institution_code, institution_name, institution_type,
            roll_no_usn, must_change_password, profile_completed, scope)
         VALUES ($1, $2, $3, $4, 'student', 'TST001', 'Test School', 'school',
                 $5, false, true, $6::jsonb)`,
        [id, firebaseUid, email, fullName, roll, JSON.stringify(scope)]
      );
      createdStudentIds.push(id);
      console.log(`  ✓ ${fullName} (${roll}) → ${id}`);
    }

    // === Full Class 6 A roster ===
    const roster = await client.query(
      `SELECT id, full_name, roll_no_usn, scope->>'classSectionId' AS class_id
       FROM users
       WHERE institution_code = 'TST001' AND role = 'student' AND scope->>'classSectionId' = $1
       ORDER BY roll_no_usn`,
      [klass.id]
    );
    console.log(`\nClass 6 A roster: ${roster.rows.length} students`);
    console.table(roster.rows.map((r) => ({
      id: r.id.slice(-6),
      full_name: r.full_name,
      roll: r.roll_no_usn,
      class_id: r.class_id === klass.id ? '✓ 6A' : r.class_id,
    })));

    // === #4: Seed 3 days of attendance for Class 6 A ===
    // Pick day 1 (Monday) Math period as the attendance target — Kadar takes it.
    const dayOfWeek = 1; // Monday
    const mathSlot = await client.query(
      `SELECT id, teacher_id, period_id FROM timetable_slots
       WHERE class_section_id = $1 AND day_of_week = $2
         AND subject_id = (SELECT id FROM subjects WHERE name = 'Mathematics' AND institution_code = 'TST001')
       LIMIT 1`,
      [klass.id, dayOfWeek]
    );
    if (mathSlot.rows.length === 0) {
      console.log('No Math slot found for Class 6 A on Monday.');
      return;
    }
    const slot = mathSlot.rows[0];
    console.log(`\n=== 2) Seeding attendance for Mathematics slot ${slot.id} ===`);

    let totalRecords = 0;
    let totalEntries = 0;
    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      const date = isoDate(dayOffset); // today, yesterday, day before
      // Upsert attendance_record (unique on slot+date)
      let recordId;
      const existing = await client.query(
        `SELECT id FROM attendance_records
         WHERE timetable_slot_id = $1 AND date = $2`,
        [slot.id, date]
      );
      if (existing.rows.length > 0) {
        recordId = existing.rows[0].id;
      } else {
        recordId = newId('ar');
        await client.query(
          `INSERT INTO attendance_records
             (id, institution_code, timetable_slot_id, date, taken_by_teacher_id, status, submitted_at)
           VALUES ($1, 'TST001', $2, $3, $4, 'submitted', NOW())`,
          [recordId, slot.id, date, CLASS_TEACHER_ID]
        );
        totalRecords++;
      }

      // Add an entry for every student
      for (let i = 0; i < roster.rows.length; i++) {
        const stu = roster.rows[i];
        const rollNum = parseInt((stu.roll_no_usn || '0').split('-')[1] || '0', 10);
        const status = pickStatus(rollNum, dayOffset);
        const remarks = status === 'absent' ? 'Absent without notice' : status === 'late' ? 'Came in 10 min late' : '';
        const entryId = newId('ae');
        await client.query(
          `INSERT INTO attendance_entries
             (id, attendance_record_id, student_id, attendance_status, remarks)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (attendance_record_id, student_id) DO NOTHING`,
          [entryId, recordId, stu.id, status, remarks]
        );
        totalEntries++;
      }
      console.log(`  ✓ ${date}: attendance_record ${recordId.slice(-6)} with ${roster.rows.length} entries`);
    }

    // === Final verification ===
    console.log('\n=== 3) Attendance summary for Class 6 A Math (Mon) ===');
    const summary = await client.query(
      `SELECT ar.date,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE ae.attendance_status = 'present')::int AS present,
              COUNT(*) FILTER (WHERE ae.attendance_status = 'late')::int AS late,
              COUNT(*) FILTER (WHERE ae.attendance_status = 'absent')::int AS absent
       FROM attendance_records ar
       JOIN attendance_entries ae ON ae.attendance_record_id = ar.id
       JOIN users u ON u.id = ae.student_id
       WHERE u.scope->>'classSectionId' = $1
       GROUP BY ar.date
       ORDER BY ar.date DESC`,
      [klass.id]
    );
    console.table(summary.rows);

    console.log(`\nInserted ${totalRecords} new attendance_records, ${totalEntries} new attendance_entries`);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
