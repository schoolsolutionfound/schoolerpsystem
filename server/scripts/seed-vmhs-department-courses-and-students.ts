import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const INST_CODE = 'VMHS001002';

// 1. Courses for each department
const DEPT_COURSES = [
  // Computer Science & Engineering
  {
    code: 'CS501',
    name: 'Operating Systems & System Programming',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    batchYear: '2023-2027',
    type: 'theory',
    credits: 4,
    instructorName: 'Dr. Linus Torvalds',
    enrolledStudentsCount: 64,
    totalPlannedHours: 52,
    completedHours: 42,
    syllabusProgressPct: 80,
    labBatchesCount: 1,
  },
  {
    code: 'CS502',
    name: 'Database Management Systems & SQL',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    batchYear: '2023-2027',
    type: 'theory',
    credits: 4,
    instructorName: 'Prof. Dennis Ritchie',
    enrolledStudentsCount: 64,
    totalPlannedHours: 50,
    completedHours: 38,
    syllabusProgressPct: 76,
    labBatchesCount: 1,
  },
  {
    code: 'CS505L',
    name: 'Advanced Algorithms & Problem Solving Lab',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    batchYear: '2023-2027',
    type: 'practical_lab',
    credits: 2,
    instructorName: 'Dr. Donald Knuth',
    enrolledStudentsCount: 64,
    totalPlannedHours: 36,
    completedHours: 30,
    syllabusProgressPct: 83,
    labBatchesCount: 3,
  },
  {
    code: 'CS506L',
    name: 'Database Systems & Query Optimization Lab',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    batchYear: '2023-2027',
    type: 'practical_lab',
    credits: 2,
    instructorName: 'Prof. Ada Lovelace',
    enrolledStudentsCount: 64,
    totalPlannedHours: 36,
    completedHours: 32,
    syllabusProgressPct: 88,
    labBatchesCount: 3,
  },
  {
    code: 'CS701',
    name: 'Cloud Computing & Distributed Architecture',
    department: 'Computer Science & Engineering',
    semester: 'Semester 7',
    batchYear: '2022-2026',
    type: 'theory',
    credits: 3,
    instructorName: 'Dr. Tim Berners-Lee',
    enrolledStudentsCount: 58,
    totalPlannedHours: 45,
    completedHours: 39,
    syllabusProgressPct: 86,
    labBatchesCount: 1,
  },
  {
    code: 'CS704E',
    name: 'Applied Machine Learning & Neural Networks',
    department: 'Computer Science & Engineering',
    semester: 'Semester 7',
    batchYear: '2022-2026',
    type: 'elective',
    credits: 3,
    instructorName: 'Dr. Bjarne Stroustrup',
    enrolledStudentsCount: 42,
    totalPlannedHours: 40,
    completedHours: 28,
    syllabusProgressPct: 70,
    labBatchesCount: 1,
  },
  {
    code: 'CS301',
    name: 'Data Structures & Object Oriented Programming',
    department: 'Computer Science & Engineering',
    semester: 'Semester 3',
    batchYear: '2024-2028',
    type: 'theory',
    credits: 4,
    instructorName: 'Prof. Ken Thompson',
    enrolledStudentsCount: 68,
    totalPlannedHours: 54,
    completedHours: 45,
    syllabusProgressPct: 83,
    labBatchesCount: 1,
  },
  {
    code: 'CS305L',
    name: 'Data Structures Implementation Lab',
    department: 'Computer Science & Engineering',
    semester: 'Semester 3',
    batchYear: '2024-2028',
    type: 'practical_lab',
    credits: 2,
    instructorName: 'Prof. James Gosling',
    enrolledStudentsCount: 68,
    totalPlannedHours: 36,
    completedHours: 29,
    syllabusProgressPct: 80,
    labBatchesCount: 3,
  },
  {
    code: 'CS101',
    name: 'Introduction to Programming & C/Python',
    department: 'Computer Science & Engineering',
    semester: 'Semester 1',
    batchYear: '2025-2029',
    type: 'theory',
    credits: 4,
    instructorName: 'Dr. Guido van Rossum',
    enrolledStudentsCount: 72,
    totalPlannedHours: 48,
    completedHours: 44,
    syllabusProgressPct: 91,
    labBatchesCount: 1,
  },

  // Computer Science (BCA/B.Sc)
  {
    code: 'BCA301',
    name: 'Web Technologies & Frameworks',
    department: 'Computer Science (BCA/B.Sc)',
    semester: 'Semester 3',
    batchYear: '2024-2027',
    type: 'theory',
    credits: 4,
    instructorName: 'Dr. Grace Hopper',
    enrolledStudentsCount: 50,
    totalPlannedHours: 45,
    completedHours: 36,
    syllabusProgressPct: 80,
    labBatchesCount: 1,
  },
  {
    code: 'BCA302L',
    name: 'Full-Stack JavaScript Lab',
    department: 'Computer Science (BCA/B.Sc)',
    semester: 'Semester 3',
    batchYear: '2024-2027',
    type: 'practical_lab',
    credits: 2,
    instructorName: 'Prof. Edsger Dijkstra',
    enrolledStudentsCount: 50,
    totalPlannedHours: 36,
    completedHours: 30,
    syllabusProgressPct: 83,
    labBatchesCount: 2,
  },

  // Electronics & Communication
  {
    code: 'EC501',
    name: 'Signals & Digital Signal Processing',
    department: 'Electronics & Communication',
    semester: 'Semester 5',
    batchYear: '2023-2027',
    type: 'theory',
    credits: 4,
    instructorName: 'Dr. Claude Shannon',
    enrolledStudentsCount: 60,
    totalPlannedHours: 50,
    completedHours: 37,
    syllabusProgressPct: 74,
    labBatchesCount: 1,
  },
  {
    code: 'EC505L',
    name: 'DSP & Microcontroller Embedded Lab',
    department: 'Electronics & Communication',
    semester: 'Semester 5',
    batchYear: '2023-2027',
    type: 'practical_lab',
    credits: 2,
    instructorName: 'Prof. Nikola Tesla',
    enrolledStudentsCount: 60,
    totalPlannedHours: 36,
    completedHours: 28,
    syllabusProgressPct: 77,
    labBatchesCount: 2,
  },

  // Artificial Intelligence & Machine Learning
  {
    code: 'AI501',
    name: 'Deep Learning & Neural Architectures',
    department: 'Artificial Intelligence & Machine Learning',
    semester: 'Semester 5',
    batchYear: '2023-2027',
    type: 'theory',
    credits: 4,
    instructorName: 'Dr. Geoffrey Hinton',
    enrolledStudentsCount: 62,
    totalPlannedHours: 52,
    completedHours: 44,
    syllabusProgressPct: 84,
    labBatchesCount: 1,
  },
  {
    code: 'AI505L',
    name: 'PyTorch & Computer Vision Lab',
    department: 'Artificial Intelligence & Machine Learning',
    semester: 'Semester 5',
    batchYear: '2023-2027',
    type: 'practical_lab',
    credits: 2,
    instructorName: 'Prof. Yann LeCun',
    enrolledStudentsCount: 62,
    totalPlannedHours: 36,
    completedHours: 31,
    syllabusProgressPct: 86,
    labBatchesCount: 2,
  },
];

// 2. Realistic Engineering Department Students
const CSE_STUDENTS = [
  {
    name: 'Aarav Sharma',
    usn: '1VM23CS001',
    semester: 'Semester 5',
    section: 'A',
    attendance: 94,
    cgpa: 9.2,
    parentName: 'Ramesh Sharma',
    parentPhone: '+91 98450 11001',
    phone: '+91 98450 22001',
    email: 'aarav.sharma@vmhs.edu',
    status: 'eligible',
  },
  {
    name: 'Diya Kumar',
    usn: '1VM23CS002',
    semester: 'Semester 5',
    section: 'A',
    attendance: 96,
    cgpa: 9.5,
    parentName: 'Sanjay Kumar',
    parentPhone: '+91 98450 11002',
    phone: '+91 98450 22002',
    email: 'diya.kumar@vmhs.edu',
    status: 'eligible',
  },
  {
    name: 'Kabir Singh',
    usn: '1VM23CS003',
    semester: 'Semester 5',
    section: 'A',
    attendance: 68, // Low attendance!
    cgpa: 6.8,
    parentName: 'Gurpreet Singh',
    parentPhone: '+91 98450 11003',
    phone: '+91 98450 22003',
    email: 'kabir.singh@vmhs.edu',
    status: 'condonation_needed',
    condonationReason: 'Medical leave with hospital hospitalization records for Dengue recovery.',
  },
  {
    name: 'Meera Nair',
    usn: '1VM23CS004',
    semester: 'Semester 5',
    section: 'A',
    attendance: 88,
    cgpa: 8.4,
    parentName: 'Gopal Nair',
    parentPhone: '+91 98450 11004',
    phone: '+91 98450 22004',
    email: 'meera.nair@vmhs.edu',
    status: 'eligible',
  },
  {
    name: 'Vivaan Reddy',
    usn: '1VM23CS005',
    semester: 'Semester 5',
    section: 'B',
    attendance: 62, // Critical detention alert!
    cgpa: 6.1,
    parentName: 'Venkat Reddy',
    parentPhone: '+91 98450 11005',
    phone: '+91 98450 22005',
    email: 'vivaan.reddy@vmhs.edu',
    status: 'detained',
    condonationReason: 'Severe shortage of attendance across 3 major lab courses.',
  },
  {
    name: 'Ananya Patel',
    usn: '1VM23CS006',
    semester: 'Semester 5',
    section: 'B',
    attendance: 91,
    cgpa: 8.9,
    parentName: 'Bhavesh Patel',
    parentPhone: '+91 98450 11006',
    phone: '+91 98450 22006',
    email: 'ananya.patel@vmhs.edu',
    status: 'eligible',
  },
  {
    name: 'Rohan Gupta',
    usn: '1VM23CS007',
    semester: 'Semester 5',
    section: 'B',
    attendance: 84,
    cgpa: 8.1,
    parentName: 'Ashok Gupta',
    parentPhone: '+91 98450 11007',
    phone: '+91 98450 22007',
    email: 'rohan.gupta@vmhs.edu',
    status: 'eligible',
  },
  {
    name: 'Ishita Joshi',
    usn: '1VM23CS008',
    semester: 'Semester 5',
    section: 'A',
    attendance: 95,
    cgpa: 9.3,
    parentName: 'Prakash Joshi',
    parentPhone: '+91 98450 11008',
    phone: '+91 98450 22008',
    email: 'ishita.joshi@vmhs.edu',
    status: 'eligible',
  },
  {
    name: 'Tanmay Kulkarni',
    usn: '1VM24CS009',
    semester: 'Semester 3',
    section: 'A',
    attendance: 87,
    cgpa: 8.5,
    parentName: 'Sunil Kulkarni',
    parentPhone: '+91 98450 11009',
    phone: '+91 98450 22009',
    email: 'tanmay.kulkarni@vmhs.edu',
    status: 'eligible',
  },
  {
    name: 'Sneha Deshmukh',
    usn: '1VM24CS010',
    semester: 'Semester 3',
    section: 'A',
    attendance: 71, // Detention alert!
    cgpa: 7.2,
    parentName: 'Vikas Deshmukh',
    parentPhone: '+91 98450 11010',
    phone: '+91 98450 22010',
    email: 'sneha.deshmukh@vmhs.edu',
    status: 'condonation_needed',
    condonationReason: 'Represented state in Inter-University Hackathon in Delhi.',
  },
  {
    name: 'Aditya Iyer',
    usn: '1VM24CS011',
    semester: 'Semester 3',
    section: 'B',
    attendance: 93,
    cgpa: 9.1,
    parentName: 'Subramanian Iyer',
    parentPhone: '+91 98450 11011',
    phone: '+91 98450 22011',
    email: 'aditya.iyer@vmhs.edu',
    status: 'eligible',
  },
  {
    name: 'Pooja Hegde',
    usn: '1VM24CS012',
    semester: 'Semester 3',
    section: 'B',
    attendance: 89,
    cgpa: 8.7,
    parentName: 'Manjunath Hegde',
    parentPhone: '+91 98450 11012',
    phone: '+91 98450 22012',
    email: 'pooja.hegde@vmhs.edu',
    status: 'eligible',
  },
  {
    name: 'Karthik Raja',
    usn: '1VM22CS013',
    semester: 'Semester 7',
    section: 'A',
    attendance: 90,
    cgpa: 8.6,
    parentName: 'Selva Raja',
    parentPhone: '+91 98450 11013',
    phone: '+91 98450 22013',
    email: 'karthik.raja@vmhs.edu',
    status: 'eligible',
  },
  {
    name: 'Nisha Sundaram',
    usn: '1VM22CS014',
    semester: 'Semester 7',
    section: 'A',
    attendance: 98,
    cgpa: 9.8,
    parentName: 'K. Sundaram',
    parentPhone: '+91 98450 11014',
    phone: '+91 98450 22014',
    email: 'nisha.sundaram@vmhs.edu',
    status: 'eligible',
  },
  {
    name: 'Devansh Mishra',
    usn: '1VM25CS015',
    semester: 'Semester 1',
    section: 'A',
    attendance: 92,
    cgpa: 8.8,
    parentName: 'Alok Mishra',
    parentPhone: '+91 98450 11015',
    phone: '+91 98450 22015',
    email: 'devansh.mishra@vmhs.edu',
    status: 'eligible',
  },
  {
    name: 'Rhea Chakraborty',
    usn: '1VM25CS016',
    semester: 'Semester 1',
    section: 'B',
    attendance: 86,
    cgpa: 8.2,
    parentName: 'Debashis Chakraborty',
    parentPhone: '+91 98450 11016',
    phone: '+91 98450 22016',
    email: 'rhea.chakraborty@vmhs.edu',
    status: 'eligible',
  },
];

async function seed() {
  console.log('--- Seeding VMHS Department Courses & Students ---');

  const { db } = await import('../src/modules/shared/db/index.js');
  const schema = await import('../src/modules/shared/db/schema.js');
  const { eq, and } = await import('drizzle-orm');

  if (!db) {
    throw new Error('Database connection failed. DATABASE_URL is not configured or reachable.');
  }

  // 1. Insert Department Courses
  console.log(`Inserting ${DEPT_COURSES.length} department courses...`);
  for (const c of DEPT_COURSES) {
    const existing = await db
      .select()
      .from(schema.departmentCourses)
      .where(
        and(
          eq(schema.departmentCourses.institutionCode, INST_CODE),
          eq(schema.departmentCourses.code, c.code)
        )
      );

    if (existing.length === 0) {
      await db.insert(schema.departmentCourses).values({
        id: `dc_${c.code.toLowerCase()}_${Date.now()}`,
        institutionCode: INST_CODE,
        code: c.code,
        name: c.name,
        department: c.department,
        semester: c.semester,
        batchYear: c.batchYear,
        type: c.type,
        credits: c.credits,
        instructorName: c.instructorName,
        enrolledStudentsCount: c.enrolledStudentsCount,
        totalPlannedHours: c.totalPlannedHours,
        completedHours: c.completedHours,
        syllabusProgressPct: c.syllabusProgressPct,
        labBatchesCount: c.labBatchesCount,
      });
      console.log(`✓ Inserted course: ${c.code} - ${c.name} (${c.department})`);
    } else {
      console.log(`  Course already exists: ${c.code}`);
    }
  }

  // 2. Insert or Update Department Students
  console.log(`\nInserting/Updating ${CSE_STUDENTS.length} CSE Department Students...`);
  for (const s of CSE_STUDENTS) {
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, s.email));

    let studentId = '';
    const scopeData = {
      usn: s.usn,
      admissionNo: s.usn,
      department: 'Computer Science & Engineering',
      deptCode: 'CSE',
      className: s.semester,
      semester: s.semester,
      section: s.section,
      batch: '2023-2027',
      attendance: s.attendance,
      cgpa: s.cgpa,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      phone: s.phone,
    };

    if (existing.length === 0) {
      studentId = `usr_std_${s.usn.toLowerCase()}`;
      await db.insert(schema.users).values({
        id: studentId,
        firebaseUid: `uid_std_${s.usn.toLowerCase()}`,
        institutionCode: INST_CODE,
        institutionName: 'VM Memorial Higher Secondary & Degree College',
        institutionType: 'college',
        fullName: s.name,
        email: s.email,
        phone: s.phone,
        role: 'student',
        roles: ['student'],
        department: 'Computer Science & Engineering',
        profileCompleted: true,
        scope: scopeData,
      });
      console.log(`✓ Created student user: ${s.name} (${s.usn})`);
    } else {
      studentId = existing[0].id;
      await db
        .update(schema.users)
        .set({
          department: 'Computer Science & Engineering',
          scope: scopeData,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, studentId));
      console.log(`✓ Updated student user: ${s.name} (${s.usn})`);
    }

    // 3. Upsert Exam Eligibility Record for this student
    const existingElg = await db
      .select()
      .from(schema.examEligibility)
      .where(
        and(
          eq(schema.examEligibility.institutionCode, INST_CODE),
          eq(schema.examEligibility.usn, s.usn)
        )
      );

    if (existingElg.length === 0) {
      await db.insert(schema.examEligibility).values({
        id: `ee_${s.usn.toLowerCase()}`,
        institutionCode: INST_CODE,
        studentId: studentId,
        studentName: s.name,
        usn: s.usn,
        semester: s.semester,
        department: 'Computer Science & Engineering',
        overallAttendancePct: s.attendance.toFixed(2),
        coursesBelowThreshold: s.attendance < 75 ? 2 : 0,
        internalAssessmentScore: (s.cgpa * 5).toFixed(2),
        hallTicketStatus: s.status,
        condonationReason: s.condonationReason || '',
      });
      console.log(`  ✓ Exam eligibility linked: ${s.usn} -> ${s.status}`);
    }
  }

  console.log('\nSeeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
