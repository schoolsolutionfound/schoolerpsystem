import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq, and } from 'drizzle-orm';

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function seedUnifiedInstitution() {
  console.log('====================================================');
  console.log('🏛️ SEEDING UNIFIED INSTITUTION: APEX001');
  console.log('====================================================\n');

  const instCode = 'APEX001';
  const instName = 'Apex Global Academy';
  const instType = 'school';

  // 1. PostgreSQL: institutions table
  console.log('[1/7] Provisioning Institution in PostgreSQL...');
  const existingInst = await db.select().from(schema.institutions).where(eq(schema.institutions.institutionCode, instCode));
  let instId = '';
  if (existingInst.length > 0) {
    instId = existingInst[0].id;
    await db.update(schema.institutions).set({
      institutionName: instName,
      institutionType: instType,
      departments: ['Computer Science', 'Mathematics', 'Sciences', 'Humanities'],
      academicYears: ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
      courses: ['CS101 - Intro to AI', 'CS102 - Data Structures', 'MTH10 - Advanced Math'],
      subscriptionStatus: 'active',
    }).where(eq(schema.institutions.id, instId));
    console.log(`✓ Updated institution in DB: ${instCode}`);
  } else {
    instId = newId('inst');
    await db.insert(schema.institutions).values({
      id: instId,
      institutionCode: instCode,
      institutionName: instName,
      institutionType: instType,
      departments: ['Computer Science', 'Mathematics', 'Sciences', 'Humanities'],
      academicYears: ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
      courses: ['CS101 - Intro to AI', 'CS102 - Data Structures', 'MTH10 - Advanced Math'],
      subscriptionStatus: 'active',
    });
    console.log(`✓ Inserted institution in DB: ${instCode}`);
  }

  // 2. Firestore: institutions collection (for Discover feed & Admissions)
  if (isFirebaseAdminInitialized) {
    console.log('[2/7] Syncing Institution to Firestore Discover Feed...');
    const firestore = admin.firestore();
    await firestore.collection('institutions').doc(instCode).set({
      id: instCode,
      institutionCode: instCode,
      institutionName: instName,
      institutionType: instType,
      subscriptionStatus: 'active',
      averageRating: 4.9,
      totalReviews: 88,
      logoUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&auto=format&fit=crop&q=80',
      description: 'Apex Global Academy is an internationally accredited institution offering state-of-the-art STEM, AI labs, and comprehensive pastoral care.',
      facilities: ['Smart Classrooms', 'AI & Robotics Center', 'Indoor Sports Complex', 'Olympic Pool', 'Medical Facility'],
      departments: ['Computer Science', 'Mathematics', 'Sciences', 'Humanities'],
      academicYears: ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`✓ Firestore institution document updated for ${instCode}`);
  }

  // 3. User Accounts Definitions
  console.log('[3/7] Provisioning All Roles in Firebase Auth & PostgreSQL...');
  const usersToSeed = [
    {
      email: 'principal.apex@school.com',
      password: 'Principal@123',
      name: 'Dr. Arthur Vance (Principal)',
      role: 'principal',
      roles: ['principal'],
      scope: { designation: 'Principal & Head of School', employeeId: 'APX-PRIN-01' },
      rollNoOrUSN: '',
    },
    {
      email: 'hod.apex@school.com',
      password: 'Hod@123',
      name: 'Dr. Elena Rostova (HOD CS)',
      role: 'hod',
      roles: ['hod', 'teacher'],
      scope: { department: 'Computer Science', designation: 'Head of Department', employeeId: 'APX-HOD-01' },
      rollNoOrUSN: '',
    },
    {
      email: 'teacher.apex@school.com',
      password: 'Teacher@123',
      name: 'Mr. Marcus Sterling (Teacher)',
      role: 'teacher',
      roles: ['teacher'],
      scope: { department: 'Mathematics', designation: 'Senior Faculty', employeeId: 'APX-TCH-01' },
      rollNoOrUSN: '',
    },
    {
      email: 'student.apex@school.com',
      password: 'Student@123',
      name: 'Aarav Verma (Student)',
      role: 'student',
      roles: ['student'],
      scope: { className: 'Grade 10-A', rollNo: '1', admissionDate: '2026-06-01' },
      rollNoOrUSN: 'APX2026001',
    },
    {
      email: 'parent.apex@school.com',
      password: 'Parent@123',
      name: 'Rohan Verma (Parent)',
      role: 'parent',
      roles: ['parent'],
      scope: {
        linkedStudentUSN: 'APX2026001',
        childName: 'Aarav Verma (Student)',
        relation: 'Father',
        institutionCode: instCode,
        schoolName: instName,
      },
      rollNoOrUSN: '',
    },
    {
      email: 'admin.apex@school.com',
      password: 'Admin@123',
      name: 'Apex Super Administrator',
      role: 'admin',
      roles: ['admin'],
      scope: { designation: 'Campus Operations Lead' },
      rollNoOrUSN: '',
    },
  ];

  const dbUserMap: Record<string, string> = {};

  for (const u of usersToSeed) {
    let fbUid = '';
    if (isFirebaseAdminInitialized) {
      try {
        const existing = await admin.auth().getUserByEmail(u.email);
        fbUid = existing.uid;
        await admin.auth().updateUser(fbUid, {
          password: u.password,
          displayName: u.name,
        });
      } catch {
        const created = await admin.auth().createUser({
          email: u.email,
          password: u.password,
          displayName: u.name,
        });
        fbUid = created.uid;
      }
    } else {
      fbUid = `fb_${u.role}_${Date.now()}`;
    }

    const existingDb = await db.select().from(schema.users).where(eq(schema.users.email, u.email));
    let userId = '';
    if (existingDb.length > 0) {
      userId = existingDb[0].id;
      await db.update(schema.users).set({
        firebaseUid: fbUid,
        fullName: u.name,
        role: u.role,
        roles: u.roles,
        institutionCode: instCode,
        institutionName: instName,
        institutionType: instType,
        rollNoOrUSN: u.rollNoOrUSN,
        scope: u.scope,
        profileCompleted: true,
      }).where(eq(schema.users.id, userId));
    } else {
      userId = newId('usr');
      await db.insert(schema.users).values({
        id: userId,
        firebaseUid: fbUid,
        email: u.email,
        fullName: u.name,
        role: u.role,
        roles: u.roles,
        institutionCode: instCode,
        institutionName: instName,
        institutionType: instType,
        rollNoOrUSN: u.rollNoOrUSN,
        scope: u.scope,
        profileCompleted: true,
        mustChangePassword: false,
      });
    }
    dbUserMap[u.role] = userId;
    console.log(`✓ User setup: ${u.email} [${u.role}] -> Password: ${u.password}`);
  }

  // 4. Class Sections
  console.log('[4/7] Provisioning Class Sections & Enrollment...');
  // 10-A assigned to teacher, 10-B unassigned so Principal can test assignment
  let sec10aId = '';
  const existing10a = await db.select().from(schema.classSections).where(and(
    eq(schema.classSections.institutionCode, instCode),
    eq(schema.classSections.name, 'Grade 10-A')
  ));
  if (existing10a.length > 0) {
    sec10aId = existing10a[0].id;
    await db.update(schema.classSections).set({
      classTeacherId: dbUserMap['teacher'],
      department: 'Secondary Wing',
    }).where(eq(schema.classSections.id, sec10aId));
  } else {
    sec10aId = newId('cs');
    await db.insert(schema.classSections).values({
      id: sec10aId,
      institutionCode: instCode,
      name: 'Grade 10-A',
      academicYear: 'Grade 10',
      section: 'A',
      department: 'Secondary Wing',
      classTeacherId: dbUserMap['teacher'],
      roomNumber: 'Room 301',
      maxCapacity: 35,
    });
  }

  // Grade 10-B (Unassigned)
  const existing10b = await db.select().from(schema.classSections).where(and(
    eq(schema.classSections.institutionCode, instCode),
    eq(schema.classSections.name, 'Grade 10-B')
  ));
  if (existing10b.length === 0) {
    await db.insert(schema.classSections).values({
      id: newId('cs'),
      institutionCode: instCode,
      name: 'Grade 10-B',
      academicYear: 'Grade 10',
      section: 'B',
      department: 'Secondary Wing',
      classTeacherId: null,
      roomNumber: 'Room 302',
      maxCapacity: 35,
    });
  }

  // Enroll Student in 10-A
  const studentDbId = dbUserMap['student'];
  const existingEnrollment = await db.select().from(schema.studentClasses).where(eq(schema.studentClasses.studentId, studentDbId));
  if (existingEnrollment.length === 0) {
    await db.insert(schema.studentClasses).values({
      institutionCode: instCode,
      studentId: studentDbId,
      classSectionId: sec10aId,
      rollNumber: '1',
      status: 'active',
      academicYear: '2025-2026',
    });
  }

  // Update student scope with classSectionId
  await db.update(schema.users).set({
    scope: { classSectionId: sec10aId, className: 'Grade 10-A', rollNo: '1' },
  }).where(eq(schema.users.id, studentDbId));

  // 5. Subjects & Periods
  console.log('[5/7] Provisioning Subjects & Timetable Periods...');
  const subjects = ['Mathematics', 'Computer Science', 'Physics', 'English'];
  for (const sName of subjects) {
    const existingSub = await db.select().from(schema.subjects).where(and(
      eq(schema.subjects.institutionCode, instCode),
      eq(schema.subjects.name, sName)
    ));
    if (existingSub.length === 0) {
      await db.insert(schema.subjects).values({
        institutionCode: instCode,
        name: sName,
        code: `SUB-${sName.slice(0, 3).toUpperCase()}`,
        type: 'core',
      });
    }
  }

  // 6. HOD Department Courses & Exam Eligibility
  console.log('[6/7] Provisioning HOD Courses & Exam Eligibility Hall Ticket...');
  const hodDbId = dbUserMap['hod'];

  // Course 1: CS101 (Assigned to HOD)
  const existingCourse1 = await db.select().from(schema.departmentCourses).where(and(
    eq(schema.departmentCourses.institutionCode, instCode),
    eq(schema.departmentCourses.code, 'CS101')
  ));
  if (existingCourse1.length === 0) {
    await db.insert(schema.departmentCourses).values({
      id: newId('dc'),
      institutionCode: instCode,
      department: 'Computer Science',
      name: 'Introduction to Algorithms & AI',
      code: 'CS101',
      credits: 4,
      semester: 'Semester 1',
      instructorId: hodDbId,
      instructorName: 'Dr. Elena Rostova',
      syllabusProgress: 65,
      totalUnits: 5,
      completedUnits: 3,
      status: 'active',
    });
  }

  // Course 2: CS102 (Unassigned, ready for HOD assignment test)
  const existingCourse2 = await db.select().from(schema.departmentCourses).where(and(
    eq(schema.departmentCourses.institutionCode, instCode),
    eq(schema.departmentCourses.code, 'CS102')
  ));
  if (existingCourse2.length === 0) {
    await db.insert(schema.departmentCourses).values({
      id: newId('dc'),
      institutionCode: instCode,
      department: 'Computer Science',
      name: 'Advanced Data Structures & OOP',
      code: 'CS102',
      credits: 4,
      semester: 'Semester 1',
      instructorId: null,
      instructorName: null,
      syllabusProgress: 15,
      totalUnits: 6,
      completedUnits: 1,
      status: 'active',
    });
  }

  // Exam Eligibility: Student has 72% attendance (Below 75%) -> requires condonation!
  const existingElig = await db.select().from(schema.examEligibility).where(and(
    eq(schema.examEligibility.institutionCode, instCode),
    eq(schema.examEligibility.studentId, studentDbId)
  ));
  if (existingElig.length === 0) {
    await db.insert(schema.examEligibility).values({
      id: newId('elg'),
      institutionCode: instCode,
      studentId: studentDbId,
      studentName: 'Aarav Verma (Student)',
      usn: 'APX2026001',
      semester: 'Semester 1',
      department: 'Computer Science',
      overallAttendancePct: '72.00',
      coursesBelowThreshold: 1,
      internalAssessmentScore: '84.50',
      hallTicketStatus: 'condonation_needed',
      remarks: 'Attendance is 72%. Medical certificate pending HOD review.',
    });
  }

  // 7. Announcements, Counseling & Live Attendance
  console.log('[7/7] Provisioning Announcements, Counseling & Attendance...');

  // School Announcement
  await db.insert(schema.announcements).values({
    id: newId('ann'),
    institutionCode: instCode,
    title: 'Welcome to Academic Year 2026-2027',
    content: 'All faculty, students, and parents are welcomed to the new academic term. Orientation sessions commence this Monday.',
    priority: 'high',
    targetAudience: 'all',
    department: null,
    authorId: dbUserMap['principal'],
    authorName: 'Dr. Arthur Vance (Principal)',
    authorRole: 'principal',
  });

  // Department Memo
  await db.insert(schema.announcements).values({
    id: newId('ann'),
    institutionCode: instCode,
    title: 'CS Dept: Robotics Lab Schedule & Project Milestones',
    content: 'Students enrolled in CS101 must submit their intermediate algorithm project proposals by Friday 5:00 PM.',
    priority: 'normal',
    targetAudience: 'students',
    department: 'Computer Science',
    authorId: hodDbId,
    authorName: 'Dr. Elena Rostova (HOD CS)',
    authorRole: 'hod',
  });

  // Pastoral Counseling Record
  await db.insert(schema.counselingRecords).values({
    id: newId('csl'),
    institutionCode: instCode,
    studentId: studentDbId,
    studentName: 'Aarav Verma (Student)',
    gradeSection: 'Grade 10-A',
    counselorId: dbUserMap['principal'],
    counselorName: 'Dr. Evelyn Reed (Guidance Lead)',
    concernCategory: 'attendance_issue',
    severity: 'medium',
    actionPlan: 'Follow up with father (Rohan Verma) regarding illness leave and catch-up assignments.',
    parentContacted: true,
    status: 'active',
    date: new Date().toISOString().split('T')[0],
  });

  console.log('\n====================================================');
  console.log('🎉 UNIFIED INSTITUTION PROVISIONING COMPLETE!');
  console.log('====================================================\n');
}

seedUnifiedInstitution().then(() => process.exit(0)).catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
