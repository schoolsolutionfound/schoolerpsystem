import 'dotenv/config';
import { db } from '../src/modules/shared/db/index.js';
import { users, institutions, classSections, subjects, subjectTeachers, periods, timetables, timetableSlots, attendanceRecords, attendanceEntries, studentClasses, exams, examSubjects, marks, studentDocuments, homework } from '../src/modules/shared/db/schema.js';
import { eq, sql, count } from 'drizzle-orm';

async function main() {
  if (!db) { console.log('No DB connected'); return; }

  console.log('========== DEEP SYSTEM ANALYSIS ==========\n');

  // 1. Institutions
  const insts = await db.select().from(institutions);
  console.log(`[INSTITUTIONS] ${insts.length} found`);
  for (const i of insts) {
    console.log(`  - ${i.institutionCode}: ${i.institutionName} (${i.institutionType}) | Status: ${i.subscriptionStatus}`);
  }

  // 2. Users by role
  const allUsers = await db.select().from(users);
  const byRole: Record<string, number> = {};
  for (const u of allUsers) {
    byRole[u.role] = (byRole[u.role] || 0) + 1;
  }
  console.log(`\n[USERS] ${allUsers.length} total`);
  for (const [role, count] of Object.entries(byRole)) {
    console.log(`  - ${role}: ${count}`);
  }

  // 3. Check admin users
  const admins = allUsers.filter(u => u.role === 'admin');
  console.log(`\n[ADMINS] ${admins.length}`);
  for (const a of admins) {
    console.log(`  - ${a.fullName} (${a.email}) | instCode: ${a.institutionCode} | uid: ${a.firebaseUid}`);
  }

  // 4. Class Sections
  const classes = await db.select().from(classSections);
  console.log(`\n[CLASS SECTIONS] ${classes.length}`);
  for (const c of classes) {
    const teacher = allUsers.find(u => u.id === c.classTeacherId);
    console.log(`  - ${c.name} (${c.id}) | teacher: ${teacher ? teacher.fullName : 'NONE'} | dept: ${c.department} | year: ${c.academicYear}`);
  }

  // 5. Subjects
  const subs = await db.select().from(subjects);
  console.log(`\n[SUBJECTS] ${subs.length}`);
  for (const s of subs) {
    console.log(`  - ${s.name} (${s.code}) | inst: ${s.institutionCode}`);
  }

  // 6. Subject Teachers
  const st = await db.select().from(subjectTeachers);
  console.log(`\n[SUBJECT TEACHERS] ${st.length}`);
  for (const s of st) {
    const teacher = allUsers.find(u => u.id === s.teacherId);
    const cls = classes.find(c => c.id === s.classSectionId);
    const sub = subs.find(su => su.id === s.subjectId);
    console.log(`  - Teacher: ${teacher?.fullName || 'UNKNOWN'} | Class: ${cls?.name || 'UNKNOWN'} | Subject: ${sub?.name || 'UNKNOWN'}`);
  }

  // 7. Teachers without class teacher assignment
  const teachers = allUsers.filter(u => u.role === 'teacher');
  const classTeacherIds = classes.map(c => c.classTeacherId).filter(Boolean);
  const unassignedTeachers = teachers.filter(t => !classTeacherIds.includes(t.id!));
  console.log(`\n[TEACHERS WITHOUT CLASS] ${unassignedTeachers.length}`);
  for (const t of unassignedTeachers) {
    const assignedSubjects = st.filter(s => s.teacherId === t.id);
    console.log(`  - ${t.fullName} (${t.email}) | assigned to ${assignedSubjects.length} class-subject pairs`);
  }

  // 8. Students
  const students = allUsers.filter(u => u.role === 'student');
  console.log(`\n[STUDENTS] ${students.length}`);
  const sc = await db.select().from(studentClasses);
  console.log(`[STUDENT CLASSES] ${sc.length} enrollments`);
  for (const s of students) {
    const enrollment = sc.find(e => e.studentId === s.id);
    const cls = enrollment ? classes.find(c => c.id === enrollment.classSectionId) : null;
    console.log(`  - ${s.fullName} (${s.email}) | USN: ${s.rollNoUsn} | class: ${cls?.name || 'NOT ENROLLED'} | inst: ${s.institutionCode}`);
  }

  // 9. Parents
  const parents = allUsers.filter(u => u.role === 'parent');
  console.log(`\n[PARENTS] ${parents.length}`);
  for (const p of parents) {
    const scope = typeof p.scope === 'string' ? JSON.parse(p.scope || '{}') : (p.scope || {});
    console.log(`  - ${p.fullName} (${p.email}) | linkedStudentUSN: ${scope.linkedStudentUSN || 'NONE'} | phone: ${p.parentPhone}`);
  }

  // 10. Periods
  const per = await db.select().from(periods);
  console.log(`\n[PERIODS] ${per.length}`);
  for (const p of per) {
    console.log(`  - ${p.label}: ${p.startTime}-${p.endTime} | order: ${p.sortOrder}`);
  }

  // 11. Timetables
  const tt = await db.select().from(timetables);
  console.log(`\n[TIMETABLES] ${tt.length}`);

  // 12. Timetable Slots
  const tts = await db.select().from(timetableSlots);
  console.log(`[TIMETABLE SLOTS] ${tts.length}`);
  for (const t of tts) {
    const cls = classes.find(c => c.id === t.classSectionId);
    const sub = subs.find(s => s.id === t.subjectId);
    const teacher = allUsers.find(u => u.id === t.teacherId);
    const period = per.find(p => p.id === t.periodId);
    console.log(`  - ${cls?.name || '?'} | ${sub?.name || '?'} | ${teacher?.fullName || '?'} | ${period?.label || '?'} | day: ${t.dayOfWeek}`);
  }

  // 13. Exams
  const ex = await db.select().from(exams);
  console.log(`\n[EXAMS] ${ex.length}`);
  for (const e of ex) {
    console.log(`  - ${e.name} | term: ${e.term} | status: ${e.status} | inst: ${e.institutionCode}`);
  }

  // 14. Exam Subjects
  const es = await db.select().from(examSubjects);
  console.log(`[EXAM SUBJECTS] ${es.length}`);

  // 15. Marks
  const mk = await db.select().from(marks);
  console.log(`[MARKS] ${mk.length}`);

  // 16. Attendance Records
  const ar = await db.select().from(attendanceRecords);
  console.log(`\n[ATTENDANCE RECORDS] ${ar.length}`);

  // 17. Attendance Entries
  const ae = await db.select().from(attendanceEntries);
  console.log(`[ATTENDANCE ENTRIES] ${ae.length}`);

  // 18. Homework
  try {
    const hw = await db.select().from(homework);
    console.log(`\n[HOMEWORK] ${hw.length}`);
  } catch {
    console.log(`\n[HOMEWORK] table may not exist`);
  }

  // 19. Student Documents
  const sd = await db.select().from(studentDocuments);
  console.log(`[STUDENT DOCUMENTS] ${sd.length}`);

  // 20. CRITICAL ISSUES
  console.log('\n========== CRITICAL ISSUES ==========');

  const issues: string[] = [];

  // Check: Students without enrollment
  const unenrolled = students.filter(s => !sc.find(e => e.studentId === s.id));
  if (unenrolled.length > 0) issues.push(`${unenrolled.length} students NOT enrolled in any class`);

  // Check: Classes without class teacher
  const noTeacher = classes.filter(c => !c.classTeacherId);
  if (noTeacher.length > 0) issues.push(`${noTeacher.length} classes WITHOUT class teacher`);

  // Check: No subjects
  if (subs.length === 0) issues.push('NO SUBJECTS exist');

  // Check: No subject-teacher assignments
  if (st.length === 0) issues.push('NO subject-teacher assignments exist');

  // Check: No periods
  if (per.length === 0) issues.push('NO PERIODS exist');

  // Check: No timetable
  if (tt.length === 0) issues.push('NO TIMETABLES exist');

  // Check: No timetable slots
  if (tts.length === 0) issues.push('NO TIMETABLE SLOTS exist');

  // Check: No exams
  if (ex.length === 0) issues.push('NO EXAMS exist');

  // Check: No attendance records
  if (ar.length === 0) issues.push('NO ATTENDANCE RECORDS exist');

  // Check: Parents without linked students
  const orphanParents = parents.filter(p => {
    const scope = typeof p.scope === 'string' ? JSON.parse(p.scope || '{}') : (p.scope || {});
    return !scope.linkedStudentUSN;
  });
  if (orphanParents.length > 0) issues.push(`${orphanParents.length} parents WITHOUT linked student`);

  // Check: Students on wrong institution
  const wrongInst = students.filter(s => s.institutionCode !== 'TST001');
  if (wrongInst.length > 0) issues.push(`${wrongInst.length} students on wrong institution: ${[...new Set(wrongInst.map(s => s.institutionCode))]}`);

  // Check: Teachers on wrong institution
  const wrongInstTeachers = teachers.filter(t => t.institutionCode !== 'TST001');
  if (wrongInstTeachers.length > 0) issues.push(`${wrongInstTeachers.length} teachers on wrong institution: ${[...new Set(wrongInstTeachers.map(t => t.institutionCode))]}`);

  for (const issue of issues) {
    console.log(`  ❌ ${issue}`);
  }
  if (issues.length === 0) {
    console.log('  ✅ No critical issues found');
  }

  console.log('\n========== DONE ==========');
}

main().catch(console.error);
