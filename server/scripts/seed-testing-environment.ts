import 'dotenv/config';
import { admin } from '../src/modules/shared/config/firebase.js';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';

async function seedTestingEnvironment() {
  console.log('--- Setting Up Testing Environment & Accounts ---');

  const testAccounts = [
    // 1. Prospective Parent (Not affiliated with any student, sees ALL schools in Discover)
    {
      email: 'normal.parent@gmail.com',
      password: 'Parent@123',
      name: 'Amina Siddiqui (Prospective Parent)',
      role: 'parent',
      roles: ['parent'],
      institutionCode: '',
      institutionName: '',
      scope: {},
    },
    // 2. Affiliated Parent (Affiliated with Oakridge World Academy student Ayaan Khan)
    {
      email: 'parent.oakridge@school.com',
      password: 'Parent@123',
      name: 'Farhan Khan (Oakridge Parent)',
      role: 'parent',
      roles: ['parent'],
      institutionCode: 'OAK002',
      institutionName: 'Oakridge World Academy',
      scope: {
        linkedStudentUSN: 'OAK-2026-088',
        childName: 'Ayaan Khan',
        relation: 'Father',
        institutionCode: 'OAK002',
        schoolName: 'Oakridge World Academy',
      },
    },
    // 3. Affiliated Parent (Affiliated with Greenfield student Safwan Haneef)
    {
      email: 'safwan.parent@gmail.com',
      password: 'Parent@123',
      name: 'Haneef (Greenfield Parent)',
      role: 'parent',
      roles: ['parent'],
      institutionCode: 'TST001',
      institutionName: 'Greenfield International School',
      scope: {
        linkedStudentUSN: 'STU-101',
        childName: 'Safwan Haneef',
        relation: 'Father',
        institutionCode: 'TST001',
        schoolName: 'Greenfield International School',
      },
    },
    // 4. Oakridge Administrator (Team Lead Account)
    {
      email: 'admi.okridge@school.com',
      password: 'Admin@123',
      name: 'Oakridge Administrator',
      role: 'admin',
      roles: ['admin'],
      institutionCode: 'OAK002',
      institutionName: 'Oakridge World Academy',
      scope: {},
    },
    // 5. Oakridge Admission Officer
    {
      email: 'admission.oakridge@school.com',
      password: 'Officer@123',
      name: 'Oakridge Admission Officer',
      role: 'admission_officer',
      roles: ['admission_officer'],
      institutionCode: 'OAK002',
      institutionName: 'Oakridge World Academy',
      scope: {},
    },
    // 6. Dual-Role Staff (Accountant + Admission Officer)
    {
      email: 'staff.multirole@school.com',
      password: 'Officer@123',
      name: 'Finance & Admission Head',
      role: 'accountant',
      roles: ['accountant', 'admission_officer'],
      institutionCode: 'OAK002',
      institutionName: 'Oakridge World Academy',
      scope: {},
    },
  ];

  const authUids: Record<string, string> = {};

  for (const acc of testAccounts) {
    let uid = '';
    try {
      const existing = await admin.auth().getUserByEmail(acc.email);
      uid = existing.uid;
      await admin.auth().updateUser(uid, {
        password: acc.password,
        displayName: acc.name,
      });
      console.log(`[Firebase Auth] Updated user: ${acc.email}`);
    } catch {
      const created = await admin.auth().createUser({
        email: acc.email,
        password: acc.password,
        displayName: acc.name,
      });
      uid = created.uid;
      console.log(`[Firebase Auth] Created user: ${acc.email}`);
    }
    authUids[acc.email] = uid;

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, {
      role: acc.role,
      roles: acc.roles,
      institutionCode: acc.institutionCode,
    });

    // Sync to PostgreSQL
    const existingDb = await db.select().from(schema.users).where(eq(schema.users.email, acc.email));
    if (existingDb.length > 0) {
      await db
        .update(schema.users)
        .set({
          fullName: acc.name,
          role: acc.role,
          roles: acc.roles,
          institutionCode: acc.institutionCode,
          institutionName: acc.institutionName,
          scope: acc.scope,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, existingDb[0].id));
      console.log(`[PostgreSQL] Updated: ${acc.email}`);
    } else {
      await db.insert(schema.users).values({
        id: uid,
        firebaseUid: uid,
        email: acc.email,
        fullName: acc.name,
        role: acc.role,
        roles: acc.roles,
        institutionCode: acc.institutionCode,
        institutionName: acc.institutionName,
        scope: acc.scope,
      });
      console.log(`[PostgreSQL] Inserted: ${acc.email}`);
    }

    // Sync to Firestore
    try {
      await admin.firestore().collection('users').doc(uid).set(
        {
          email: acc.email,
          fullName: acc.name,
          displayName: acc.name,
          role: acc.role,
          userRole: acc.role,
          roles: acc.roles,
          institutionCode: acc.institutionCode,
          institutionId: acc.institutionCode,
          schoolId: acc.institutionCode,
          institutionName: acc.institutionName,
          schoolName: acc.institutionName,
          scope: acc.scope,
          linkedStudentUSN: (acc.scope as any).linkedStudentUSN || '',
          childName: (acc.scope as any).childName || '',
          relation: (acc.scope as any).relation || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log(`[Firestore] Synced: ${acc.email}`);
    } catch (e: any) {
      console.warn(`[Firestore] Warn: ${e.message}`);
    }
  }

  // Seed sample admission applications for testing
  console.log('\n--- Seeding Sample Admission Applications ---');
  const prospectiveUid = authUids['normal.parent@gmail.com'] || 'Dyblp8DSaROCsBQC1PFlNNRcQMg2';

  // 1. Pending application for Oakridge World Academy (Ready to test "Schedule Entrance Test")
  const pendingId = 'adm_test_pending_01';
  await db
    .insert(schema.admissions)
    .values({
      id: pendingId,
      parentId: prospectiveUid,
      parentName: 'Amina Siddiqui',
      parentEmail: 'normal.parent@gmail.com',
      parentPhone: '+91 98765 43210',
      schoolId: 'OAK002',
      schoolName: 'Oakridge World Academy',
      childFullName: 'Zayd Siddiqui',
      childAge: 7,
      childGender: 'male',
      previousSchool: 'Little Angels Nursery',
      gradeApplyingFor: 'Grade 2',
      status: 'pending',
    })
    .onConflictDoUpdate({
      target: schema.admissions.id,
      set: {
        status: 'pending',
        entranceTestDate: null,
        entranceTestVenue: '',
        entranceTestInstructions: '',
      },
    });
  console.log(`[Admissions] Seeded Pending Application: ${pendingId} (Child: Zayd Siddiqui for Oakridge)`);

  // 2. Application with Entrance Test already scheduled (To verify scheduled view)
  const scheduledId = 'adm_test_scheduled_02';
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 4);
  testDate.setHours(10, 30, 0, 0);

  await db
    .insert(schema.admissions)
    .values({
      id: scheduledId,
      parentId: prospectiveUid,
      parentName: 'Amina Siddiqui',
      parentEmail: 'normal.parent@gmail.com',
      parentPhone: '+91 98765 43210',
      schoolId: 'OAK002',
      schoolName: 'Oakridge World Academy',
      childFullName: 'Miriam Siddiqui',
      childAge: 11,
      childGender: 'female',
      previousSchool: 'St. Mary Primary School',
      gradeApplyingFor: 'Grade 6',
      status: 'test_scheduled',
      entranceTestDate: testDate,
      entranceTestVenue: 'Auditorium Hall B - Oakridge World Academy Campus',
      entranceTestInstructions: 'Please bring original birth certificate, previous term report card, HB pencils, and arrive by 10:15 AM sharp.',
    })
    .onConflictDoUpdate({
      target: schema.admissions.id,
      set: {
        status: 'test_scheduled',
        entranceTestDate: testDate,
        entranceTestVenue: 'Auditorium Hall B - Oakridge World Academy Campus',
        entranceTestInstructions: 'Please bring original birth certificate, previous term report card, HB pencils, and arrive by 10:15 AM sharp.',
      },
    });
  console.log(`[Admissions] Seeded Scheduled Test Application: ${scheduledId} (Child: Miriam Siddiqui for Oakridge)`);

  console.log('\n=== Testing Environment Setup Successfully Completed! ===');
  process.exit(0);
}

seedTestingEnvironment().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});
