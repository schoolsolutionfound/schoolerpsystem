import { db } from '../src/modules/shared/db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('--- Migrating PostgreSQL: Adding roles column to users ---');
  await db.execute(sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]'::jsonb;
  `);

  await db.execute(sql`
    UPDATE users 
    SET roles = jsonb_build_array(role) 
    WHERE roles IS NULL OR jsonb_array_length(roles) = 0;
  `);

  console.log('--- Migration complete! Verified sample users: ---');
  const sample = await db.execute(sql`
    SELECT id, email, role, roles FROM users LIMIT 5;
  `);
  console.log(sample.rows);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
