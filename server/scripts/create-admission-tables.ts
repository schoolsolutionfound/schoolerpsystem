import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();
  console.log('Connected to PostgreSQL for admission table migration...');

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admission_courses (
        id text PRIMARY KEY,
        institution_code varchar(100) NOT NULL,
        academic_year varchar(50) NOT NULL,
        course_code varchar(50) NOT NULL,
        course_name text NOT NULL,
        program_type varchar(50) NOT NULL DEFAULT 'engineering',
        total_seats integer NOT NULL DEFAULT 0,
        quotas jsonb DEFAULT '[]'::jsonb,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_admission_courses_inst ON admission_courses(institution_code);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_admission_courses_inst_year_code ON admission_courses(institution_code, academic_year, course_code);

      CREATE TABLE IF NOT EXISTS admission_applications (
        id text PRIMARY KEY,
        institution_code varchar(100) NOT NULL,
        academic_year varchar(50) NOT NULL,
        application_number varchar(50) NOT NULL,
        full_name text NOT NULL,
        parent_phone varchar(20) NOT NULL DEFAULT '',
        dob varchar(20) DEFAULT '',
        father_name text DEFAULT '',
        mother_name text DEFAULT '',
        guardian_phone varchar(20) DEFAULT '',
        address text DEFAULT '',
        blood_group varchar(10) DEFAULT '',
        program_type varchar(50) DEFAULT 'engineering',
        preferred_course_id text,
        preferred_course_name text DEFAULT '',
        status varchar(30) NOT NULL DEFAULT 'waiting_list',
        allocated_course_id text,
        allocated_course_name text DEFAULT '',
        allocated_quota varchar(50) DEFAULT '',
        allocated_at timestamp,
        confirmed_at timestamp,
        notes text DEFAULT '',
        custom_fields jsonb DEFAULT '{}'::jsonb,
        created_by text DEFAULT '',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_admission_apps_inst ON admission_applications(institution_code);
      CREATE INDEX IF NOT EXISTS idx_admission_apps_status ON admission_applications(status);
      CREATE INDEX IF NOT EXISTS idx_admission_apps_batch ON admission_applications(academic_year);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_admission_apps_inst_no ON admission_applications(institution_code, application_number);

      CREATE TABLE IF NOT EXISTS admission_form_configs (
        id text PRIMARY KEY,
        institution_code varchar(100) NOT NULL,
        program_type varchar(50) NOT NULL DEFAULT 'all',
        field_key varchar(100) NOT NULL,
        label text NOT NULL,
        field_type varchar(50) NOT NULL DEFAULT 'text',
        options jsonb DEFAULT '[]'::jsonb,
        placeholder text DEFAULT '',
        is_required boolean NOT NULL DEFAULT false,
        "order" integer NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_admission_form_configs_inst ON admission_form_configs(institution_code);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_admission_form_configs_inst_prog_key ON admission_form_configs(institution_code, program_type, field_key);
    `);

    console.log('✅ Admission tables created successfully with indexes!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
