import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const { admin, isFirebaseAdminInitialized } = await import('../src/modules/shared/config/firebase.js');
  const { db, dbUpsertUser } = await import('../src/modules/shared/db/index.js');
  const { institutions, placementMembers, studentPlacementProfiles, classSections, studentClasses } = await import('../src/modules/shared/db/schema.js');
  const { eq, and } = await import('drizzle-orm');

  console.log('=== Setting up Placement Cell Test Environment ===\n');

  if (!db) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  // 1. Ensure College Institution exists
  const existingInst = await db.query.institutions.findFirst({
    where: eq(institutions.institutionCode, 'GIS001'),
  });

  if (!existingInst) {
    await db.insert(institutions).values({
      institutionCode: 'GIS001',
      institutionName: 'Greenfield Institute of Technology',
      institutionType: 'college',
      departments: ['Computer Science', 'Information Science', 'Electronics'],
      academicYears: ['2026 Batch', '2027 Batch'],
      courses: ['B.Tech', 'M.Tech'],
    });
    console.log('✓ Created College Institution: Greenfield Institute of Technology (Code: GIS001)');
  } else {
    await db.update(institutions)
      .set({ institutionType: 'college' })
      .where(eq(institutions.institutionCode, 'GIS001'));
    console.log('✓ Verified College Institution: GIS001 (Type: college)');
  }

  // 2. Ensure Class Section exists for Students
  let cs = await db.query.classSections.findFirst({
    where: and(
      eq(classSections.institutionCode, 'GIS001'),
      eq(classSections.name, 'CS-A')
    ),
  });
  if (!cs) {
    const res = await db.insert(classSections).values({
      institutionCode: 'GIS001',
      name: 'CS-A',
      department: 'Computer Science',
      academicYear: '2026 Batch',
    }).returning();
    cs = res[0];
    console.log('✓ Created Class Section: CS-A (Computer Science, 2026 Batch)');
  }

  async function createUser(email: string, fullName: string, role: string, rollNoOrUSN = '') {
    const password = 'TestPassword123!';
    let firebaseUid = `${role}_${Date.now()}`;

    if (isFirebaseAdminInitialized) {
      try {
        const user = await admin.auth().createUser({ email, password, displayName: fullName });
        firebaseUid = user.uid;
        console.log(`✓ Firebase Auth account created for ${email}`);
      } catch (err: any) {
        if (err.code === 'auth/email-already-exists') {
          const existing = await admin.auth().getUserByEmail(email);
          firebaseUid = existing.uid;
          console.log(`~ Firebase Auth account already exists for ${email}`);
        } else {
          console.warn(`! Note for ${email}: ${err.message}`);
        }
      }
    }

    const savedUser = await dbUpsertUser({
      firebaseUid,
      email,
      fullName,
      role,
      institutionCode: 'GIS001',
      institutionName: 'Greenfield Institute of Technology',
      institutionType: 'college',
      rollNoOrUSN,
      mustChangePassword: false,
      profileCompleted: true,
      tenthPercentage: '88.5',
      twelfthPercentage: '89.2',
    });

    return { ...savedUser, password };
  }

  // 3. Create Accounts
  const adminUser = await createUser('admin@schoolerp.com', 'College Admin', 'admin');
  const placementHead = await createUser('placement@schoolerp.com', 'Prof. Rajesh Kumar', 'teacher');
  const facultyMember = await createUser('faculty@schoolerp.com', 'Dr. Sarah Mathew', 'teacher');
  const studentUser = await createUser('student@schoolerp.com', 'Aarav Sharma', 'student', '1GIT22CS001');

  // 4. Enroll Student into CS-A
  const existingEnrollment = await db.query.studentClasses.findFirst({
    where: and(
      eq(studentClasses.studentId, studentUser.id),
      eq(studentClasses.classSectionId, cs.id)
    ),
  });
  if (!existingEnrollment) {
    await db.insert(studentClasses).values({
      institutionCode: 'GIS001',
      studentId: studentUser.id,
      classSectionId: cs.id,
      isActive: true,
    });
    console.log('✓ Enrolled Aarav Sharma into CS-A');
  }

  // 5. Assign Placement Head
  const existingMember = await db.query.placementMembers.findFirst({
    where: and(
      eq(placementMembers.institutionCode, 'GIS001'),
      eq(placementMembers.userId, placementHead.id)
    ),
  });
  if (!existingMember) {
    await db.insert(placementMembers).values({
      institutionCode: 'GIS001',
      userId: placementHead.id,
      accessLevel: 'head',
      grantedBy: adminUser.id,
    });
    console.log('✓ Appointed Prof. Rajesh Kumar as Placement Head');
  } else {
    await db.update(placementMembers)
      .set({ accessLevel: 'head' })
      .where(eq(placementMembers.id, existingMember.id));
    console.log('✓ Verified Prof. Rajesh Kumar as Placement Head');
  }

  // 6. Seed Student Placement Profile
  const existingProfile = await db.query.studentPlacementProfiles.findFirst({
    where: eq(studentPlacementProfiles.userId, studentUser.id),
  });
  if (!existingProfile) {
    await db.insert(studentPlacementProfiles).values({
      userId: studentUser.id,
      fullName: 'Aarav Sharma',
      email: 'student@schoolerp.com',
      cgpa: '8.75',
      tenthPercent: '88.5',
      twelfthOrDiplomaPercent: '89.2',
      activeBacklogs: 0,
      resumeUrl: 'https://firebasestorage.googleapis.com/v0/b/school-erp-app-dec82.firebasestorage.app/o/sample-resume.pdf',
      githubUrl: 'https://github.com/aaravsharma',
      linkedinUrl: 'https://linkedin.com/in/aaravsharma',
      leetcodeUrl: 'https://leetcode.com/aaravsharma',
    });
    console.log('✓ Initialized Student Placement Profile for Aarav Sharma (CGPA: 8.75, 0 Backlogs)');
  }

  console.log('\n======================================================');
  console.log('🎉 Setup Complete! Ready for Step-by-Step Flow Testing');
  console.log('======================================================');
  console.log('Default Password for all test accounts: TestPassword123!\n');
  console.log('1. Admin Account:');
  console.log('   Email: admin@schoolerp.com');
  console.log('   Role:  Institution Admin\n');
  console.log('2. Placement Head Account:');
  console.log('   Email: placement@schoolerp.com');
  console.log('   Role:  Teacher + Placement Head\n');
  console.log('3. Faculty Member to Appoint:');
  console.log('   Email: faculty@schoolerp.com');
  console.log('   Role:  Teacher (Candidate to add to Placement Team)\n');
  console.log('4. College Student Account:');
  console.log('   Email: student@schoolerp.com');
  console.log('   Role:  Student (CS 2026 Batch, CGPA 8.75)\n');
}

run().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
