import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import * as schema from '../modules/shared/db/schema.js';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/schoolerp';
const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema });

const STUDENT_NAME = 'Safwan Haneef';
const SUBJECT_NAME = 'Mathematics';
const MARKS_OBTAINED = 45;
const MAX_MARKS = 50;
const PASS_MARKS = 20;
const EXAM_NAME = 'Unit Test 1';
const INSTITUTION_CODE = ''; // empty = first institution found

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

async function main() {
  console.log('--- Seed Marks Script ---\n');

  // 1. Find student
  const students = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.role, 'student'));

  const student = students.find(
    (s) => s.fullName.toLowerCase().includes(STUDENT_NAME.toLowerCase())
  );
  if (!student) {
    console.error(`Student "${STUDENT_NAME}" not found. Available students:`);
    students.forEach((s) => console.log(`  - ${s.fullName} (${s.id})`));
    await client.end();
    process.exit(1);
  }
  console.log(`Student: ${student.fullName} (${student.id})`);

  // 2. Find student's class
  const scRows = await db
    .select()
    .from(schema.studentClasses)
    .where(eq(schema.studentClasses.studentId, student.id));

  const activeClass = scRows.find((r) => r.isActive);
  if (!activeClass) {
    console.error('No active class found for student.');
    await client.end();
    process.exit(1);
  }
  console.log(`Class Section ID: ${activeClass.classSectionId}`);

  // 3. Find subject
  const subjects = await db.select().from(schema.subjects);
  const subject = subjects.find(
    (s) => s.name.toLowerCase().includes(SUBJECT_NAME.toLowerCase())
  );
  if (!subject) {
    console.error(`Subject "${SUBJECT_NAME}" not found. Available:`);
    subjects.forEach((s) => console.log(`  - ${s.name} (${s.id})`));
    await client.end();
    process.exit(1);
  }
  console.log(`Subject: ${subject.name} (${subject.id})`);

  // 4. Find or create exam
  const exams = await db.select().from(schema.exams);
  let exam = exams.find(
    (e) => e.name.toLowerCase().includes(EXAM_NAME.toLowerCase())
  );
  if (!exam) {
    const examId = id('ex');
    const now = new Date();
    const rows = await db
      .insert(schema.exams)
      .values({
        id: examId,
        institutionCode: student.institutionCode || '',
        name: EXAM_NAME,
        term: 'Term 1',
        academicYear: '2026-2027',
        status: 'published',
        createdBy: student.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    exam = rows[0];
    console.log(`Created exam: ${exam.name} (${exam.id})`);
  } else {
    console.log(`Found exam: ${exam.name} (${exam.id}) [status=${exam.status}]`);
  }

  // 5. Find or create examSubject
  const examSubjects = await db
    .select()
    .from(schema.examSubjects)
    .where(eq(schema.examSubjects.examId, exam.id));

  let examSubject = examSubjects.find((es) => es.subjectId === subject.id);
  if (!examSubject) {
    const esId = id('es');
    const rows = await db
      .insert(schema.examSubjects)
      .values({
        id: esId,
        examId: exam.id,
        institutionCode: student.institutionCode || '',
        subjectId: subject.id,
        maxMarks: MAX_MARKS,
        passMarks: PASS_MARKS,
        createdAt: new Date(),
      })
      .returning();
    examSubject = rows[0];
    console.log(`Created examSubject: ${examSubject.id}`);
  } else {
    console.log(`Found examSubject: ${examSubject.id} [max=${examSubject.maxMarks}, pass=${examSubject.passMarks}]`);
  }

  // 6. Save marks
  const existingMarks = await db
    .select()
    .from(schema.marks)
    .where(
      and(
        eq(schema.marks.examSubjectId, examSubject.id),
        eq(schema.marks.studentId, student.id)
      )
    );

  if (existingMarks.length > 0) {
    // Update existing
    const mk = existingMarks[0];
    await db
      .update(schema.marks)
      .set({
        marksObtained: String(MARKS_OBTAINED),
        updatedAt: new Date(),
      })
      .where(eq(schema.marks.id, mk.id));
    console.log(`\nUpdated marks: ${MARKS_OBTAINED}/${MAX_MARKS} (was ${mk.marksObtained}/${MAX_MARKS})`);
  } else {
    // Insert new
    const mkId = id('mk');
    await db.insert(schema.marks).values({
      id: mkId,
      examId: exam.id,
      examSubjectId: examSubject.id,
      institutionCode: student.institutionCode || '',
      studentId: student.id,
      classSectionId: activeClass.classSectionId,
      subjectId: subject.id,
      marksObtained: String(MARKS_OBTAINED),
      grade: '',
      remarks: '',
      enteredBy: student.id,
      enteredAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`\nInserted marks: ${mkId}`);
  }

  console.log(`\nDone! ${student.fullName} got ${MARKS_OBTAINED}/${MAX_MARKS} in ${SUBJECT_NAME} (${EXAM_NAME}).`);
  await client.end();
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
