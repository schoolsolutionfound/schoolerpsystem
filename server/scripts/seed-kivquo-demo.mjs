/**
 * KIVQUOSCH01 demo provisioning: one account per role + role data.
 * Idempotent. Run: node scripts/seed-kivquo-demo.mjs
 */
import admin from 'firebase-admin';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const INST = 'KIVQUOSCH01';
const SESSION = 'as_1794054747318_tqmd3';
const PASSWORD = 'Kivquo@2026';
const SCHOOL = 'Kivquo School';
const json = (v) => JSON.stringify(v ?? null);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

async function ensureAuth(email, displayName) {
  try {
    const u = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(u.uid, { password: PASSWORD, displayName, emailVerified: true });
    return u.uid;
  } catch (err) {
    if (err?.code !== 'auth/user-not-found') throw err;
    const u = await admin.auth().createUser({ email, password: PASSWORD, displayName, emailVerified: true });
    return u.uid;
  }
}

async function upsert(client, table, cols, row, conflictCols) {
  const params = [];
  const tuples = [`(${cols.map((c) => { params.push(row[c] === undefined ? null : row[c]); return `$${params.length}`; }).join(', ')})`];
  const quoted = cols.map((c) => `"${c}"`).join(', ');
  let sql = `INSERT INTO ${table} (${quoted}) VALUES ${tuples.join(', ')}`;
  if (conflictCols && conflictCols.length) {
    const keys = conflictCols.map((c) => `"${c}"`).join(', ');
    const sets = cols.filter((c) => !conflictCols.includes(c)).map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ');
    sql += ` ON CONFLICT (${keys}) DO ${sets ? `UPDATE SET ${sets}` : 'NOTHING'}`;
  } else {
    sql += ' ON CONFLICT DO NOTHING';
  }
  await client.query(sql, params);
}

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');

    const users = {
      student: { email: 'studentkivquo@school.com', fullName: 'Aarav Kivquo', role: 'student' },
      teacher: { email: 'teacherkivquo@school.com', fullName: 'Meera Kivquo', role: 'teacher' },
      parent: { email: 'parentkivquo@school.com', fullName: 'Rahul Kivquo', role: 'parent' },
      principal: { email: 'principalkivquo@school.com', fullName: 'Priya Kivquo', role: 'principal' },
      driver: { email: 'driverkivquo@school.com', fullName: 'Suresh Kivquo', role: 'driver' },
      accountant: { email: 'accountantkivquo@school.com', fullName: 'Neha Kivquo', role: 'accountant' },
    };

    for (const [key, u] of Object.entries(users)) {
      u.uid = await ensureAuth(u.email, u.fullName);
      u.id = `usr_kivquo_demo_${key}`;
    }

    const classRows = (await client.query(
      `SELECT id, name, department, academic_year, section FROM class_sections WHERE institution_code = $1`, [INST]
    )).rows;
    const byName = new Map(classRows.map((c) => [c.name, c]));
    const class6A = byName.get('Class 6 A');
    const class5A = byName.get('Class 5 A');
    const class10A = byName.get('Class 10 A');
    if (!class6A || !class5A || !class10A) throw new Error('Expected Class 6 A / 5 A / 10 A');

    const subjectRows = (await client.query(
      `SELECT id, name FROM subjects WHERE institution_code = $1`, [INST]
    )).rows;
    const subj = (name) => {
      const s = subjectRows.find((x) => x.name === name);
      if (!s) throw new Error(`Missing subject: ${name}`);
      return s;
    };
    const periodRows = (await client.query(
      `SELECT id, sort_order FROM periods WHERE institution_code = $1 ORDER BY sort_order`, [INST]
    )).rows;

    const scope = {
      student: {
        classSectionId: class6A.id, classSectionName: class6A.name,
        classDepartment: class6A.department, department: class6A.department,
        academicYear: class6A.academic_year, section: class6A.section,
        rollNoOrUSN: 'KIV-6A-001',
      },
      teacher: { department: 'Mathematics', employeeId: 'EMP-KIV-001', rank: 'assistant_professor', status: 'present' },
      parent: { relation: 'Father', childName: users.student.fullName, institutionCode: INST, schoolName: SCHOOL },
      principal: {},
      driver: { vehicleNumber: 'KA-01-KIV-2026', licenseNumber: 'KA-DL-2026-001' },
      accountant: {},
    };

    for (const u of Object.values(users)) {
      await upsert(client, 'users',
        ['id', 'firebase_uid', 'email', 'full_name', 'role', 'roles', 'institution_code', 'institution_name', 'institution_type',
         'roll_no_usn', 'must_change_password', 'profile_completed', 'email_verified', 'email_verified_at', 'student_phone',
         'parent_phone', 'scope', 'permissions'],
        {
          id: u.id, firebase_uid: u.uid, email: u.email, full_name: u.fullName, role: u.role, roles: json([u.role]),
          institution_code: INST, institution_name: SCHOOL, institution_type: 'school',
          roll_no_usn: u.role === 'student' ? 'KIV-6A-001' : '',
          must_change_password: false, profile_completed: true, email_verified: true,
          email_verified_at: new Date().toISOString(),
          student_phone: '9876500001', parent_phone: u.role === 'student' ? '9876500002' : '',
          scope: json(scope[u.role] || {}), permissions: json([]),
        }, ['id']);
      u.dbId = (await client.query(`SELECT id FROM users WHERE email = $1`, [u.email])).rows[0].id;
    }
    const { student, teacher, parent, principal, driver, accountant } = users;

    // class teacher + subject teachers
    await client.query(
      `UPDATE class_sections SET class_teacher_id = $1, updated_at = NOW() WHERE institution_code = $2 AND id = $3`,
      [teacher.dbId, INST, class6A.id]
    );

    const coreSubjects = ['Mathematics', 'English', 'Science', 'Social Science', 'Computer Science', 'Physical Education'];
    for (const name of coreSubjects) {
      await upsert(client, 'subject_teachers',
        ['id', 'institution_code', 'class_section_id', 'subject_id', 'teacher_id'],
        { id: `kivdemo_st_${name.replace(/\s+/g, '_')}`, institution_code: INST, class_section_id: class6A.id, subject_id: subj(name).id, teacher_id: teacher.dbId },
        ['class_section_id', 'subject_id']);
    }

    // enrollment
    await upsert(client, 'student_classes',
      ['id', 'institution_code', 'student_id', 'class_section_id', 'roll_no', 'academic_year', 'session_id', 'effective_from', 'is_active'],
      { id: 'kivdemo_sc_1', institution_code: INST, student_id: student.dbId, class_section_id: class6A.id, roll_no: 'KIV-6A-001', academic_year: class6A.academic_year, session_id: SESSION, effective_from: '2026-06-01', is_active: true },
      ['id']);

    await upsert(client, 'parent_links',
      ['id', 'institution_code', 'parent_id', 'student_id', 'relationship', 'permissions', 'is_primary', 'is_active'],
      { id: 'kivdemo_pl_1', institution_code: INST, parent_id: parent.dbId, student_id: student.dbId, relationship: 'Father', permissions: json(['attendance', 'marks', 'fees', 'homework']), is_primary: true, is_active: true },
      ['id']);

    // timetable for Class 6 A
    await upsert(client, 'timetables',
      ['id', 'institution_code', 'class_section_id', 'academic_year', 'term', 'version', 'effective_from', 'created_by', 'session_id'],
      { id: 'kivdemo_tt_1', institution_code: INST, class_section_id: class6A.id, academic_year: class6A.academic_year, term: 'Term 1', version: 1, effective_from: '2026-06-01', created_by: principal.uid, session_id: SESSION },
      ['class_section_id', 'version']);

    const slotMeta = [];
    for (let day = 1; day <= 5; day++) {
      for (const p of periodRows) {
        const name = coreSubjects[(Number(p.sort_order) + day - 2) % coreSubjects.length];
        const id = `kivdemo_ts_${day}_${p.sort_order}`;
        await upsert(client, 'timetable_slots',
          ['id', 'timetable_id', 'institution_code', 'class_section_id', 'subject_id', 'teacher_id', 'period_id', 'day_of_week', 'room'],
          { id, timetable_id: 'kivdemo_tt_1', institution_code: INST, class_section_id: class6A.id, subject_id: subj(name).id, teacher_id: teacher.dbId, period_id: p.id, day_of_week: day, room: `6A-${p.sort_order}` },
          ['timetable_id', 'day_of_week', 'period_id']);
        slotMeta.push({ id, day });
      }
    }

    // attendance (5 recent school days)
    const dates = ['2026-10-28', '2026-10-29', '2026-10-30', '2026-11-02', '2026-11-03'];
    for (const dateStr of dates) {
      const utcDay = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
      const daySlots = slotMeta.filter((s) => s.day === utcDay);
      let i = 0;
      for (const slot of daySlots) {
        const rid = `kivdemo_ar_${dateStr.replace(/-/g, '')}_${i}`;
        const absent = (dateStr === '2026-10-29' && i === 0) || (dateStr === '2026-11-02' && i === 2);
        const late = dateStr === '2026-11-03' && i === 1;
        await upsert(client, 'attendance_records',
          ['id', 'institution_code', 'timetable_slot_id', 'date', 'taken_by_teacher_id', 'status', 'submitted_at'],
          { id: rid, institution_code: INST, timetable_slot_id: slot.id, date: dateStr, taken_by_teacher_id: teacher.dbId, status: 'submitted', submitted_at: new Date(`${dateStr}T10:00:00Z`).toISOString() },
          ['timetable_slot_id', 'date']);
        await upsert(client, 'attendance_entries',
          ['id', 'attendance_record_id', 'student_id', 'attendance_status', 'remarks'],
          { id: `kivdemo_ae_${dateStr.replace(/-/g, '')}_${i}`, attendance_record_id: rid, student_id: student.dbId, attendance_status: absent ? 'absent' : late ? 'late' : 'present', remarks: absent ? 'Absent - informed' : late ? 'Late by 10 min' : '' },
          ['attendance_record_id', 'student_id']);
        i++;
      }
    }

    // exam + marks
    await upsert(client, 'exams',
      ['id', 'institution_code', 'name', 'term', 'academic_year', 'session_id', 'start_date', 'end_date', 'status', 'created_by'],
      { id: 'kivdemo_ex_1', institution_code: INST, name: 'Mid-Term Examination', term: 'Term 1', academic_year: class6A.department, session_id: SESSION, start_date: '2026-10-15', end_date: '2026-10-24', status: 'published', created_by: principal.uid },
      ['id']);

    const scores = { Mathematics: 92, English: 88, Science: 95, 'Social Science': 84, 'Computer Science': 90, 'Physical Education': 96 };
    const grade = (n) => (n >= 91 ? 'A1' : n >= 81 ? 'A2' : n >= 71 ? 'B1' : n >= 61 ? 'B2' : 'C1');
    for (const name of coreSubjects) {
      const esId = `kivdemo_es_${name.replace(/\s+/g, '_')}`;
      await upsert(client, 'exam_subjects',
        ['id', 'exam_id', 'institution_code', 'subject_id', 'max_marks', 'pass_marks'],
        { id: esId, exam_id: 'kivdemo_ex_1', institution_code: INST, subject_id: subj(name).id, max_marks: 100, pass_marks: 35 },
        ['exam_id', 'subject_id']);
      await upsert(client, 'marks',
        ['id', 'exam_id', 'exam_subject_id', 'institution_code', 'student_id', 'class_section_id', 'subject_id', 'marks_obtained', 'grade', 'remarks', 'entered_by', 'entered_at'],
        { id: `kivdemo_mk_${name.replace(/\s+/g, '_')}`, exam_id: 'kivdemo_ex_1', exam_subject_id: esId, institution_code: INST, student_id: student.dbId, class_section_id: class6A.id, subject_id: subj(name).id, marks_obtained: scores[name], grade: grade(scores[name]), remarks: '', entered_by: teacher.uid, entered_at: new Date('2026-10-27T09:00:00Z').toISOString() },
        ['exam_subject_id', 'student_id']);
    }

    // homework
    const hw = [
      ['kivdemo_hw_1', 'Mathematics', 'Algebra worksheet 3', 'Solve exercises 4.1-4.5 in the workbook.', '2026-11-06', '2026-11-03', 'normal'],
      ['kivdemo_hw_2', 'Science', 'Photosynthesis diagram', 'Draw and label the process of photosynthesis.', '2026-11-07', '2026-11-04', 'high'],
      ['kivdemo_hw_3', 'English', 'Essay: My favourite festival', 'Write 250 words about your favourite festival.', '2026-11-10', '2026-11-04', 'normal'],
    ];
    for (const [id, subject, title, description, due, assigned, priority] of hw) {
      await upsert(client, 'homework',
        ['id', 'institution_code', 'class_section_id', 'subject_id', 'teacher_id', 'title', 'description', 'due_date', 'assigned_date', 'priority', 'status', 'attachments', 'created_by'],
        { id, institution_code: INST, class_section_id: class6A.id, subject_id: subj(subject).id, teacher_id: teacher.uid, title, description, due_date: due, assigned_date: assigned, priority, status: 'active', attachments: json([]), created_by: teacher.uid },
        ['id']);
    }

    // fees
    const fee1 = 'kivdemo_fs_tuition';
    const fee2 = 'kivdemo_fs_transport';
    await upsert(client, 'fee_structures',
      ['id', 'institution_code', 'class_section_id', 'title', 'category', 'amount', 'term', 'academic_year', 'due_date', 'status', 'created_by'],
      { id: fee1, institution_code: INST, class_section_id: class6A.id, title: 'Tuition Fee - Term 1', category: 'student_fee', amount: 5000, term: 'Term 1', academic_year: class6A.department, due_date: '2026-11-30', status: 'active', created_by: accountant.dbId },
      ['id']);
    await upsert(client, 'fee_structures',
      ['id', 'institution_code', 'class_section_id', 'title', 'category', 'amount', 'term', 'academic_year', 'due_date', 'status', 'created_by'],
      { id: fee2, institution_code: INST, class_section_id: class6A.id, title: 'Transport Fee - Term 1', category: 'transport_fee', amount: 1200, term: 'Term 1', academic_year: class6A.department, due_date: '2026-11-30', status: 'active', created_by: accountant.dbId },
      ['id']);
    await upsert(client, 'fee_payments',
      ['id', 'institution_code', 'fee_structure_id', 'student_id', 'amount', 'payment_method', 'payment_date', 'status', 'receipt_no', 'notes', 'created_by'],
      { id: 'kivdemo_fp_1', institution_code: INST, fee_structure_id: fee1, student_id: student.dbId, amount: 5000, payment_method: 'cash', payment_date: '2026-11-02', status: 'paid', receipt_no: 'RCPT-KIV-0001', notes: 'Demo payment', created_by: accountant.dbId },
      ['id']);

    // transport
    await upsert(client, 'bus_vehicles',
      ['id', 'institution_code', 'registration_no', 'capacity', 'status'],
      { id: 'kivdemo_bus_1', institution_code: INST, registration_no: 'KA-01-KIV-2026', capacity: 40, status: 'active' },
      ['id']);
    await upsert(client, 'bus_routes',
      ['id', 'institution_code', 'name', 'vehicle_id', 'driver_id'],
      { id: 'kivdemo_route_1', institution_code: INST, name: 'Kivquo City Route', vehicle_id: 'kivdemo_bus_1', driver_id: driver.dbId },
      ['id']);
    const stops = [
      ['kivdemo_bs_1', 'School Gate', 12.9716, 77.5946, 1],
      ['kivdemo_bs_2', 'MG Road', 12.9756, 77.6068, 2],
      ['kivdemo_bs_3', 'Indiranagar', 12.9784, 77.6408, 3],
    ];
    for (const [id, name, lat, lng, seq] of stops) {
      await upsert(client, 'bus_stops',
        ['id', 'institution_code', 'route_id', 'name', 'latitude', 'longitude', 'sequence'],
        { id, institution_code: INST, route_id: 'kivdemo_route_1', name, latitude: lat, longitude: lng, sequence: seq },
        ['id']);
    }
    await upsert(client, 'student_transport',
      ['id', 'institution_code', 'student_id', 'route_id', 'stop_id', 'is_active'],
      { id: 'kivdemo_stu_tr_1', institution_code: INST, student_id: student.dbId, route_id: 'kivdemo_route_1', stop_id: 'kivdemo_bs_2', is_active: true },
      ['student_id', 'route_id']);
    await upsert(client, 'bus_trips',
      ['id', 'institution_code', 'route_id', 'driver_id', 'trip_type', 'status', 'started_at', 'ended_at'],
      { id: 'kivdemo_bt_1', institution_code: INST, route_id: 'kivdemo_route_1', driver_id: driver.dbId, trip_type: 'pickup', status: 'completed', started_at: new Date('2026-11-03T07:30:00Z').toISOString(), ended_at: new Date('2026-11-03T08:15:00Z').toISOString() },
      ['id']);

    // notices + announcements
    const notices = [
      ['kivdemo_sn_1', 'Annual Sports Day', 'Annual Sports Day will be held on 21 November 2026 at the main ground. All students must report by 8:00 AM.', 'all', '', 'important'],
      ['kivdemo_sn_2', 'Parent-Teacher Meeting', 'PTM for Grades 5-10 is scheduled on 15 November 2026, 10:00 AM-1:00 PM. Parents are requested to attend.', 'parents', '', 'urgent'],
      ['kivdemo_sn_3', 'Science Lab Safety Rules', 'Students of Grade 6 must carry lab coats for all Science practicals starting next week.', 'students', 'Science', 'normal'],
    ];
    for (const [id, title, content, audience, department, priority] of notices) {
      await upsert(client, 'school_notices',
        ['id', 'institution_code', 'title', 'content', 'target_audience', 'department', 'priority', 'author_id', 'author_name', 'author_role', 'created_at'],
        { id, institution_code: INST, title, content, target_audience: audience, department, priority, author_id: principal.uid, author_name: principal.fullName, author_role: 'principal', created_at: new Date('2026-11-01T05:00:00Z').toISOString() },
        ['id']);
    }
    const anns = [
      ['kivdemo_ann_1', 'Welcome to Term 2', 'Term 2 begins on 5 November. Check your timetable and homework for updates.', 'NOTICE', 'NORMAL', 'PUBLISHED', '2026-11-01T05:00:00Z', '2026-11-30T05:00:00Z'],
      ['kivdemo_ann_2', 'Unit Test Schedule', 'Unit Test 2 for Grades 6-10 runs from 24 to 28 November. The detailed schedule is on the notice board.', 'ACADEMIC', 'HIGH', 'PUBLISHED', '2026-11-02T05:00:00Z', null],
    ];
    for (const [id, title, content, type, priority, status, publish, expires] of anns) {
      await upsert(client, 'announcements',
        ['id', 'institution_code', 'title', 'content', 'type', 'priority', 'status', 'created_by', 'publish_at', 'expires_at'],
        { id, institution_code: INST, title, content, type, priority, status, created_by: principal.uid, publish_at: new Date(publish).toISOString(), expires_at: expires ? new Date(expires).toISOString() : null },
        ['id']);
      await upsert(client, 'announcement_targets',
        ['id', 'announcement_id', 'target_type', 'target_role', 'class_id', 'section_id'],
        { id: `${id}_t`, announcement_id: id, target_type: 'all', target_role: 'all', class_id: '', section_id: '' },
        ['id']);
    }

    // notifications
    const roleMsg = {
      student: ['Homework assigned', 'Algebra worksheet 3 is due on 6 November.', 'homework'],
      teacher: ['Timetable published', 'Your Term 1 timetable is now available.', 'general'],
      parent: ['Parent-Teacher Meeting', 'PTM is on 15 November, 10:00 AM-1:00 PM.', 'announcement'],
      principal: ['Announcement published', 'Welcome to Term 2 is live for everyone.', 'announcement'],
      driver: ['Route assigned', 'You are assigned to Kivquo City Route.', 'general'],
      accountant: ['Pending expense', 'Transport fee collection is pending for Class 6 A.', 'fee'],
    };
    let n = 0;
    for (const u of Object.values(users)) {
      const [title, body, type] = roleMsg[u.role];
      for (const [suffix, t, b, ty] of [['w', 'Welcome to Kivquo', 'Your Kivquo School account is fully set up.', 'general'], ['r', title, body, type]]) {
        await upsert(client, 'notifications',
          ['id', 'institution_code', 'recipient_id', 'title', 'body', 'type', 'priority', 'channel', 'data', 'status', 'read_at', 'sent_at'],
          { id: `kivdemo_ntf_${++n}_${suffix}`, institution_code: INST, recipient_id: u.uid, title: t, body: b, type: ty, priority: 'normal', channel: 'in_app', data: json({}), status: 'sent', read_at: null, sent_at: new Date('2026-11-01T05:00:00Z').toISOString() },
          ['id']);
      }
    }

    await client.query('COMMIT');
    console.log('KIVQUOSCH01 demo data seeded.');
    console.log('Accounts (password: %s):', PASSWORD);
    for (const u of Object.values(users)) console.log(` - ${u.role.padEnd(10)} ${u.email}`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
