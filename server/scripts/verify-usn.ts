import 'dotenv/config';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  if (!db) { return; }
  const students = await db.select().from(schema.users).where(eq(schema.users.role, 'student'));
  for (const s of students) {
    console.log(`${s.fullName}: rollNoOrUSN=${s.rollNoOrUSN}`);
  }
}
main().catch(console.error);
