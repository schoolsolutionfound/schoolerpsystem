import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const { admin, isFirebaseAdminInitialized } = await import('../src/modules/shared/config/firebase.js');
  const { db, dbUpsertUser } = await import('../src/modules/shared/db/index.js');
  const { institutions, admissionCourses, admissionApplications, users } = await import('../src/modules/shared/db/schema.js');
  const { eq, and } = await import('drizzle-orm');

  console.log('=== Setting up Admission Officer Account & Seed Data ===\n');

  if (!db) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  // 1. Get or Create Institution
  let inst = await db.query.institutions.findFirst();
  if (!inst) {
    const [created] = await db
      .insert(institutions)
      .values({
        institutionCode: 'GIS001',
        institutionName: 'Greenfield Institute of Technology',
        institutionType: 'college',
        departments: ['Computer Science', 'Information Science', 'Electronics'],
        academicYears: ['2026 Batch', '2027 Batch'],
        courses: ['B.Tech', 'M.Tech'],
      })
      .returning();
    inst = created;
    console.log('✓ Created College Institution: Greenfield Institute of Technology (Code: GIS001)');
  } else {
    console.log(`✓ Using Institution: ${inst.institutionName} (Code: ${inst.institutionCode}, Type: ${inst.institutionType})`);
  }

  const instCode = inst.institutionCode;
  const instName = inst.institutionName || 'Greenfield Institute of Technology';
  const instType = inst.institutionType || 'college';

  // 2. Setup Firebase Auth & Database for Admission Officer
  const testEmails = ['admission@schoolerp.com', 'addmission@schoolerp.com'];
  const testPassword = 'Pass@123';

  for (const email of testEmails) {
    let firebaseUid = `admission_${Date.now()}`;

    if (isFirebaseAdminInitialized) {
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        firebaseUid = userRecord.uid;
        await admin.auth().updateUser(firebaseUid, {
          password: testPassword,
          displayName: 'Admission Officer',
        });
        console.log(`✓ Firebase account updated for ${email} (Password: ${testPassword})`);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          const userRecord = await admin.auth().createUser({
            email,
            password: testPassword,
            displayName: 'Admission Officer',
          });
          firebaseUid = userRecord.uid;
          console.log(`✓ Firebase account created for ${email} (Password: ${testPassword})`);
        } else {
          console.warn(`Firebase warning for ${email}:`, err.message);
        }
      }
    }

    // Upsert user in Postgres
    await dbUpsertUser({
      firebaseUid,
      email,
      fullName: 'Admission Officer',
      role: 'admission_officer',
      institutionCode: instCode,
      institutionName: instName,
      institutionType: instType as 'school' | 'college',
      mustChangePassword: false,
      profileCompleted: true,
      phone: '+91 98765 00123',
    });

    console.log(`✓ Database user record synchronized for ${email} with role: admission_officer`);
  }

  // 3. Seed Sample Courses for Batch 2026-2027
  const academicYear = '2026-2027';

  const sampleCourses = [
    {
      courseCode: 'CS',
      courseName: 'Computer Science & Engineering',
      programType: 'engineering' as const,
      totalSeats: 120,
      quotas: [
        { quotaName: 'CET', seats: 80 },
        { quotaName: 'Management', seats: 40 },
      ],
    },
    {
      courseCode: 'AIML',
      courseName: 'Artificial Intelligence & Machine Learning',
      programType: 'engineering' as const,
      totalSeats: 60,
      quotas: [
        { quotaName: 'CET', seats: 40 },
        { quotaName: 'Management', seats: 20 },
      ],
    },
    {
      courseCode: 'ECE',
      courseName: 'Electronics & Communication Engineering',
      programType: 'engineering' as const,
      totalSeats: 60,
      quotas: [
        { quotaName: 'CET', seats: 45 },
        { quotaName: 'Management', seats: 15 },
      ],
    },
  ];

  const courseMap: Record<string, string> = {};

  for (const c of sampleCourses) {
    const existing = await db.query.admissionCourses.findFirst({
      where: and(
        eq(admissionCourses.institutionCode, instCode),
        eq(admissionCourses.academicYear, academicYear),
        eq(admissionCourses.courseCode, c.courseCode)
      ),
    });

    if (!existing) {
      const id = `ac_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const [created] = await db
        .insert(admissionCourses)
        .values({
          id,
          institutionCode: instCode,
          academicYear,
          courseCode: c.courseCode,
          courseName: c.courseName,
          programType: c.programType,
          totalSeats: c.totalSeats,
          quotas: c.quotas,
        })
        .returning();
      courseMap[c.courseCode] = created.id;
      console.log(`✓ Seeded course: ${c.courseCode} (${c.totalSeats} seats)`);
    } else {
      courseMap[c.courseCode] = existing.id;
      console.log(`✓ Existing course found: ${c.courseCode}`);
    }
  }

  // 4. Seed Sample Students across Waiting List, Allocated, and Confirmed
  const sampleStudents = [
    // Waiting List
    {
      appNo: 'ADM-2026-101',
      fullName: 'Rahul Sharma',
      parentPhone: '9845012345',
      dob: '2005-04-12',
      fatherName: 'Manoj Sharma',
      motherName: 'Sunita Sharma',
      guardianPhone: '9845099887',
      address: '24, Malleshwaram, Bengaluru',
      bloodGroup: 'B+',
      programType: 'engineering',
      preferredCourseId: courseMap['CS'],
      preferredCourseName: 'Computer Science & Engineering',
      status: 'waiting_list' as const,
      allocatedCourseId: null,
      allocatedCourseName: '',
      allocatedQuota: '',
      notes: 'SSLC 93%, waiting for 1st round CET counseling',
    },
    {
      appNo: 'ADM-2026-102',
      fullName: 'Pooja Hegde',
      parentPhone: '9880054321',
      dob: '2005-08-20',
      fatherName: 'Anand Hegde',
      motherName: 'Geetha Hegde',
      guardianPhone: '9880099000',
      address: '88, Jayanagar 4th Block, Bengaluru',
      bloodGroup: 'O+',
      programType: 'engineering',
      preferredCourseId: courseMap['AIML'],
      preferredCourseName: 'Artificial Intelligence & Machine Learning',
      status: 'waiting_list' as const,
      allocatedCourseId: null,
      allocatedCourseName: '',
      allocatedQuota: '',
      notes: 'Interested in AI / Data Science streams',
    },
    // Allocated (Provisionally held)
    {
      appNo: 'ADM-2026-103',
      fullName: 'Karthik Gowda',
      parentPhone: '9740011223',
      dob: '2005-01-15',
      fatherName: 'Naveen Gowda',
      motherName: 'Lakshmi Gowda',
      guardianPhone: '9740088990',
      address: '15, Rajajinagar, Bengaluru',
      bloodGroup: 'A+',
      programType: 'engineering',
      preferredCourseId: courseMap['CS'],
      preferredCourseName: 'Computer Science & Engineering',
      status: 'allocated' as const,
      allocatedCourseId: courseMap['CS'],
      allocatedCourseName: 'Computer Science & Engineering',
      allocatedQuota: 'CET',
      notes: 'CET Rank 3,850. Provisional seat allotted.',
    },
    {
      appNo: 'ADM-2026-104',
      fullName: 'Ananya Deshmukh',
      parentPhone: '9611122334',
      dob: '2005-09-05',
      fatherName: 'Vijay Deshmukh',
      motherName: 'Kavitha Deshmukh',
      guardianPhone: '',
      address: '42, Indiranagar, Bengaluru',
      bloodGroup: 'AB+',
      programType: 'engineering',
      preferredCourseId: courseMap['AIML'],
      preferredCourseName: 'Artificial Intelligence & Machine Learning',
      status: 'allocated' as const,
      allocatedCourseId: courseMap['AIML'],
      allocatedCourseName: 'Artificial Intelligence & Machine Learning',
      allocatedQuota: 'Management',
      notes: 'Management quota token paid. Pending original 12th marks card.',
    },
    // Confirmed (Admission Finalized & Seat Locked)
    {
      appNo: 'ADM-2026-105',
      fullName: 'Mohammed Zayd',
      parentPhone: '9900112233',
      dob: '2004-12-01',
      fatherName: 'Ibrahim Zayd',
      motherName: 'Farhana Zayd',
      guardianPhone: '9900199887',
      address: '77, Frazer Town, Bengaluru',
      bloodGroup: 'O+',
      programType: 'engineering',
      preferredCourseId: courseMap['CS'],
      preferredCourseName: 'Computer Science & Engineering',
      status: 'confirmed' as const,
      allocatedCourseId: courseMap['CS'],
      allocatedCourseName: 'Computer Science & Engineering',
      allocatedQuota: 'Management',
      notes: 'Admission confirmed. Fee receipt #RCP-8849 generated. Original documents verified.',
    },
  ];

  for (const st of sampleStudents) {
    const existing = await db.query.admissionApplications.findFirst({
      where: and(
        eq(admissionApplications.institutionCode, instCode),
        eq(admissionApplications.applicationNumber, st.appNo)
      ),
    });

    if (!existing) {
      const id = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.insert(admissionApplications).values({
        id,
        institutionCode: instCode,
        academicYear,
        applicationNumber: st.appNo,
        fullName: st.fullName,
        parentPhone: st.parentPhone,
        dob: st.dob,
        fatherName: st.fatherName,
        motherName: st.motherName,
        guardianPhone: st.guardianPhone,
        address: st.address,
        bloodGroup: st.bloodGroup,
        programType: st.programType,
        preferredCourseId: st.preferredCourseId,
        preferredCourseName: st.preferredCourseName,
        status: st.status,
        allocatedCourseId: st.allocatedCourseId,
        allocatedCourseName: st.allocatedCourseName,
        allocatedQuota: st.allocatedQuota,
        allocatedAt: st.status === 'allocated' || st.status === 'confirmed' ? new Date() : null,
        confirmedAt: st.status === 'confirmed' ? new Date() : null,
        notes: st.notes,
        customFields: {
          tenthPercentage: '92.4%',
          twelfthPercentage: '89.6%',
        },
      });
      console.log(`✓ Seeded applicant: ${st.fullName} (${st.status.toUpperCase()})`);
    } else {
      console.log(`✓ Existing applicant found: ${st.fullName}`);
    }
  }

  console.log('\n========================================');
  console.log('🎉 ADMISSION OFFICER READY FOR LOGIN:');
  console.log('Email   : admission@schoolerp.com (or addmission@schoolerp.com)');
  console.log('Password: Pass@123');
  console.log('Role    : admission_officer');
  console.log(`Campus  : ${instName} (${instCode})`);
  console.log('========================================\n');

  process.exit(0);
}

run().catch((err) => {
  console.error('Error creating admission account:', err);
  process.exit(1);
});
