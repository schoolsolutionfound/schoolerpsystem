import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function main() {
  if (!db) {
    console.error('Database connection not available.');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('🚀 SEEDING COMPREHENSIVE DUMMY DATA FOR SCHOOL ERP');
  console.log('====================================================\n');

  // ==========================================
  // 1. FIRESTORE SEED (School Discovery & Admissions)
  // ==========================================
  if (isFirebaseAdminInitialized) {
    console.log('[1/7] Seeding Firestore: Institutions & Discovery Feed...');
    const firestore = admin.firestore();

    const firestoreSchools = [
      {
        id: 'TST001',
        institutionCode: 'TST001',
        institutionName: 'Greenfield International School',
        institutionType: 'school',
        subscriptionStatus: 'active',
        averageRating: 4.8,
        totalReviews: 142,
        logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
        description: 'Greenfield International is a premier CBSE institution offering world-class academics, vibrant sports programs, and robotics labs from Kindergarten through Grade 12.',
        facilities: ['Smart Classrooms', 'Olympic Swimming Pool', 'Robotics & AI Lab', 'Basketball & Cricket Turf', 'AC Transport'],
        departments: ['Science', 'Mathematics', 'English', 'Social Studies', 'Computer Science'],
        academicYears: ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'OAK002',
        institutionCode: 'OAK002',
        institutionName: 'Oakridge World Academy',
        institutionType: 'school',
        subscriptionStatus: 'active',
        averageRating: 4.9,
        totalReviews: 98,
        logoUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&auto=format&fit=crop&q=80',
        description: 'An authorized IB World School fostering inquisitive young minds through experiential global curricula, performing arts, and international exchange opportunities.',
        facilities: ['IB Curriculum', 'Auditorium & Amphitheater', 'Indoor Badminton Court', 'Organic Cafeteria', 'Day Boarding'],
        departments: ['Humanities', 'Sciences', 'Visual Arts', 'Languages'],
        academicYears: ['PYP 1-5', 'MYP 1-5', 'DP 1-2'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'DPS003',
        institutionCode: 'DPS003',
        institutionName: 'Delhi Public Academy',
        institutionType: 'school',
        subscriptionStatus: 'active',
        averageRating: 4.7,
        totalReviews: 215,
        logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80',
        description: 'Excellence in education since 1995. Emphasizing disciplined learning, national competitive exam prep (JEE/NEET), and leadership skills.',
        facilities: ['Science Innovation Park', 'Digital Library', 'Hostel Facilities', 'Football Ground', 'Medical Center'],
        departments: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Commerce'],
        academicYears: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'STX004',
        institutionCode: 'STX004',
        institutionName: "St. Xavier's High School",
        institutionType: 'school',
        subscriptionStatus: 'active',
        averageRating: 4.6,
        totalReviews: 180,
        logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80',
        description: 'Holistic character building and ICSE curriculum with century-old heritage, distinguished alumni, and championship athletics.',
        facilities: ['Heritage Campus', 'Music Conservatory', 'Tennis Courts', 'Chapel & Meditation Hall'],
        departments: ['English', 'History', 'Geography', 'Mathematics', 'Physical Education'],
        academicYears: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'HCS005',
        institutionCode: 'HCS005',
        institutionName: 'The Heritage Cambridge International',
        institutionType: 'school',
        subscriptionStatus: 'active',
        averageRating: 4.9,
        totalReviews: 165,
        logoUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
        description: 'Global benchmark education offering Cambridge IGCSE and A-Levels with modern STEAM research centers, equestrian training, and dual-language immersion.',
        facilities: ['Cambridge IGCSE & A-Levels', 'STEAM Research Hub', 'Horse Riding Academy', 'All-Weather Athletics Track'],
        departments: ['Sciences', 'Economics', 'English Literature', 'Design Technology'],
        academicYears: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'AS Level', 'A Level'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'LEM006',
        institutionCode: 'LEM006',
        institutionName: 'Little Explorers Montessori Academy',
        institutionType: 'school',
        subscriptionStatus: 'active',
        averageRating: 4.8,
        totalReviews: 88,
        logoUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
        description: 'Nurturing discovery-based learning from Toddlers to Grade 5 with authentic Montessori apparatus, organic kitchen garden, and child-centric creative studios.',
        facilities: ['Montessori Apparatus Labs', 'Child Splash Pool', 'Sensory Discovery Garden', 'Day Care & Nutritionist'],
        departments: ['Early Childhood', 'Primary Foundations', 'Arts & Music'],
        academicYears: ['Nursery', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const s of firestoreSchools) {
      await firestore.collection('institutions').doc(s.id).set(s, { merge: true });
      console.log(`  ✓ Firestore School: ${s.institutionName} (${s.id})`);
    }

    console.log('\n[2/7] Seeding Firestore: Sample Admission Applications...');
    const parentUid = 'DBx7zPa2E9ahU95HK2rVHrdKaIA2'; // safwan.parent@gmail.com
    const sampleAdmissions = [
      {
        id: 'adm_safwan_tst001',
        parentId: parentUid,
        schoolId: 'TST001',
        childFullName: 'Safwan Haneef',
        childAge: 12,
        childGender: 'male',
        previousSchool: 'Sunrise Primary School',
        gradeApplyingFor: 'Grade 6',
        status: 'accepted',
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'adm_amina_oak002',
        parentId: parentUid,
        schoolId: 'OAK002',
        childFullName: 'Amina Haneef',
        childAge: 6,
        childGender: 'female',
        previousSchool: 'Little Angels Nursery',
        gradeApplyingFor: 'Grade 1',
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'adm_zayd_dps003',
        parentId: parentUid,
        schoolId: 'DPS003',
        childFullName: 'Zayd Haneef',
        childAge: 9,
        childGender: 'male',
        previousSchool: 'Greenfield Primary',
        gradeApplyingFor: 'Grade 4',
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'adm_rohan_tst001',
        parentId: 'parent_uid_sample_rohan',
        schoolId: 'TST001',
        childFullName: 'Rohan Mehta',
        childAge: 11,
        childGender: 'male',
        previousSchool: 'St. Marys Convent',
        gradeApplyingFor: 'Grade 6',
        status: 'pending',
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      },
    ];

    for (const adm of sampleAdmissions) {
      await firestore.collection('admissions').doc(adm.id).set(adm, { merge: true });
      console.log(`  ✓ Admission: ${adm.childFullName} -> ${adm.schoolId} [${adm.status}]`);
    }
  }

  // ==========================================
  // 2. POSTGRESQL INSTITUTIONS & CLASSES
  // ==========================================
  console.log('\n[3/7] Seeding PostgreSQL: Institutions & Class Sections...');
  const instCode = 'TST001';
  const instName = 'Greenfield International School';

  const existingInst = await db.select().from(schema.institutions).where(eq(schema.institutions.institutionCode, instCode));
  if (existingInst.length === 0) {
    await db.insert(schema.institutions).values({
      institutionCode: instCode,
      institutionName: instName,
      institutionType: 'school',
      departments: ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science'],
      academicYears: ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
      courses: ['Primary', 'Middle School', 'High School'],
    });
  }

  // Classes
  const classNames = ['Class 6 A', 'Class 6 B', 'Class 5 A', 'Class 10 A'];
  const classMap: Record<string, string> = {};

  for (const name of classNames) {
    const existing = await db.select().from(schema.classSections).where(eq(schema.classSections.name, name));
    if (existing.length > 0) {
      classMap[name] = existing[0].id;
    } else {
      const [inserted] = await db.insert(schema.classSections).values({
        institutionCode: instCode,
        name,
        department: name.includes('10') ? 'High School' : 'Middle School',
        academicYear: name.includes('10') ? 'Grade 10' : name.includes('5') ? 'Grade 5' : 'Grade 6',
        section: name.endsWith('A') ? 'A' : 'B',
      }).returning();
      classMap[name] = inserted.id;
    }
  }
  const class6aId = classMap['Class 6 A'];
  console.log(`  ✓ Class 6 A ID: ${class6aId}`);

  // ==========================================
  // 3. SUBJECTS & PERIODS
  // ==========================================
  console.log('\n[4/7] Seeding PostgreSQL: Subjects & Periods...');
  const subjectList = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Science', code: 'SCI' },
    { name: 'English', code: 'ENG' },
    { name: 'Social Studies', code: 'SST' },
    { name: 'Computer Science', code: 'CS' },
    { name: 'Physical Education', code: 'PE' },
  ];
  const subjectMap: Record<string, string> = {};

  for (const sub of subjectList) {
    const existing = await db.select().from(schema.subjects).where(eq(schema.subjects.name, sub.name));
    if (existing.length > 0) {
      subjectMap[sub.name] = existing[0].id;
    } else {
      const [ins] = await db.insert(schema.subjects).values({
        institutionCode: instCode,
        name: sub.name,
        code: sub.code,
      }).returning();
      subjectMap[sub.name] = ins.id;
    }
  }

  // Periods
  const periodData = [
    { label: 'Period 1', startTime: '09:00', endTime: '10:00', sortOrder: 1 },
    { label: 'Period 2', startTime: '10:00', endTime: '11:00', sortOrder: 2 },
    { label: 'Period 3', startTime: '11:00', endTime: '12:00', sortOrder: 3 },
    { label: 'Period 4', startTime: '13:00', endTime: '14:00', sortOrder: 4 },
    { label: 'Period 5', startTime: '14:00', endTime: '15:00', sortOrder: 5 },
    { label: 'Period 6', startTime: '15:00', endTime: '16:00', sortOrder: 6 },
  ];
  const periodIds: string[] = [];

  for (const p of periodData) {
    const existing = await db.select().from(schema.periods).where(eq(schema.periods.label, p.label));
    if (existing.length > 0) {
      periodIds.push(existing[0].id);
    } else {
      const [ins] = await db.insert(schema.periods).values({
        institutionCode: instCode,
        ...p,
      }).returning();
      periodIds.push(ins.id);
    }
  }

  // ==========================================
  // 4. USERS (Teachers & Students)
  // ==========================================
  console.log('\n[5/7] Seeding PostgreSQL: Teachers & Students...');

  // Teachers
  const teacherDefs = [
    { email: 'kadar@gmail.com', name: 'Mr Kadar', subject: 'Mathematics' },
    { email: 'anita.teacher@schoolerp.test', name: 'Ms Anita Desai', subject: 'Science' },
    { email: 'vivek.teacher@schoolerp.test', name: 'Mr Vivek Sharma', subject: 'English' },
    { email: 'priya.teacher@schoolerp.test', name: 'Ms Priya Patel', subject: 'Social Studies' },
    { email: 'rohan.teacher@schoolerp.test', name: 'Mr Rohan Verma', subject: 'Computer Science' },
  ];

  const teacherMap: Record<string, string> = {};
  for (const t of teacherDefs) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, t.email));
    let tId = '';
    if (existing.length > 0) {
      tId = existing[0].id;
    } else {
      tId = newId('usr');
      await db.insert(schema.users).values({
        id: tId,
        firebaseUid: `uid_teacher_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        email: t.email,
        fullName: t.name,
        role: 'teacher',
        institutionCode: instCode,
        institutionName: instName,
        institutionType: 'school',
        profileCompleted: true,
        scope: { department: t.subject },
      });
    }
    teacherMap[t.subject] = tId;
  }

  // Assign Kadar as class teacher of Class 6 A
  await db.update(schema.classSections)
    .set({ classTeacherId: teacherMap['Mathematics'] })
    .where(eq(schema.classSections.id, class6aId));

  // Subject-Teacher mappings
  for (const [subName, tId] of Object.entries(teacherMap)) {
    const sId = subjectMap[subName];
    if (sId && tId) {
      const existing = await db.select().from(schema.subjectTeachers)
        .where(eq(schema.subjectTeachers.classSectionId, class6aId));
      const hasMatch = existing.some(e => e.subjectId === sId);
      if (!hasMatch) {
        await db.insert(schema.subjectTeachers).values({
          institutionCode: instCode,
          classSectionId: class6aId,
          subjectId: sId,
          teacherId: tId,
        });
      }
    }
  }

  // Students in Class 6 A
  const studentDefs = [
    { email: 'safwanhaneef786@gmail.com', name: 'Safwan Haneef', roll: '1', usn: 'TST2026001', fbUid: '9mVRCcpLIGbJpkkpLbAk2woLTXG2' },
    { email: 'aarav.student@schoolerp.test', name: 'Aarav Sharma', roll: '2', usn: 'TST2026002' },
    { email: 'priya.student@schoolerp.test', name: 'Priya Verma', roll: '3', usn: 'TST2026003' },
    { email: 'rohan.student@schoolerp.test', name: 'Rohan Gupta', roll: '4', usn: 'TST2026004' },
    { email: 'sneha.student@schoolerp.test', name: 'Sneha Patil', roll: '5', usn: 'TST2026005' },
    { email: 'arjun.student@schoolerp.test', name: 'Arjun Reddy', roll: '6', usn: 'TST2026006' },
    { email: 'ananya.student@schoolerp.test', name: 'Ananya Rao', roll: '7', usn: 'TST2026007' },
    { email: 'vikram.student@schoolerp.test', name: 'Vikram Singh', roll: '8', usn: 'TST2026008' },
  ];

  const studentIds: string[] = [];
  let safwanStudentId = '';

  for (const s of studentDefs) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, s.email));
    let sId = '';
    if (existing.length > 0) {
      sId = existing[0].id;
      await db.update(schema.users).set({
        rollNoOrUSN: s.usn,
        scope: { classSectionId: class6aId, className: 'Class 6 A', rollNo: s.roll },
      }).where(eq(schema.users.id, sId));
    } else {
      sId = newId('usr');
      await db.insert(schema.users).values({
        id: sId,
        firebaseUid: s.fbUid || `uid_student_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        email: s.email,
        fullName: s.name,
        role: 'student',
        institutionCode: instCode,
        institutionName: instName,
        institutionType: 'school',
        rollNoOrUSN: s.usn,
        profileCompleted: true,
        scope: { classSectionId: class6aId, className: 'Class 6 A', rollNo: s.roll },
      });
    }

    if (s.email.includes('safwanhaneef786')) {
      safwanStudentId = sId;
    }
    studentIds.push(sId);

    // Ensure enrollment in student_classes
    const sc = await db.select().from(schema.studentClasses)
      .where(eq(schema.studentClasses.studentId, sId));
    if (sc.length === 0) {
      await db.insert(schema.studentClasses).values({
        institutionCode: instCode,
        studentId: sId,
        classSectionId: class6aId,
        rollNo: s.roll,
        academicYear: 'Grade 6',
      });
    }
  }

  // Ensure Existing Parent User has child linked
  const parentEmail = 'safwan.parent@gmail.com';
  const existingParent = await db.select().from(schema.users).where(eq(schema.users.email, parentEmail));
  if (existingParent.length > 0) {
    await db.update(schema.users).set({
      scope: {
        linkedStudentUSN: 'TST2026001',
        childName: 'Safwan Haneef',
        childId: safwanStudentId,
        relation: 'Father',
      },
    }).where(eq(schema.users.email, parentEmail));
  }

  // Create / Ensure Normal Prospective Parent (No child enrolled yet)
  const normalParentEmail = 'normal.parent@gmail.com';
  let normalParentUid = 'uid_normal_parent_demo';
  if (isFirebaseAdminInitialized) {
    try {
      const u = await admin.auth().getUserByEmail(normalParentEmail);
      normalParentUid = u.uid;
      await admin.auth().updateUser(normalParentUid, { password: 'Parent@123', displayName: 'Amina Siddiqui' });
    } catch {
      const created = await admin.auth().createUser({ email: normalParentEmail, password: 'Parent@123', displayName: 'Amina Siddiqui' });
      normalParentUid = created.uid;
    }
  }

  const existingNormalParent = await db.select().from(schema.users).where(eq(schema.users.email, normalParentEmail));
  if (existingNormalParent.length === 0) {
    await db.insert(schema.users).values({
      id: newId('usr'),
      firebaseUid: normalParentUid,
      email: normalParentEmail,
      fullName: 'Amina Siddiqui',
      role: 'parent',
      institutionCode: '',
      institutionName: 'Prospective Parent',
      institutionType: 'school',
      profileCompleted: true,
      mustChangePassword: false,
      scope: {},
    });
  } else {
    await db.update(schema.users).set({
      firebaseUid: normalParentUid,
      fullName: 'Amina Siddiqui',
      role: 'parent',
      institutionCode: '',
      institutionName: 'Prospective Parent',
      institutionType: 'school',
      profileCompleted: true,
      mustChangePassword: false,
      scope: {},
    }).where(eq(schema.users.email, normalParentEmail));
  }

  // ==========================================
  // 5. TIMETABLE & SLOTS
  // ==========================================
  console.log('\n[6/7] Seeding PostgreSQL: Weekly Timetable for Class 6 A...');
  const existingTt = await db.select().from(schema.timetables).where(eq(schema.timetables.classSectionId, class6aId));
  let ttId = '';
  if (existingTt.length > 0) {
    ttId = existingTt[0].id;
  } else {
    const [ins] = await db.insert(schema.timetables).values({
      institutionCode: instCode,
      classSectionId: class6aId,
      academicYear: 'Grade 6',
      term: 'Term 1',
      version: 1,
      effectiveFrom: '2026-01-01',
      createdBy: 'admin',
    }).returning();
    ttId = ins.id;
  }

  // Slots: Days 1 to 5 (Mon-Fri)
  const slotOrder = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Physical Education'];
  let firstSlotId = '';

  for (let day = 1; day <= 5; day++) {
    for (let pIdx = 0; pIdx < Math.min(periodIds.length, slotOrder.length); pIdx++) {
      const subName = slotOrder[(pIdx + day - 1) % slotOrder.length];
      const sId = subjectMap[subName];
      const tId = teacherMap[subName] || teacherMap['Mathematics'];
      const pId = periodIds[pIdx];

      if (sId && tId && pId) {
        const existingSlot = await db.select().from(schema.timetableSlots)
          .where(eq(schema.timetableSlots.timetableId, ttId));
        const matched = existingSlot.find(s => s.dayOfWeek === day && s.periodId === pId);

        if (!matched) {
          const [insSlot] = await db.insert(schema.timetableSlots).values({
            timetableId: ttId,
            institutionCode: instCode,
            classSectionId: class6aId,
            subjectId: sId,
            teacherId: tId,
            periodId: pId,
            dayOfWeek: day,
            room: `Room 20${day}`,
          }).returning();
          if (!firstSlotId) firstSlotId = insSlot.id;
        } else if (!firstSlotId) {
          firstSlotId = matched.id;
        }
      }
    }
  }

  // ==========================================
  // 6. ATTENDANCE (History for past 10 days)
  // ==========================================
  console.log('\n[7/7] Seeding PostgreSQL: Attendance, Exams, Marks, Homework, & Fees...');
  if (firstSlotId) {
    const existingRecs = await db.select().from(schema.attendanceRecords)
      .where(eq(schema.attendanceRecords.timetableSlotId, firstSlotId));

    if (existingRecs.length < 5) {
      for (let i = 1; i <= 10; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        try {
          const [rec] = await db.insert(schema.attendanceRecords).values({
            institutionCode: instCode,
            timetableSlotId: firstSlotId,
            date: dateStr,
            takenByTeacherId: teacherMap['Mathematics'],
            status: 'submitted',
          }).returning();

          for (const sId of studentIds) {
            // Safwan is present 9 out of 10 times (90% attendance)
            const isSafwan = (sId === safwanStudentId);
            const status = isSafwan
              ? (i === 4 ? 'late' : 'present')
              : (i % 3 === 0 ? 'absent' : 'present');

            await db.insert(schema.attendanceEntries).values({
              attendanceRecordId: rec.id,
              studentId: sId,
              attendanceStatus: status,
              remarks: status === 'late' ? 'School bus delayed' : '',
            });
          }
        } catch {}
      }
      console.log('  ✓ Attendance entries created (90% attendance for Safwan)');
    }
  }

  // Exams & Marks
  const existingExam = await db.select().from(schema.exams).where(eq(schema.exams.name, 'Mid-Term Examination 2026'));
  let examId = '';
  if (existingExam.length > 0) {
    examId = existingExam[0].id;
  } else {
    const [insExam] = await db.insert(schema.exams).values({
      institutionCode: instCode,
      name: 'Mid-Term Examination 2026',
      term: 'Term 1',
      academicYear: 'Grade 6',
      startDate: '2026-02-10',
      endDate: '2026-02-20',
      status: 'published',
      createdBy: 'admin',
    }).returning();
    examId = insExam.id;
  }

  const marksData: Record<string, number> = {
    'Mathematics': 94,
    'Science': 89,
    'English': 87,
    'Social Studies': 92,
    'Computer Science': 98,
  };

  for (const [sName, score] of Object.entries(marksData)) {
    const sId = subjectMap[sName];
    if (!sId) continue;

    const existingEs = await db.select().from(schema.examSubjects).where(eq(schema.examSubjects.examId, examId));
    let esId = existingEs.find(e => e.subjectId === sId)?.id;
    if (!esId) {
      const [insEs] = await db.insert(schema.examSubjects).values({
        examId,
        institutionCode: instCode,
        subjectId: sId,
        maxMarks: 100,
        passMarks: 35,
      }).returning();
      esId = insEs.id;
    }

    if (safwanStudentId && esId) {
      const existingMark = await db.select().from(schema.marks)
        .where(eq(schema.marks.studentId, safwanStudentId));
      const hasMark = existingMark.some(m => m.subjectId === sId);
      if (!hasMark) {
        await db.insert(schema.marks).values({
          examId,
          examSubjectId: esId,
          institutionCode: instCode,
          studentId: safwanStudentId,
          classSectionId: class6aId,
          subjectId: sId,
          marksObtained: score.toString(),
          grade: score >= 90 ? 'A+' : score >= 80 ? 'A' : 'B',
          remarks: 'Outstanding performance!',
          enteredBy: teacherMap[sName] || teacherMap['Mathematics'],
        });
      }
    }
  }
  console.log('  ✓ Mid-Term Examination 2026 & Student Marks populated');

  // Homework
  const homeworkList = [
    { title: 'Algebra: Linear Equations Exercise 4.2', sub: 'Mathematics', due: '2026-09-25', priority: 'high' },
    { title: 'Solar System Planetary Orbit Model', sub: 'Science', due: '2026-09-28', priority: 'normal' },
    { title: 'English Essay: The Future of AI in Schools', sub: 'English', due: '2026-09-24', priority: 'normal' },
    { title: 'Python Basic Calculator Project', sub: 'Computer Science', due: '2026-09-30', priority: 'high' },
  ];

  for (const hw of homeworkList) {
    const sId = subjectMap[hw.sub];
    const tId = teacherMap[hw.sub] || teacherMap['Mathematics'];
    if (sId && tId) {
      const existingHw = await db.select().from(schema.homework).where(eq(schema.homework.title, hw.title));
      if (existingHw.length === 0) {
        await db.insert(schema.homework).values({
          institutionCode: instCode,
          classSectionId: class6aId,
          subjectId: sId,
          teacherId: tId,
          title: hw.title,
          description: `Please complete all questions from the textbook and submit your notebook by ${hw.due}.`,
          dueDate: hw.due,
          assignedDate: '2026-09-18',
          priority: hw.priority,
          status: 'active',
          createdBy: tId,
        });
      }
    }
  }
  console.log('  ✓ Homework assignments created');

  // Fee Structures & Payments
  const existingFs = await db.select().from(schema.feeStructures).where(eq(schema.feeStructures.institutionCode, instCode));
  if (existingFs.length === 0) {
    const [fs1] = await db.insert(schema.feeStructures).values({
      institutionCode: instCode,
      classSectionId: class6aId,
      title: 'Term 1 Tuition Fee',
      category: 'student_fee',
      amount: '45000.00',
      term: 'Term 1',
      academicYear: 'Grade 6',
      dueDate: '2026-04-15',
      status: 'active',
    }).returning();

    const [fs2] = await db.insert(schema.feeStructures).values({
      institutionCode: instCode,
      classSectionId: class6aId,
      title: 'Annual Transport / Bus Fee',
      category: 'transport',
      amount: '12000.00',
      term: 'Term 1',
      academicYear: 'Grade 6',
      dueDate: '2026-04-15',
      status: 'active',
    }).returning();

    const [fs3] = await db.insert(schema.feeStructures).values({
      institutionCode: instCode,
      classSectionId: class6aId,
      title: 'STEM & Computer Laboratory Fee',
      category: 'lab_fee',
      amount: '8000.00',
      term: 'Term 1',
      academicYear: 'Grade 6',
      dueDate: '2026-10-30',
      status: 'active',
    }).returning();

    if (safwanStudentId) {
      await db.insert(schema.feePayments).values({
        institutionCode: instCode,
        feeStructureId: fs1.id,
        studentId: safwanStudentId,
        amount: '45000.00',
        paymentMethod: 'upi',
        paymentDate: '2026-04-10',
        status: 'paid',
        receiptNo: 'RCP-2026-0041',
        notes: 'Paid via Google Pay UPI',
      });

      await db.insert(schema.feePayments).values({
        institutionCode: instCode,
        feeStructureId: fs2.id,
        studentId: safwanStudentId,
        amount: '12000.00',
        paymentMethod: 'net_banking',
        paymentDate: '2026-04-12',
        status: 'paid',
        receiptNo: 'RCP-2026-0042',
        notes: 'Route #4 Bus Paid',
      });
    }
    console.log('  ✓ Fee structures & paid receipts created');
  }

  console.log('\n====================================================');
  console.log('✨ ALL DUMMY DATA SEEDED SUCCESSFULLY!');
  console.log('====================================================');
}

main().catch(console.error);
