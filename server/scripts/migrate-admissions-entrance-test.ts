import { db } from '../src/modules/shared/db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  if (!db) {
    console.error('DB not available');
    process.exit(1);
  }
  await db.execute(sql`
    ALTER TABLE admissions 
    ADD COLUMN IF NOT EXISTS entrance_test_date TIMESTAMP,
    ADD COLUMN IF NOT EXISTS entrance_test_venue TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS entrance_test_instructions TEXT DEFAULT '';
  `);
  console.log('Successfully added entrance test columns to admissions table!');
  process.exit(0);
}

migrate().catch(e => {
  console.error('Migration error:', e);
  process.exit(1);
});
