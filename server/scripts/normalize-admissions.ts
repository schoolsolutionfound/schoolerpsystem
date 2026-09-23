import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq, or } from 'drizzle-orm';

async function normalize() {
  console.log('--- Normalizing admissions records ---');
  if (!db) {
    console.error('Database connection not available');
    process.exit(1);
  }
  
  // 1. Update Salwa to OAK002
  const r1 = await db
    .update(schema.admissions)
    .set({
      schoolId: 'OAK002',
      schoolName: 'Oakridge World Academy',
    })
    .where(
      or(
        eq(schema.admissions.id, 'adm_1789916258914_ft06s'),
        eq(schema.admissions.schoolId, 'inst_1789906236612_7bok3'),
        eq(schema.admissions.childFullName, 'Salwa')
      )
    )
    .returning();
  console.log('Updated Salwa:', r1);

  // 2. Update Salea to HCS005
  const r2 = await db
    .update(schema.admissions)
    .set({
      schoolId: 'HCS005',
      schoolName: 'The Heritage Cambridge International',
    })
    .where(
      or(
        eq(schema.admissions.id, 'adm_1789917044090_imktw'),
        eq(schema.admissions.schoolId, 'inst_1789906236620_x3plp'),
        eq(schema.admissions.childFullName, 'Salea')
      )
    )
    .returning();
  console.log('Updated Salea:', r2);

  // 3. Verify all admissions in DB
  const all = await db.select().from(schema.admissions);
  console.log('\n--- Current Admissions in PostgreSQL ---');
  all.forEach((a) => {
    console.log(
      `ID: ${a.id} | Child: ${a.childFullName} | School: ${a.schoolId} (${a.schoolName}) | Status: ${a.status} | Parent: ${a.parentName} (${a.parentPhone})`
    );
  });

  process.exit(0);
}

normalize().catch((e) => {
  console.error(e);
  process.exit(1);
});
