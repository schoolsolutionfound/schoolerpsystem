import 'dotenv/config';
import { db } from '../src/modules/shared/db/index.js';
import { users, studentClasses, parentStudentLinks } from '../src/modules/shared/db/schema.js';
import { eq, sql } from 'drizzle-orm';

async function main() {
  if (!db) { console.log('No DB connected'); return; }

  // Check student fields
  const students = await db.select().from(users).where(eq(users.role, 'student'));
  console.log('=== STUDENT DETAILS ===');
  for (const s of students) {
    console.log(`  ${s.fullName}: rollNoUsn=${s.rollNoUsn} | email=${s.email} | id=${s.id}`);
  }

  // Check student_classes
  const sc = await db.select().from(studentClasses);
  console.log('\n=== STUDENT CLASSES ===');
  for (const s of sc) {
    console.log(`  studentId=${s.studentId} | classSectionId=${s.classSectionId} | rollNo=${s.rollNo}`);
  }

  // Check parent links
  try {
    const links = await db.select().from(parentStudentLinks);
    console.log('\n=== PARENT STUDENT LINKS ===');
    for (const l of links) {
      console.log(JSON.stringify(l));
    }
  } catch {
    console.log('\n=== PARENT STUDENT LINKS: table does not exist ===');
  }

  // Check parent scope
  const parents = await db.select().from(users).where(eq(users.role, 'parent'));
  console.log('\n=== PARENT DETAILS ===');
  for (const p of parents) {
    console.log(`  ${p.fullName}: scope=${JSON.stringify(p.scope)} | linkedStudentUSN in scope: ${typeof p.scope === 'object' ? (p.scope as any)?.linkedStudentUSN : 'parse needed'}`);
  }

  // Check homework table
  try {
    await db.execute(sql`SELECT 1 FROM homework LIMIT 1`);
    console.log('\n=== HOMEWORK TABLE: EXISTS ===');
  } catch (e: any) {
    console.log(`\n=== HOMEWORK TABLE: ${e.message?.includes('does not exist') ? 'DOES NOT EXIST' : 'ERROR: ' + e.message} ===`);
  }
}

main().catch(console.error);
