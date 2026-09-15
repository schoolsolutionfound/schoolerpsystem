import 'dotenv/config';
import { db } from '../src/modules/shared/db/index.js';
import { users } from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  if (!db) { console.log('No DB connected'); return; }
  const rows = await db.select().from(users).where(eq(users.role, 'admin'));
  console.log(JSON.stringify(rows.map(r => ({ email: r.email, fullName: r.fullName, role: r.role, institutionCode: r.institutionCode, firebaseUid: r.firebaseUid })), null, 2));
}
main().catch(console.error);
