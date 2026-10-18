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
  console.log('Connected to PostgreSQL for placement table migration...');

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS placement_members (
        id text PRIMARY KEY,
        institution_code varchar(100) NOT NULL,
        user_id text NOT NULL,
        access_level varchar(20) NOT NULL DEFAULT 'member',
        granted_by text NOT NULL,
        created_at timestamp DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_placement_members_inst ON placement_members(institution_code);
      CREATE INDEX IF NOT EXISTS idx_placement_members_user ON placement_members(user_id);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_placement_members_inst_user ON placement_members(institution_code, user_id);

      CREATE TABLE IF NOT EXISTS student_placement_profiles (
        id text PRIMARY KEY,
        user_id text NOT NULL UNIQUE,
        full_name text NOT NULL,
        phone varchar(20) DEFAULT '',
        email varchar(255) NOT NULL,
        photo_url text DEFAULT '',
        resume_url text DEFAULT '',
        cgpa numeric(4, 2),
        tenth_percent numeric(5, 2),
        twelfth_or_diploma_percent numeric(5, 2),
        active_backlogs integer DEFAULT 0,
        portfolio_url text DEFAULT '',
        linkedin_url text DEFAULT '',
        github_url text DEFAULT '',
        leetcode_url text DEFAULT '',
        other_links jsonb DEFAULT '[]'::jsonb,
        updated_at timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS placement_drives (
        id text PRIMARY KEY,
        institution_code varchar(100) NOT NULL,
        company_name varchar(200) NOT NULL,
        logo_url text DEFAULT '',
        banner_url text DEFAULT '',
        title varchar(200) NOT NULL,
        description text DEFAULT '',
        job_type varchar(50) NOT NULL DEFAULT 'full_time',
        ctc_or_stipend varchar(100) DEFAULT '',
        location varchar(200) DEFAULT '',
        rounds jsonb DEFAULT '[]'::jsonb,
        allowed_branches jsonb DEFAULT '[]'::jsonb,
        allowed_years jsonb DEFAULT '[]'::jsonb,
        min_cgpa numeric(4, 2),
        max_backlogs integer,
        apply_deadline timestamp NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'draft',
        created_by text NOT NULL,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_placement_drives_inst ON placement_drives(institution_code);
      CREATE INDEX IF NOT EXISTS idx_placement_drives_status ON placement_drives(status);

      CREATE TABLE IF NOT EXISTS placement_announcements (
        id text PRIMARY KEY,
        institution_code varchar(100) NOT NULL,
        drive_id text,
        title varchar(200) NOT NULL,
        body text NOT NULL,
        attachment_url text DEFAULT '',
        target_branches jsonb DEFAULT '[]'::jsonb,
        target_years jsonb DEFAULT '[]'::jsonb,
        is_pinned boolean NOT NULL DEFAULT false,
        posted_by text NOT NULL,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_placement_announcements_inst ON placement_announcements(institution_code);
      CREATE INDEX IF NOT EXISTS idx_placement_announcements_drive ON placement_announcements(drive_id);

      CREATE TABLE IF NOT EXISTS drive_applications (
        id text PRIMARY KEY,
        drive_id text NOT NULL,
        student_id text NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'applied',
        current_round_index integer NOT NULL DEFAULT 0,
        profile_snapshot jsonb NOT NULL,
        resume_url text NOT NULL,
        applied_at timestamp DEFAULT now(),
        withdrawn_at timestamp,
        updated_at timestamp DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_drive_applications_drive ON drive_applications(drive_id);
      CREATE INDEX IF NOT EXISTS idx_drive_applications_student ON drive_applications(student_id);
      CREATE INDEX IF NOT EXISTS idx_drive_applications_status ON drive_applications(status);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_drive_applications_drive_student ON drive_applications(drive_id, student_id);
    `);
    console.log('✅ Placement tables and indexes successfully created or verified!');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
