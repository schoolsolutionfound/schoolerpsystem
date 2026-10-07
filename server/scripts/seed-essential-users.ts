import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  if (!db) {
    console.error('Database connection not available.');
    process.exit(1);
  }

  console.log('Seeding institution TST001...');
  const existingInst = await db.select().from(schema.institutions).where(eq(schema.institutions.institutionCode, 'TST001'));
  if (existingInst.length === 0) {
    await db.insert(schema.institutions).values({
      institutionCode: 'TST001',
      institutionName: 'Greenfield International School',
      institutionType: 'school',
      departments: ['Science', 'Mathematics', 'English'],
      academicYears: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
      courses: ['Primary', 'Middle School', 'High School'],
    });
    console.log('✓ Institution TST001 created.');
  } else {
    console.log('✓ Institution TST001 already exists.');
  }

  // Create Class 6 A
  const existingClass = await db.select().from(schema.classSections).where(eq(schema.classSections.institutionCode, 'TST001'));
  let class6aId = '';
  if (existingClass.length === 0) {
    const [c] = await db.insert(schema.classSections).values({
      institutionCode: 'TST001',
      name: 'Class 6 A',
      department: 'Middle School',
      academicYear: 'Grade 6',
      section: 'A',
    }).returning();
    class6aId = c.id;
    console.log('✓ Class 6 A created:', class6aId);
  } else {
    class6aId = existingClass[0].id;
    console.log('✓ Class section exists:', existingClass[0].name);
  }

  // Define essential test accounts
  const testUsers = [
    {
      email: 'safwan.parent@gmail.com',
      password: 'Parent@123',
      fullName: 'Haneef (Parent of Safwan)',
      role: 'parent',
      institutionCode: 'TST001',
      institutionName: 'Greenfield International School',
      scope: {
        linkedStudentUSN: 'TST2026001',
        childName: 'Safwan Haneef',
        relation: 'Father',
      },
    },
    {
      email: 'safwanhaneef786@gmail.com',
      password: 'Student@123',
      fullName: 'Safwan Haneef',
      role: 'student',
      institutionCode: 'TST001',
      institutionName: 'Greenfield International School',
      rollNoOrUSN: 'TST2026001',
      scope: {
        classSectionId: class6aId,
        className: 'Class 6 A',
      },
    },
    {
      email: 'safwancoding1919@gmail.com',
      password: 'Safwan@123',
      fullName: 'Mohammed Safwan',
      role: 'admin',
      institutionCode: 'TST001',
      institutionName: 'Greenfield International School',
      scope: {},
    },
    {
      email: 'kadar@gmail.com',
      password: 'Kadar@123',
      fullName: 'Mr Kadar',
      role: 'teacher',
      institutionCode: 'TST001',
      institutionName: 'Greenfield International School',
      scope: {
        department: 'Mathematics',
      },
    },
    {
      email: 'dev@schoolerp.com',
      password: 'DevPass123!',
      fullName: 'Developer Admin',
      role: 'dev',
      institutionCode: 'SUPER',
      institutionName: 'SchoolERP Platform',
      scope: {},
    },
  ];

  console.log('\nSeeding users in Firebase Auth & PostgreSQL...');
  for (const u of testUsers) {
    let firebaseUid = `uid_${u.role}_${Date.now()}`;

    if (isFirebaseAdminInitialized) {
      try {
        const fbUser = await admin.auth().getUserByEmail(u.email);
        firebaseUid = fbUser.uid;
        await admin.auth().updateUser(firebaseUid, {
          password: u.password,
          displayName: u.fullName,
        });
        console.log(`✓ Firebase account updated: ${u.email} (UID: ${firebaseUid})`);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          const created = await admin.auth().createUser({
            email: u.email,
            password: u.password,
            displayName: u.fullName,
          });
          firebaseUid = created.uid;
          console.log(`✓ Firebase account created: ${u.email} (UID: ${firebaseUid})`);
        } else {
          console.error(`Error updating Firebase user ${u.email}:`, err.message);
        }
      }
    }

    const existingDb = await db.select().from(schema.users).where(eq(schema.users.email, u.email));
    if (existingDb.length === 0) {
      await db.insert(schema.users).values({
        id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        firebaseUid,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        institutionCode: u.institutionCode,
        institutionName: u.institutionName,
        institutionType: 'school',
        rollNoOrUSN: u.rollNoOrUSN || '',
        scope: u.scope,
        profileCompleted: true,
        mustChangePassword: false,
      });
      console.log(`✓ DB user inserted: ${u.email} [${u.role}]`);
    } else {
      await db.update(schema.users)
        .set({
          firebaseUid,
          fullName: u.fullName,
          role: u.role,
          institutionCode: u.institutionCode,
          institutionName: u.institutionName,
          rollNoOrUSN: u.rollNoOrUSN || '',
          scope: u.scope,
          profileCompleted: true,
          mustChangePassword: false,
        })
        .where(eq(schema.users.email, u.email));
      console.log(`✓ DB user updated: ${u.email} [${u.role}]`);
    }
  }

  console.log('\nSeed completed successfully!');
}

main().catch(console.error);
