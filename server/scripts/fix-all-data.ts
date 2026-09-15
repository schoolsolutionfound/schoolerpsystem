import 'dotenv/config';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

const INST = 'TST001';

async function main() {
  if (!db) { console.log('No DB connected'); return; }

  console.log('========== FIXING ALL ISSUES ==========\n');

  // 1. Sync student rollNoUsn from student_classes to users table
  console.log('[1] Syncing student rollNoUsn...');
  const sc = await db.select().from(schema.studentClasses);
  let synced = 0;
  for (const enrollment of sc) {
    if (enrollment.rollNo) {
      await db.update(schema.users)
        .set({ rollNoOrUSN: enrollment.rollNo })
        .where(eq(schema.users.id, enrollment.studentId));
      synced++;
    }
  }
  console.log(`  Synced ${synced} student roll numbers\n`);

  // 2. Assign class teachers to classes without one
  console.log('[2] Assigning class teachers...');
  const classes = await db.select().from(schema.classSections).where(eq(schema.classSections.institutionCode, INST));
  const teachers = await db.select().from(schema.users).where(eq(schema.users.role, 'teacher'));
  const teacherIds = teachers.map(t => t.id!);

  let assigned = 0;
  let tIdx = 0;
  for (const cls of classes) {
    if (!cls.classTeacherId && teacherIds.length > 0) {
      const teacherId = teacherIds[tIdx % teacherIds.length];
      await db.update(schema.classSections)
        .set({ classTeacherId: teacherId })
        .where(eq(schema.classSections.id, cls.id));
      assigned++;
      tIdx++;
    }
  }
  console.log(`  Assigned class teachers to ${assigned} classes\n`);

  // 3. Create timetables for classes that don't have one
  console.log('[3] Creating timetables...');
  const existingTimetables = await db.select().from(schema.timetables);
  const existingClassIds = new Set(existingTimetables.map(t => t.classSectionId));
  const allClasses = await db.select().from(schema.classSections).where(eq(schema.classSections.institutionCode, INST));
  const allPeriods = await db.select().from(schema.periods).orderBy(schema.periods.sortOrder);
  const allSubjects = await db.select().from(schema.subjects).where(eq(schema.subjects.institutionCode, INST));
  const allSubjectTeachers = await db.select().from(schema.subjectTeachers).where(eq(schema.subjectTeachers.institutionCode, INST));

  let ttCreated = 0;
  for (const cls of allClasses) {
    if (existingClassIds.has(cls.id)) continue;

    const clsTeachers = allSubjectTeachers.filter(st => st.classSectionId === cls.id);
    if (clsTeachers.length === 0) continue;

    const now = new Date();
    const ttId = `tt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await db.insert(schema.timetables).values({
      id: ttId,
      institutionCode: INST,
      classSectionId: cls.id,
      academicYear: '2026-2027',
      term: 'Term 1',
      version: 1,
      effectiveFrom: now.toISOString().split('T')[0],
      createdBy: teacherIds[0] || '',
      createdAt: now,
      updatedAt: now,
    });

    const slotsToInsert: any[] = [];
    for (let day = 1; day <= 5; day++) {
      for (let pIdx = 0; pIdx < Math.min(allPeriods.length, clsTeachers.length); pIdx++) {
        const st = clsTeachers[pIdx];
        slotsToInsert.push({
          id: `ts_${ttId.slice(-6)}_${day}_${pIdx}`,
          timetableId: ttId,
          institutionCode: INST,
          classSectionId: cls.id,
          subjectId: st.subjectId,
          teacherId: st.teacherId,
          periodId: allPeriods[pIdx].id,
          dayOfWeek: day,
          room: `${cls.name?.replace(/\s/g, '')}-${pIdx + 1}`,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (slotsToInsert.length > 0) {
      for (let i = 0; i < slotsToInsert.length; i += 20) {
        await db.insert(schema.timetableSlots).values(slotsToInsert.slice(i, i + 20));
      }
    }
    ttCreated++;
  }
  console.log(`  Created ${ttCreated} timetables\n`);

  // 4. Create exams
  console.log('[4] Creating exams...');
  const existingExams = await db.select().from(schema.exams).where(eq(schema.exams.institutionCode, INST));
  const examNames = new Set(existingExams.map(e => e.name));

  const examData = [
    { name: 'Unit Test 1', term: 'Term 1', status: 'published' },
    { name: 'Mid-Term Exam', term: 'Term 1', status: 'draft' },
    { name: 'Unit Test 2', term: 'Term 2', status: 'draft' },
  ];

  for (const e of examData) {
    if (examNames.has(e.name)) continue;
    const examId = `exam_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(schema.exams).values({
      id: examId,
      institutionCode: INST,
      name: e.name,
      term: e.term,
      status: e.status,
      createdBy: teacherIds[0] || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    for (const sub of allSubjects) {
      await db.insert(schema.examSubjects).values({
        id: `es_${examId.slice(-6)}_${sub.id.slice(-4)}`,
        examId,
        institutionCode: INST,
        subjectId: sub.id,
        maxMarks: 100,
        passMarks: 35,
        createdAt: new Date(),
      });
    }
  }
  const finalExams = await db.select().from(schema.exams).where(eq(schema.exams.institutionCode, INST));
  console.log(`  ${finalExams.length} exams total\n`);

  // 5. Create marks for all students in Class 6 A for all exams
  console.log('[5] Creating marks...');
  const class6A = classes.find(c => c.name === 'Class 6 A');
  if (class6A) {
    const students6A = sc.filter(e => e.classSectionId === class6A.id);
    const allExamSubjects = await db.select().from(schema.examSubjects);

    let marksCreated = 0;
    for (const exam of finalExams) {
      const examSubs = allExamSubjects.filter(es => es.examId === exam.id);
      for (const es of examSubs) {
        for (const enrollment of students6A) {
          const existing = await db.select().from(schema.marks).where(
            and(
              eq(schema.marks.examSubjectId, es.id),
              eq(schema.marks.studentId, enrollment.studentId)
            )
          );
          if (existing.length === 0) {
            const obtained = Math.floor(Math.random() * 40) + 60;
            await db.insert(schema.marks).values({
              id: `mk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              examId: exam.id,
              examSubjectId: es.id,
              institutionCode: INST,
              studentId: enrollment.studentId,
              classSectionId: class6A.id,
              subjectId: es.subjectId,
              marksObtained: obtained,
              grade: obtained >= 90 ? 'A+' : obtained >= 80 ? 'A' : obtained >= 70 ? 'B+' : obtained >= 60 ? 'B' : 'C',
              enteredBy: teacherIds[0] || '',
              enteredAt: new Date(),
              updatedAt: new Date(),
            });
            marksCreated++;
          }
        }
      }
    }
    console.log(`  Created ${marksCreated} marks\n`);
  }

  // 6. Create attendance records for last 5 weekdays
  console.log('[6] Creating attendance records...');
  const class6ASlots = (await db.select().from(schema.timetableSlots))
    .filter(s => s.classSectionId === class6A?.id);
  const students6AIds = sc.filter(e => e.classSectionId === class6A?.id).map(e => e.studentId);

  let attEntriesCreated = 0;
  const today = new Date();
  for (let d = 1; d <= 7; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dateStr = date.toISOString().split('T')[0];

    for (const slot of class6ASlots.slice(0, 3)) {
      const existing = await db.select().from(schema.attendanceRecords).where(
        and(
          eq(schema.attendanceRecords.timetableSlotId, slot.id),
          eq(schema.attendanceRecords.date, dateStr)
        )
      );
      if (existing.length > 0) continue;

      const recordId = `ar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db.insert(schema.attendanceRecords).values({
        id: recordId,
        institutionCode: INST,
        timetableSlotId: slot.id,
        date: dateStr,
        takenByTeacherId: slot.teacherId,
        status: 'submitted',
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      for (const studentId of students6AIds) {
        const status = Math.random() > 0.15 ? 'present' : Math.random() > 0.5 ? 'absent' : 'late';
        await db.insert(schema.attendanceEntries).values({
          id: `ae_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          attendanceRecordId: recordId,
          studentId,
          attendanceStatus: status,
          remarks: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        attEntriesCreated++;
      }
    }
  }
  console.log(`  Created ${attEntriesCreated} attendance entries\n`);

  // 7. Create homework
  console.log('[7] Creating homework...');
  if (class6A) {
    const homeworkData = [
      { title: 'Mathematics Worksheet - Fractions', description: 'Complete exercises 1-15 from Chapter 3. Show all working.', subjectIdx: 0, priority: 'high', dueDays: 3 },
      { title: 'English Essay Writing', description: 'Write a 300-word essay on "My Favorite Festival".', subjectIdx: 1, priority: 'medium', dueDays: 5 },
      { title: 'Science Lab Report', description: 'Write observations for the photosynthesis experiment.', subjectIdx: 2, priority: 'high', dueDays: 2 },
      { title: 'Social Studies Map Work', description: 'Label all states and capitals on the blank map.', subjectIdx: 3, priority: 'low', dueDays: 7 },
      { title: 'Computer Science - HTML Project', description: 'Create a personal webpage using HTML.', subjectIdx: 4, priority: 'medium', dueDays: 4 },
    ];

    let hwCreated = 0;
    for (const hw of homeworkData) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + hw.dueDays);
      await db.insert(schema.homework).values({
        id: `hw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        institutionCode: INST,
        classSectionId: class6A.id,
        subjectId: allSubjects[hw.subjectIdx]?.id,
        teacherId: teacherIds[0] || '',
        title: hw.title,
        description: hw.description,
        dueDate: dueDate.toISOString().split('T')[0],
        priority: hw.priority,
        status: 'active',
        assignedTo: 'class',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      hwCreated++;
    }
    console.log(`  Created ${hwCreated} homework assignments\n`);
  }

  // 8. Create parent accounts for students without parents
  console.log('[8] Creating parent accounts...');
  const existingParents = await db.select().from(schema.users).where(eq(schema.users.role, 'parent'));
  const allStudentIds = sc.map(e => e.studentId);

  let parentsCreated = 0;
  for (const studentId of allStudentIds) {
    const hasParent = existingParents.some(p => {
      const scope = typeof p.scope === 'string' ? JSON.parse(p.scope || '{}') : (p.scope || {});
      return scope.studentIds?.includes(studentId);
    });
    if (hasParent) continue;

    const student = (await db.select().from(schema.users).where(eq(schema.users.id, studentId)))[0];
    if (!student) continue;
    const enrollment = sc.find(e => e.studentId === studentId);
    if (!enrollment) continue;

    const parentId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(schema.users).values({
      id: parentId,
      firebaseUid: `parent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email: `parent.${student.fullName?.split(' ')[0]?.toLowerCase()}@schoolerp.test`,
      fullName: `Parent of ${student.fullName}`,
      role: 'parent',
      institutionCode: INST,
      institutionName: 'Test School',
      parentPhone: `+91-98765${String(parentsCreated + 10).padStart(5, '0')}`,
      mustChangePassword: false,
      profileCompleted: true,
      scope: JSON.stringify({
        relation: 'Parent',
        studentIds: [studentId],
        studentNames: [student.fullName],
        linkedStudentUSN: enrollment.rollNo,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    parentsCreated++;
    existingParents.push({ id: parentId } as any); // Track to avoid duplicates
  }
  console.log(`  Created ${parentsCreated} parent accounts\n`);

  console.log('========== ALL FIXES APPLIED ==========');
}

main().catch(console.error);
