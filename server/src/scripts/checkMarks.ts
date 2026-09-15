import postgres from 'postgres';

async function main() {
  const c = postgres('postgres://postgres@localhost:5432/schoolerp');

  const exams = await c`SELECT id, name, status, institution_code FROM exams`;
  console.log('Exams:', JSON.stringify(exams, null, 2));

  const examSubjects = await c`SELECT id, exam_id, subject_id, institution_code, max_marks, pass_marks FROM exam_subjects`;
  console.log('ExamSubjects:', JSON.stringify(examSubjects, null, 2));

  const subjects = await c`SELECT id, name, institution_code FROM subjects`;
  console.log('Subjects:', JSON.stringify(subjects, null, 2));

  // Check what getStudentMarks would return for Safwan
  const safwanMarks = await c`SELECT m.id, m.exam_id, m.exam_subject_id, m.marks_obtained, m.institution_code FROM marks m WHERE m.student_id = 'usr_1788361696558_4x5g' AND m.institution_code = 'TST001'`;
  console.log('\nSafwan marks:', JSON.stringify(safwanMarks, null, 2));

  // Check exams exist for those exam_ids
  for (const mk of safwanMarks) {
    const exam = await c`SELECT id, name, status FROM exams WHERE id = ${mk.exam_id}`;
    const es = await c`SELECT id, subject_id, max_marks FROM exam_subjects WHERE id = ${mk.exam_subject_id}`;
    console.log(`  Mark ${mk.id}: exam=${exam[0]?.name || 'NOT FOUND'}(${exam[0]?.status}), subject=${es[0]?.subject_id || 'NOT FOUND'}, marks=${mk.marks_obtained}`);
  }

  await c.end();
}

main();
