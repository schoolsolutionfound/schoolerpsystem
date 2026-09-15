import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

function newId() {
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    // Resolve IDs
    const cls = await client.query(
      `SELECT id FROM class_sections WHERE institution_code = 'TST001' AND name = 'Class 6 A'`
    );
    if (cls.rows.length === 0) {
      console.log('Class 6 A not found.');
      return;
    }
    const classId = cls.rows[0].id;

    const sub = await client.query(
      `SELECT id FROM subjects WHERE institution_code = 'TST001' AND name = 'Mathematics'`
    );
    if (sub.rows.length === 0) {
      console.log('Mathematics subject not found.');
      return;
    }
    const subjectId = sub.rows[0].id;

    const teacher = await client.query(
      `SELECT id, full_name FROM users WHERE id = 'usr_1787066287949_dsdty'`
    );
    if (teacher.rows.length === 0) {
      console.log('Kadar not found.');
      return;
    }
    const teacherId = teacher.rows[0].id;

    // Check existing assignment
    const existing = await client.query(
      `SELECT id, teacher_id FROM subject_teachers
       WHERE class_section_id = $1 AND subject_id = $2`,
      [classId, subjectId]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      if (row.teacher_id === teacherId) {
        console.log('Kadar is already assigned as Mathematics teacher for Class 6 A. No change needed.');
      } else {
        // Reassign to Kadar
        await client.query(
          `UPDATE subject_teachers SET teacher_id = $1, updated_at = NOW() WHERE id = $2`,
          [teacherId, row.id]
        );
        console.log(`Reassigned Mathematics for Class 6 A from ${row.teacher_id} to ${teacherId} (Mr Kadar).`);
      }
    } else {
      // Insert new
      const id = newId();
      await client.query(
        `INSERT INTO subject_teachers (id, institution_code, class_section_id, subject_id, teacher_id)
         VALUES ($1, 'TST001', $2, $3, $4)
         ON CONFLICT (class_section_id, subject_id) DO NOTHING`,
        [id, classId, subjectId, teacherId]
      );
      console.log(`Created subject_teachers row ${id} → Mr Kadar teaches Mathematics for Class 6 A.`);
    }

    // Verify
    const verify = await client.query(
      `SELECT st.id, cs.name AS class_name, s.name AS subject_name, u.full_name AS teacher_name
       FROM subject_teachers st
       LEFT JOIN class_sections cs ON cs.id = st.class_section_id
       LEFT JOIN subjects s ON s.id = st.subject_id
       LEFT JOIN users u ON u.id = st.teacher_id
       WHERE cs.institution_code = 'TST001' AND cs.name = 'Class 6 A'
       ORDER BY s.name`
    );
    console.log('\nAll subject-teacher assignments for Class 6 A:');
    console.table(verify.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
