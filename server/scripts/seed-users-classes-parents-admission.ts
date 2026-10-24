import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';

const FACULTY_NAMES = [
  'Dr. Rajesh Kulkarni', 'Prof. Sunita Deshmukh', 'Dr. Ramesh Nair', 'Ms. Kavita Sengupta',
  'Mr. Arvind Swaminathan', 'Dr. Meenakshi Sundaram', 'Prof. Vikramaditya Rathore', 'Ms. Pooja Batra',
  'Mr. Sandeep Mukherjee', 'Dr. Preeti Ganguly', 'Prof. Alok Nath', 'Ms. Shweta Tiwari',
  'Mr. Harish Chandra', 'Dr. Nandini Murthy', 'Prof. Deepak Chopra', 'Ms. Ritu Beri',
  'Mr. Manmohan Waris', 'Dr. Tanvi Azmi', 'Prof. Suresh Raina', 'Ms. Neha Kakkar',
  'Mr. Sachin Tendulkar', 'Dr. Sourav Ganguly', 'Prof. Rahul Dravid', 'Ms. Mithali Raj',
  'Mr. Anil Kumble', 'Dr. VVS Laxman', 'Prof. Zaheer Khan', 'Ms. Jhulan Goswami',
  'Mr. Yuvraj Singh', 'Dr. Harbhajan Singh', 'Prof. Virender Sehwag', 'Ms. Smriti Mandhana',
  'Mr. Gautam Gambhir', 'Dr. MS Dhoni', 'Prof. Rohit Sharma', 'Ms. Harmanpreet Kaur',
  'Mr. Virat Kohli', 'Dr. Jasprit Bumrah', 'Prof. Ravindra Jadeja', 'Ms. Deepti Sharma',
  'Mr. KL Rahul', 'Dr. Mohammed Shami', 'Prof. Rishabh Pant', 'Ms. Shafali Verma',
  'Mr. Shreyas Iyer', 'Dr. Hardik Pandya', 'Prof. Suryakumar Yadav', 'Ms. Jemimah Rodrigues'
];

async function seedUsersClassesParentsAdmission() {
  console.log('=== Starting Comprehensive Seeding for Classes, Faculty, Parents, & Admission Officers ===');

  if (!db) {
    console.error('PostgreSQL database connection is unavailable!');
    process.exit(1);
  }

  // ==========================================
  // 1. SEED ADMISSION OFFICERS
  // ==========================================
  console.log('\n--- 1. Seeding Admission Officers ---');
  const admissionOfficers = [
    {
      email: 'admission.vmhs@school.com',
      password: 'Officer@123',
      fullName: 'VMHS Admission Officer',
      institutionCode: 'VMHS001002',
      institutionName: 'VM Memorial Higher Secondary & Degree College',
      institutionType: 'college',
    },
    {
      email: 'admission.pav@school.com',
      password: 'Officer@123',
      fullName: 'Parvez School Admission Officer',
      institutionCode: 'PAV0001',
      institutionName: 'Parvez english medium school',
      institutionType: 'school',
    },
    {
      email: 'admission.greenfield@school.com',
      password: 'Officer@123',
      fullName: 'Greenfield Admission Officer',
      institutionCode: 'TST001',
      institutionName: 'Greenfield International School',
      institutionType: 'school',
    },
  ];

  for (const officer of admissionOfficers) {
    let uid = `uid_adm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    if (isFirebaseAdminInitialized) {
      try {
        const existingFb = await admin.auth().getUserByEmail(officer.email);
        uid = existingFb.uid;
        await admin.auth().updateUser(uid, {
          displayName: officer.fullName,
          password: officer.password,
        });
        console.log(`✓ Firebase updated: ${officer.email}`);
      } catch {
        const createdFb = await admin.auth().createUser({
          email: officer.email,
          password: officer.password,
          displayName: officer.fullName,
        });
        uid = createdFb.uid;
        console.log(`✓ Firebase created: ${officer.email}`);
      }
    }

    const existingDb = await db.select().from(schema.users).where(eq(schema.users.email, officer.email));
    if (existingDb.length > 0) {
      await db.update(schema.users).set({
        firebaseUid: uid,
        fullName: officer.fullName,
        role: 'admission_officer',
        roles: ['admission_officer'],
        institutionCode: officer.institutionCode,
        institutionName: officer.institutionName,
        institutionType: officer.institutionType,
        profileCompleted: true,
        updatedAt: new Date(),
      }).where(eq(schema.users.email, officer.email));
      console.log(`✓ DB updated admission officer: ${officer.email}`);
    } else {
      await db.insert(schema.users).values({
        id: `usr_adm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        firebaseUid: uid,
        email: officer.email,
        fullName: officer.fullName,
        role: 'admission_officer',
        roles: ['admission_officer'],
        institutionCode: officer.institutionCode,
        institutionName: officer.institutionName,
        institutionType: officer.institutionType,
        profileCompleted: true,
        mustChangePassword: false,
        phone: '+91 9876543210',
        scope: { role: 'admission_officer', campus: officer.institutionName },
      });
      console.log(`✓ DB created admission officer: ${officer.email}`);
    }
  }

  // ==========================================
  // 2. ASSIGN / CREATE FACULTY FOR ALL UNASSIGNED CLASSES
  // ==========================================
  console.log('\n--- 2. Checking & Creating Faculty for All Classes ---');
  const targetInstitutions = ['VMHS001002', 'PAV0001', 'TST001', 'APEX001'];

  for (const instCode of targetInstitutions) {
    const classRows = await db.select().from(schema.classSections).where(eq(schema.classSections.institutionCode, instCode));
    console.log(`Institution ${instCode} has ${classRows.length} classes.`);

    let facultyIndex = 0;
    for (const cls of classRows) {
      if (!cls.classTeacherId || cls.classTeacherId.trim() === '') {
        // Create a teacher for this class
        const teacherName = FACULTY_NAMES[facultyIndex % FACULTY_NAMES.length] + (facultyIndex >= FACULTY_NAMES.length ? ` (${facultyIndex + 1})` : '');
        const cleanName = teacherName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');
        const teacherEmail = `${cleanName}.${instCode.toLowerCase()}@faculty.school.com`;
        facultyIndex++;

        let teacherUid = `uid_teach_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        if (isFirebaseAdminInitialized) {
          try {
            const fbU = await admin.auth().getUserByEmail(teacherEmail);
            teacherUid = fbU.uid;
          } catch {
            try {
              const fbNew = await admin.auth().createUser({
                email: teacherEmail,
                password: 'Teacher@123',
                displayName: teacherName,
              });
              teacherUid = fbNew.uid;
            } catch (err: any) {
              console.warn(`[Firebase] Notice for teacher ${teacherEmail}:`, err.message);
            }
          }
        }

        const existingT = await db.select().from(schema.users).where(eq(schema.users.email, teacherEmail));
        let teacherId = '';
        if (existingT.length > 0) {
          teacherId = existingT[0].id;
          await db.update(schema.users).set({
            role: 'teacher',
            roles: ['teacher'],
            department: cls.department || 'Academics',
            scope: { department: cls.department || 'Academics', assignedClass: cls.name },
            updatedAt: new Date(),
          }).where(eq(schema.users.id, teacherId));
        } else {
          teacherId = `usr_teach_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          await db.insert(schema.users).values({
            id: teacherId,
            firebaseUid: teacherUid,
            email: teacherEmail,
            fullName: teacherName,
            role: 'teacher',
            roles: ['teacher'],
            institutionCode: instCode,
            institutionName: cls.name.includes('VM') || instCode === 'VMHS001002' ? 'VM Memorial Higher Secondary & Degree College' : 'School',
            institutionType: instCode === 'VMHS001002' ? 'college' : 'school',
            profileCompleted: true,
            department: cls.department || 'Academics',
            scope: { department: cls.department || 'Academics', assignedClass: cls.name },
          });
        }

        // Assign teacher to class
        await db.update(schema.classSections).set({
          classTeacherId: teacherId,
          updatedAt: new Date(),
        }).where(eq(schema.classSections.id, cls.id));

        console.log(`✓ Assigned ${teacherName} (${teacherEmail}) as class teacher to "${cls.name}" (${cls.id})`);
      }
    }
  }

  // ==========================================
  // 3. CREATE PARENTS FOR EACH STUDENT
  // ==========================================
  console.log('\n--- 3. Creating & Linking Parents for All Students ---');
  for (const instCode of targetInstitutions) {
    const students = await db.select().from(schema.users).where(
      and(
        eq(schema.users.institutionCode, instCode),
        eq(schema.users.role, 'student')
      )
    );
    console.log(`Institution ${instCode} has ${students.length} students. Checking parents...`);

    // Fetch existing parents in this institution
    const existingParents = await db.select().from(schema.users).where(
      and(
        eq(schema.users.institutionCode, instCode),
        eq(schema.users.role, 'parent')
      )
    );
    const linkedChildIds = new Set<string>();
    for (const p of existingParents) {
      const scope = p.scope && typeof p.scope === 'object' ? p.scope as any : {};
      if (scope.childId) linkedChildIds.add(scope.childId);
    }

    let createdParentCount = 0;
    for (const student of students) {
      if (linkedChildIds.has(student.id)) continue;

      // Extract last name for parent
      const nameParts = student.fullName.trim().split(' ');
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : student.fullName;
      const parentName = `Mr. ${lastName} (Parent of ${nameParts[0]})`;
      const cleanEmail = student.email.replace(/@.*/, '').replace(/[^a-z0-9]/gi, '.');
      const parentEmail = `parent.${cleanEmail}.${instCode.toLowerCase()}@schoolerp.test`;

      const parentUid = `uid_par_${student.id}_${Date.now().toString().slice(-4)}`;

      // Insert parent record into DB
      await db.insert(schema.users).values({
        id: `usr_par_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        firebaseUid: parentUid,
        email: parentEmail,
        fullName: parentName,
        role: 'parent',
        roles: ['parent'],
        institutionCode: instCode,
        institutionName: student.institutionName,
        institutionType: student.institutionType,
        profileCompleted: true,
        mustChangePassword: false,
        phone: '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
        scope: {
          childId: student.id,
          childName: student.fullName,
          linkedStudentUSN: student.rollNoOrUSN,
          relation: 'Father',
        },
      });

      linkedChildIds.add(student.id);
      createdParentCount++;
    }

    console.log(`✓ Created & linked ${createdParentCount} parents in institution ${instCode}.`);
  }

  // Also create a primary test parent in Firebase for quick login
  if (isFirebaseAdminInitialized) {
    try {
      const demoParentEmail = 'parent.vmhs@school.com';
      let demoUid = '';
      try {
        const p = await admin.auth().getUserByEmail(demoParentEmail);
        demoUid = p.uid;
      } catch {
        const p = await admin.auth().createUser({
          email: demoParentEmail,
          password: 'Parent@123',
          displayName: 'VMHS Parent Representative',
        });
        demoUid = p.uid;
      }

      // Link to first VMHS student
      const firstStudent = await db.select().from(schema.users).where(
        and(
          eq(schema.users.institutionCode, 'VMHS001002'),
          eq(schema.users.role, 'student')
        )
      ).limit(1);

      if (firstStudent.length > 0) {
        const existingDemoP = await db.select().from(schema.users).where(eq(schema.users.email, demoParentEmail));
        if (existingDemoP.length > 0) {
          await db.update(schema.users).set({
            firebaseUid: demoUid,
            scope: {
              childId: firstStudent[0].id,
              childName: firstStudent[0].fullName,
              linkedStudentUSN: firstStudent[0].rollNoOrUSN,
              relation: 'Father',
            },
          }).where(eq(schema.users.email, demoParentEmail));
        } else {
          await db.insert(schema.users).values({
            id: `usr_demoparent_${Date.now()}`,
            firebaseUid: demoUid,
            email: demoParentEmail,
            fullName: 'VMHS Parent Representative',
            role: 'parent',
            roles: ['parent'],
            institutionCode: 'VMHS001002',
            institutionName: 'VM Memorial Higher Secondary & Degree College',
            institutionType: 'college',
            profileCompleted: true,
            mustChangePassword: false,
            phone: '+91 9988776655',
            scope: {
              childId: firstStudent[0].id,
              childName: firstStudent[0].fullName,
              linkedStudentUSN: firstStudent[0].rollNoOrUSN,
              relation: 'Father',
            },
          });
        }
        console.log(`✓ Master Demo Parent created: ${demoParentEmail} (Password: Parent@123) linked to ${firstStudent[0].fullName}`);
      }
    } catch (err: any) {
      console.warn('[Firebase] Master Demo Parent notice:', err.message);
    }
  }

  console.log('\n✨ ALL USERS, FACULTY FOR CLASSES, PARENTS, AND ADMISSION OFFICERS SEEDED SUCCESSFULLY! ✨');
  process.exit(0);
}

seedUsersClassesParentsAdmission().catch((err) => {
  console.error('Seed script error:', err);
  process.exit(1);
});
