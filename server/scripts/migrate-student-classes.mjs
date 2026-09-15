// Migration: create student_classes table + backfill from existing users.scope.

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

function newId() {
  return `sc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    // 1) Check if the table already exists
    const exists = await client.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'student_classes'`
    );
    if (exists.rows.length > 0) {
      console.log('student_classes table already exists. Skipping CREATE.');
    } else {
      console.log('Creating student_classes table...');
      await client.query(`
        CREATE TABLE student_classes (
          id TEXT PRIMARY KEY,
          institution_code VARCHAR(100) NOT NULL,
          student_id TEXT NOT NULL,
          class_section_id TEXT NOT NULL,
          roll_no VARCHAR(50) DEFAULT '',
          academic_year VARCHAR(50) DEFAULT '',
          effective_from DATE NOT NULL DEFAULT '2024-01-01',
          effective_to DATE,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      await client.query(`CREATE INDEX idx_student_classes_inst ON student_classes (institution_code);`);
      await client.query(`CREATE INDEX idx_student_classes_student ON student_classes (student_id);`);
      await client.query(`CREATE INDEX idx_student_classes_class ON student_classes (class_section_id);`);
      await client.query(`CREATE INDEX idx_student_classes_active_student ON student_classes (student_id, is_active);`);
      await client.query(`
        CREATE UNIQUE INDEX uq_student_classes_class_student_year
          ON student_classes (class_section_id, student_id, academic_year);
      `);
      console.log('  ✓ Table + indexes created');
    }

    // 2) Backfill: for every student in TST001 with scope->>classSectionId, insert a row.
    const students = await client.query(
      `SELECT id, roll_no_usn, scope
       FROM users
       WHERE institution_code = 'TST001'
         AND role = 'student'
         AND scope ? 'classSectionId'
         AND scope->>'classSectionId' <> ''`
    );
    console.log(`\nFound ${students.rows.length} students with classSectionId in scope.`);

    let inserted = 0, skipped = 0, noClass = 0;
    for (const stu of students.rows) {
      const classId = stu.scope?.classSectionId;
      const academicYear = stu.scope?.academicYear || '';

      // Verify the class exists
      const cls = await client.query(
        `SELECT id FROM class_sections WHERE id = $1`,
        [classId]
      );
      if (cls.rows.length === 0) {
        console.log(`  ⚠ Student ${stu.id.slice(-6)} → classSectionId ${classId} not found, skipping`);
        noClass++;
        continue;
      }

      // Check if a row already exists for this (class, student, year)
      const existing = await client.query(
        `SELECT id FROM student_classes
         WHERE class_section_id = $1 AND student_id = $2 AND academic_year = $3`,
        [classId, stu.id, academicYear]
      );
      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      const id = newId();
      await client.query(
        `INSERT INTO student_classes
           (id, institution_code, student_id, class_section_id, roll_no, academic_year, is_active)
         VALUES ($1, 'TST001', $2, $3, $4, $5, TRUE)`,
        [id, stu.id, classId, stu.roll_no_usn || '', academicYear]
      );
      inserted++;
    }
    console.log(`  ✓ Backfilled: ${inserted} new rows, ${skipped} already existed, ${noClass} skipped (no class)`);

    // 3) Verify
    const verify = await client.query(
      `SELECT sc.id, u.full_name, sc.roll_no, cs.name AS class_name, sc.academic_year, sc.is_active
       FROM student_classes sc
       JOIN users u ON u.id = sc.student_id
       JOIN class_sections cs ON cs.id = sc.class_section_id
       WHERE sc.institution_code = 'TST001'
       ORDER BY cs.name, sc.roll_no`
    );
    console.log(`\nstudent_classes rows in TST001: ${verify.rows.length}`);
    console.table(verify.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
