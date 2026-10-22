import 'dotenv/config';
import pg from 'pg';

/**
 * One-off data fix: canonicalize developer role spelling in PostgreSQL.
 * Client guards only match 'dev' (after normalize); capital-D 'Developer'
 * caused an /auth ↔ /(developer)/home redirect loop.
 */
async function fixDeveloperRoleData() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[Fix] DATABASE_URL is not set.');
    process.exit(1);
  }
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    const before = await client.query(
      `SELECT id, email, role FROM users WHERE LOWER(TRIM(role)) IN ('developer', 'dev') ORDER BY email`
    );
    console.log('[Fix] Rows before:', before.rows);

    const result = await client.query(
      `UPDATE users SET role = 'dev' WHERE LOWER(TRIM(role)) = 'developer' RETURNING id, email, role`
    );
    console.log(`[Fix] Updated ${result.rowCount} row(s) from 'Developer'/'developer' → 'dev':`, result.rows);

    const after = await client.query(
      `SELECT id, email, role FROM users WHERE LOWER(TRIM(role)) IN ('developer', 'dev') ORDER BY email`
    );
    console.log('[Fix] Rows after:', after.rows);
  } catch (err: any) {
    console.error('[Fix Error]', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

fixDeveloperRoleData();
