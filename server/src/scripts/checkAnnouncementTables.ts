import 'dotenv/config';
import pg from 'pg';

async function checkTables() {
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/schoolerp';
  console.log('[Check Script] DATABASE_URL:', dbUrl);

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tables = res.rows.map((r: any) => r.table_name);
    console.log('[Check Script] All Tables in Database:', tables);

    const announcementTables = tables.filter((t: string) => t.includes('announcement'));
    console.log('[Check Script] Announcement Tables Found:', announcementTables);

  } catch (err: any) {
    console.error('[Check Script Error]:', err.message);
  } finally {
    await client.end();
  }
}

checkTables();
