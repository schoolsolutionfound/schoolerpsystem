import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

async function applyMigration() {
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/schoolerp';
  console.log('[Apply Migration Script] Target Database:', dbUrl);

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();

    const sqlPath = path.join(process.cwd(), 'drizzle', '0003_add_announcement_tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('[Apply Migration Script] Running 0003_add_announcement_tables.sql...');
    await client.query(sqlContent);
    console.log('[Apply Migration Script] Migration executed successfully!');

    // Verify tables created
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'announcement%'
      ORDER BY table_name;
    `);

    console.log('[Apply Migration Script] Verified Announcement Tables in DB:', res.rows.map((r: any) => r.table_name));

  } catch (err: any) {
    console.error('[Apply Migration Error]:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
