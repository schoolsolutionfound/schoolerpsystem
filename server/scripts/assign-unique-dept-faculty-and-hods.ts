import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq, and } from 'drizzle-orm';

interface DeptConfig {
  deptName: string;
  hodName: string;
  hodEmail: string;
  teacherPool: string[];
}

const DEPARTMENTS: Record<string, DeptConfig> = {
  'CSE': {
    deptName: 'Computer Science & Engineering',
    hodName: 'Dr. Linus Torvalds',
    hodEmail: 'hod.cse@vmhs.com',
    teacherPool: [
      'Prof. Dennis Ritchie', 'Dr. Donald Knuth', 'Prof. Ada Lovelace',
      'Dr. Tim Berners-Lee', 'Prof. Ken Thompson', 'Dr. Bjarne Stroustrup',
      'Prof. James Gosling', 'Dr. Guido van Rossum', 'Prof. Leslie Lamport',
      'Dr. Vint Cerf', 'Prof. Brian Kernighan', 'Dr. Andrew Tanenbaum'
    ]
  },
  'Computer Science': {
    deptName: 'Computer Science (BCA/B.Sc)',
    hodName: 'Dr. Grace Hopper',
    hodEmail: 'hod.cs@vmhs.com',
    teacherPool: [
      'Prof. John von Neumann', 'Dr. Barbara Liskov', 'Prof. Edsger Dijkstra',
      'Dr. Tony Hoare', 'Prof. Robin Milner', 'Dr. Niklaus Wirth'
    ]
  },
  'ECE': {
    deptName: 'Electronics & Communication',
    hodName: 'Dr. Claude Shannon',
    hodEmail: 'hod.ece@vmhs.com',
    teacherPool: [
      'Prof. Nikola Tesla', 'Dr. Heinrich Hertz', 'Prof. Guglielmo Marconi',
      'Dr. Jack Kilby', 'Prof. Robert Noyce', 'Dr. Gordon Moore',
      'Prof. John Bardeen', 'Dr. Walter Brattain', 'Prof. William Shockley',
      'Dr. Lee de Forest', 'Prof. Edwin Armstrong', 'Dr. Philo Farnsworth'
    ]
  },
  'Mechanical': {
    deptName: 'Mechanical Engineering',
    hodName: 'Dr. James Watt',
    hodEmail: 'hod.mech@vmhs.com',
    teacherPool: [
      'Prof. Rudolf Diesel', 'Dr. Nikolaus Otto', 'Prof. Sadi Carnot',
      'Dr. Ludwig Prandtl', 'Prof. Osborne Reynolds', 'Dr. Richard Feynman',
      'Prof. Stephen Timoshenko', 'Dr. Henry Royce', 'Prof. Charles Parsons',
      'Dr. Felix Wankel', 'Prof. Ferdinand Porsche', 'Dr. Soichiro Honda'
    ]
  },
  'Civil': {
    deptName: 'Civil Engineering',
    hodName: 'Dr. E. Sreedharan',
    hodEmail: 'hod.civil@vmhs.com',
    teacherPool: [
      'Prof. Arthur Casagrande', 'Dr. Karl von Terzaghi', 'Prof. Hardy Cross',
      'Dr. John Smeaton', 'Prof. Thomas Telford', 'Dr. Isambard Brunel',
      'Prof. Robert Maillart', 'Dr. Fazlur Rahman Khan', 'Prof. Christian Otto Mohr',
      'Dr. William Rankine', 'Prof. Gustave Eiffel', 'Dr. Othmar Ammann'
    ]
  },
  'AIML': {
    deptName: 'Artificial Intelligence & Machine Learning',
    hodName: 'Dr. Geoffrey Hinton',
    hodEmail: 'hod.aiml@vmhs.com',
    teacherPool: [
      'Prof. Yann LeCun', 'Dr. Yoshua Bengio', 'Prof. Fei-Fei Li',
      'Dr. Demis Hassabis', 'Prof. Andrew Ng', 'Dr. Judea Pearl',
      'Prof. Stuart Russell', 'Dr. Peter Norvig', 'Prof. Ian Goodfellow',
      'Dr. Ilya Sutskever', 'Prof. Sebastian Thrun', 'Dr. Daphne Koller'
    ]
  },
  'Commerce & Management': {
    deptName: 'Commerce & Management',
    hodName: 'Dr. Raghuram Rajan',
    hodEmail: 'hod.commerce@vmhs.com',
    teacherPool: [
      'Prof. Amartya Sen', 'Dr. Jagdish Bhagwati', 'Prof. Gita Gopinath',
      'Dr. Abhijit Banerjee', 'Prof. Esther Duflo', 'Dr. C. Rangarajan'
    ]
  }
};

async function main() {
  console.log('=== Assigning Unique Homeroom Teachers & HODs by Department for Engineering Institute ===\n');

  const instCode = 'VMHS001002';
  const instName = 'VM Memorial Higher Secondary & Degree College';

  // 1. CREATE HOD FOR EACH DEPARTMENT
  console.log('--- 1. Creating Department HODs ---');
  for (const [deptKey, cfg] of Object.entries(DEPARTMENTS)) {
    let hodUid = `uid_hod_${deptKey.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}`;
    if (isFirebaseAdminInitialized) {
      try {
        const fbU = await admin.auth().getUserByEmail(cfg.hodEmail);
        hodUid = fbU.uid;
        await admin.auth().updateUser(hodUid, {
          displayName: cfg.hodName,
          password: 'Hod@123',
        });
        console.log(`✓ Firebase HOD updated: ${cfg.hodEmail}`);
      } catch {
        const fbNew = await admin.auth().createUser({
          email: cfg.hodEmail,
          password: 'Hod@123',
          displayName: cfg.hodName,
        });
        hodUid = fbNew.uid;
        console.log(`✓ Firebase HOD created: ${cfg.hodEmail}`);
      }
    }

    const existingDb = await db.select().from(schema.users).where(eq(schema.users.email, cfg.hodEmail));
    if (existingDb.length > 0) {
      await db.update(schema.users).set({
        firebaseUid: hodUid,
        fullName: cfg.hodName,
        role: 'hod',
        roles: ['hod', 'teacher'],
        department: cfg.deptName,
        institutionCode: instCode,
        institutionName: instName,
        institutionType: 'college',
        profileCompleted: true,
        scope: {
          department: cfg.deptName,
          deptCode: deptKey,
          designation: 'hod',
          title: `Head of Department (${cfg.deptName})`,
        },
        updatedAt: new Date(),
      }).where(eq(schema.users.email, cfg.hodEmail));
      console.log(`✓ DB HOD updated: ${cfg.hodName} (${cfg.deptName})`);
    } else {
      await db.insert(schema.users).values({
        id: `usr_hod_${deptKey.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}`,
        firebaseUid: hodUid,
        email: cfg.hodEmail,
        fullName: cfg.hodName,
        role: 'hod',
        roles: ['hod', 'teacher'],
        department: cfg.deptName,
        institutionCode: instCode,
        institutionName: instName,
        institutionType: 'college',
        profileCompleted: true,
        mustChangePassword: false,
        phone: '+91 9845012345',
        scope: {
          department: cfg.deptName,
          deptCode: deptKey,
          designation: 'hod',
          title: `Head of Department (${cfg.deptName})`,
        },
      });
      console.log(`✓ DB HOD created: ${cfg.hodName} (${cfg.deptName})`);
    }
  }

  // 2. ASSIGN A UNIQUE HOMEROOM TEACHER FOR EACH OF THE 46 CLASSES
  console.log('\n--- 2. Assigning Unique Homeroom Teachers According to Department ---');
  const classes = await db
    .select()
    .from(schema.classSections)
    .where(eq(schema.classSections.institutionCode, instCode))
    .orderBy(schema.classSections.department, schema.classSections.name);

  console.log(`Total classes to assign: ${classes.length}`);

  const usedTeacherEmails = new Set<string>();

  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];
    const deptKey = cls.department || 'CSE';
    const cfg = DEPARTMENTS[deptKey] || DEPARTMENTS['CSE'];

    // Pick a teacher from the pool
    let candidateName = cfg.teacherPool[i % cfg.teacherPool.length];
    let cleanEmailName = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');
    let teacherEmail = `${cleanEmailName}.${instCode.toLowerCase()}@faculty.school.com`;

    // Ensure uniqueness
    if (usedTeacherEmails.has(teacherEmail)) {
      teacherEmail = `${cleanEmailName}.sec${i + 1}.${instCode.toLowerCase()}@faculty.school.com`;
      candidateName = `${candidateName} (Sec ${i + 1})`;
    }
    usedTeacherEmails.add(teacherEmail);

    let teacherUid = `uid_teach_${Date.now()}_${i}`;
    if (isFirebaseAdminInitialized) {
      try {
        const fbU = await admin.auth().getUserByEmail(teacherEmail);
        teacherUid = fbU.uid;
      } catch {
        try {
          const fbNew = await admin.auth().createUser({
            email: teacherEmail,
            password: 'Teacher@123',
            displayName: candidateName,
          });
          teacherUid = fbNew.uid;
        } catch {
          // fallback
        }
      }
    }

    // Upsert teacher user
    const existingT = await db.select().from(schema.users).where(eq(schema.users.email, teacherEmail));
    let teacherId = '';
    if (existingT.length > 0) {
      teacherId = existingT[0].id;
      await db.update(schema.users).set({
        firebaseUid: teacherUid,
        fullName: candidateName,
        role: 'teacher',
        roles: ['teacher'],
        department: cfg.deptName,
        scope: {
          department: cfg.deptName,
          assignedClass: cls.name,
          designation: 'homeroom_teacher',
          qualification: 'Ph.D. / M.Tech in ' + cfg.deptName,
          experienceYears: 6 + (i % 15),
        },
        updatedAt: new Date(),
      }).where(eq(schema.users.id, teacherId));
    } else {
      teacherId = `usr_teach_${instCode.toLowerCase()}_${Date.now()}_${i}`;
      await db.insert(schema.users).values({
        id: teacherId,
        firebaseUid: teacherUid,
        email: teacherEmail,
        fullName: candidateName,
        role: 'teacher',
        roles: ['teacher'],
        institutionCode: instCode,
        institutionName: instName,
        institutionType: 'college',
        profileCompleted: true,
        department: cfg.deptName,
        scope: {
          department: cfg.deptName,
          assignedClass: cls.name,
          designation: 'homeroom_teacher',
          qualification: 'Ph.D. / M.Tech in ' + cfg.deptName,
          experienceYears: 6 + (i % 15),
        },
      });
    }

    // Assign as class teacher of this class
    await db.update(schema.classSections).set({
      classTeacherId: teacherId,
      updatedAt: new Date(),
    }).where(eq(schema.classSections.id, cls.id));

    console.log(`[${i + 1}/46] ${cls.name} (${cfg.deptName}) -> Homeroom Teacher: ${candidateName}`);
  }

  console.log('\n✨ ALL 46 ENGINEERING CLASSES NOW HAVE UNIQUE HOMEROOM TEACHERS MATCHING THEIR DEPARTMENT & HODs SEEDED! ✨');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error running script:', err);
  process.exit(1);
});
