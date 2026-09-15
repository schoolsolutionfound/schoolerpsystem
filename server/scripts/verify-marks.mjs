import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    const exams = await client.query(`SELECT id, name, status FROM exams ORDER BY created_at DESC`);
    console.log(`Exams: ${exams.rows.length}`);
    console.table(exams.rows);

    const markCount = await client.query(`SELECT COUNT(*)::int AS c FROM marks`);
    console.log(`\nTotal marks rows: ${markCount.rows[0].c}`);

    // For Safwan specifically
    const safwanMarks = await client.query(
      `SELECT e.name AS exam, s.name AS subject, m.marks_obtained, m.grade
       FROM marks m
       JOIN users u ON u.id = m.student_id
       JOIN exams e ON e.id = m.exam_id
       JOIN subjects s ON s.id = m.subject_id
       WHERE u.roll_no_usn = 'C6A-001'
       ORDER BY s.name`
    );
    console.log(`\nSafwan (C6A-001) marks:`);
    console.table(safwanMarks.rows);

    // Per-class summary
    const perClass = await client.query(
      `SELECT e.name AS exam, cs.name AS class_name,
              COUNT(DISTINCT m.student_id)::int AS students,
              ROUND(AVG(m.marks_obtained)::numeric, 1) AS avg_score
       FROM marks m
       JOIN exams e ON e.id = m.exam_id
       JOIN class_sections cs ON cs.id = m.class_section_id
       WHERE cs.name = 'Class 6 A'
       GROUP BY e.name, cs.name`
    );
    console.log(`\nClass 6 A summary:`);
    console.table(perClass.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
