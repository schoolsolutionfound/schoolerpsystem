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

    async function createTableIfMissing(sql) {
      const name = sql.match(/CREATE TABLE (\S+)/i)?.[1];
      const check = await client.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
        [name]
      );
      if (check.rows.length > 0) {
        console.log(`  ↻ ${name} already exists, skipping CREATE`);
      } else {
        await client.query(sql);
        console.log(`  ✓ ${name} created`);
      }
    }

    console.log('=== Creating marks module tables ===');
    await createTableIfMissing(`
      CREATE TABLE exams (
        id TEXT PRIMARY KEY,
        institution_code VARCHAR(100) NOT NULL,
        name VARCHAR(200) NOT NULL,
        term VARCHAR(100) DEFAULT '',
        academic_year VARCHAR(50) DEFAULT '',
        start_date DATE,
        end_date DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        created_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_exams_inst ON exams (institution_code);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_exams_status ON exams (status);`);

    await createTableIfMissing(`
      CREATE TABLE exam_subjects (
        id TEXT PRIMARY KEY,
        exam_id TEXT NOT NULL,
        institution_code VARCHAR(100) NOT NULL,
        subject_id TEXT NOT NULL,
        max_marks INTEGER NOT NULL DEFAULT 100,
        pass_marks INTEGER NOT NULL DEFAULT 35,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_exam_subjects_exam ON exam_subjects (exam_id);`);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_exam_subjects_exam_subject
        ON exam_subjects (exam_id, subject_id);
    `);

    await createTableIfMissing(`
      CREATE TABLE marks (
        id TEXT PRIMARY KEY,
        exam_id TEXT NOT NULL,
        exam_subject_id TEXT NOT NULL,
        institution_code VARCHAR(100) NOT NULL,
        student_id TEXT NOT NULL,
        class_section_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        marks_obtained NUMERIC(6, 2) NOT NULL DEFAULT 0,
        grade VARCHAR(5) DEFAULT '',
        remarks TEXT DEFAULT '',
        entered_by TEXT NOT NULL,
        entered_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_marks_exam ON marks (exam_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_marks_student ON marks (student_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_marks_class ON marks (class_section_id);`);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_marks_exam_subject_student
        ON marks (exam_subject_id, student_id);
    `);

    // Verify
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name IN ('exams', 'exam_subjects', 'marks')
       ORDER BY table_name`
    );
    console.log('\nTables created:');
    console.table(tables.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
