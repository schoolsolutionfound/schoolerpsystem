// Seed: 1 exam (Unit Test 1) for Class 6 A, 5 subjects, marks for all 10 students.

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function pickScore(rollSuffix, subjectIdx) {
  // Deterministic but varied. Safwan (001) always does well.
  const base = 60 + ((rollSuffix * 7 + subjectIdx * 11) % 35);
  if (rollSuffix === 1) return Math.min(100, base + 12);
  return Math.max(0, Math.min(100, base));
}

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    // Class 6 A
    const cls = await client.query(
      `SELECT id FROM class_sections WHERE institution_code = 'TST001' AND name = 'Class 6 A'`
    );
    if (cls.rows.length === 0) {
      console.log('Class 6 A not found.');
      return;
    }
    const classId = cls.rows[0].id;

    // Subjects
    const subjects = await client.query(
      `SELECT id, name FROM subjects WHERE institution_code = 'TST001' ORDER BY name`
    );
    console.log(`Found ${subjects.rows.length} subjects.`);

    // Roster
    const roster = await client.query(
      `SELECT u.id, u.roll_no_usn FROM users u
       JOIN student_classes sc ON sc.student_id = u.id AND sc.is_active = TRUE
       WHERE sc.class_section_id = $1 ORDER BY u.roll_no_usn`,
      [classId]
    );
    console.log(`Roster: ${roster.rows.length} students.`);

    // Create exam
    const examId = newId('ex');
    await client.query(
      `INSERT INTO exams (id, institution_code, name, term, academic_year, start_date, end_date, status, created_by)
       VALUES ($1, 'TST001', $2, 'Term 1', '2026-2027', '2026-09-01', '2026-09-05', 'published', $3)`,
      [examId, 'Unit Test 1', 'usr_1787066287949_dsdty']
    );
    console.log(`Created exam: ${examId}`);

    // Create exam_subjects (one per subject) and marks
    const examSubjectByName = {};
    for (let i = 0; i < subjects.rows.length; i++) {
      const s = subjects.rows[i];
      const esId = newId('es');
      const maxMarks = 100;
      const passMarks = 35;
      await client.query(
        `INSERT INTO exam_subjects (id, exam_id, institution_code, subject_id, max_marks, pass_marks)
         VALUES ($1, $2, 'TST001', $3, $4, $5)`,
        [esId, examId, s.id, maxMarks, passMarks]
      );
      examSubjectByName[s.name] = esId;

      for (const stu of roster.rows) {
        const rollNum = parseInt((stu.roll_no_usn || '0').split('-')[1] || '0', 10);
        const score = pickScore(rollNum, i);
        const grade = score >= 90 ? 'A+' : score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 50 ? 'C' : score >= 35 ? 'D' : 'F';
        const markId = newId('mk');
        await client.query(
          `INSERT INTO marks
             (id, exam_id, exam_subject_id, institution_code, student_id, class_section_id, subject_id, marks_obtained, grade, entered_by)
           VALUES ($1, $2, $3, 'TST001', $4, $5, $6, $7, $8, $9)`,
          [markId, examId, esId, stu.id, classId, s.id, score, grade, 'usr_1787066287949_dsdty']
        );
      }
    }

    // Verify
    const summary = await client.query(
      `SELECT e.name AS exam, u.full_name, u.roll_no_usn,
              ROUND(AVG(m.marks_obtained)::numeric, 1) AS avg_score,
              COUNT(*)::int AS subjects
       FROM marks m
       JOIN users u ON u.id = m.student_id
       JOIN exams e ON e.id = m.exam_id
       WHERE m.exam_id = $1
       GROUP BY e.name, u.full_name, u.roll_no_usn
       ORDER BY u.roll_no_usn`,
      [examId]
    );
    console.log(`\nUnit Test 1 summary for Class 6 A:`);
    console.table(summary.rows);

    console.log(`\nInserted ${Object.keys(examSubjectByName).length} exam_subjects, ${roster.rows.length * subjects.rows.length} marks.`);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
