import 'dotenv/config';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';

const INST = 'TST001';

async function main() {
  if (!db) { console.log('No DB connected'); return; }

  // 7. Create homework
  console.log('[7] Creating homework...');
  const classes = await db.select().from(schema.classSections).where(eq(schema.classSections.institutionCode, INST));
  const class6A = classes.find(c => c.name === 'Class 6 A');
  const allSubjects = await db.select().from(schema.subjects).where(eq(schema.subjects.institutionCode, INST));
  const teachers = await db.select().from(schema.users).where(eq(schema.users.role, 'teacher'));
  const teacherIds = teachers.map(t => t.id!);

  if (class6A) {
    const homeworkData = [
      { title: 'Mathematics Worksheet - Fractions', description: 'Complete exercises 1-15 from Chapter 3. Show all working.', subjectIdx: 0, priority: 'high', dueDays: 3 },
      { title: 'English Essay Writing', description: 'Write a 300-word essay on "My Favorite Festival".', subjectIdx: 1, priority: 'medium', dueDays: 5 },
      { title: 'Science Lab Report', description: 'Write observations for the photosynthesis experiment.', subjectIdx: 2, priority: 'high', dueDays: 2 },
      { title: 'Social Studies Map Work', description: 'Label all states and capitals on the blank map.', subjectIdx: 3, priority: 'low', dueDays: 7 },
      { title: 'Computer Science - HTML Project', description: 'Create a personal webpage using HTML.', subjectIdx: 4, priority: 'medium', dueDays: 4 },
    ];

    let hwCreated = 0;
    for (const hw of homeworkData) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + hw.dueDays);
      await db.insert(schema.homework).values({
        id: `hw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        institutionCode: INST,
        classSectionId: class6A.id,
        subjectId: allSubjects[hw.subjectIdx]?.id,
        teacherId: teacherIds[0] || '',
        title: hw.title,
        description: hw.description,
        dueDate: dueDate.toISOString().split('T')[0],
        priority: hw.priority,
        status: 'active',
        assignedTo: 'class',
        createdBy: teacherIds[0] || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      hwCreated++;
    }
    console.log(`  Created ${hwCreated} homework assignments`);
  }

  // 8. Create parent accounts for students without parents
  console.log('[8] Creating parent accounts...');
  const sc = await db.select().from(schema.studentClasses);
  const existingParents = await db.select().from(schema.users).where(eq(schema.users.role, 'parent'));

  let parentsCreated = 0;
  for (const enrollment of sc) {
    const hasParent = existingParents.some(p => {
      const scope = typeof p.scope === 'string' ? JSON.parse(p.scope || '{}') : (p.scope || {});
      return scope.studentIds?.includes(enrollment.studentId);
    });
    if (hasParent) continue;

    const student = (await db.select().from(schema.users).where(eq(schema.users.id, enrollment.studentId)))[0];
    if (!student) continue;

    const parentId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(schema.users).values({
      id: parentId,
      firebaseUid: `parent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email: `parent.${student.fullName?.split(' ')[0]?.toLowerCase()}@schoolerp.test`,
      fullName: `Parent of ${student.fullName}`,
      role: 'parent',
      institutionCode: INST,
      institutionName: 'Test School',
      parentPhone: `+91-98765${String(parentsCreated + 10).padStart(5, '0')}`,
      mustChangePassword: false,
      profileCompleted: true,
      scope: JSON.stringify({
        relation: 'Parent',
        studentIds: [enrollment.studentId],
        studentNames: [student.fullName],
        linkedStudentUSN: enrollment.rollNo,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    parentsCreated++;
    existingParents.push({ id: parentId } as any);
  }
  console.log(`  Created ${parentsCreated} parent accounts`);

  console.log('\n========== REMAINING FIXES DONE ==========');
}

main().catch(console.error);
