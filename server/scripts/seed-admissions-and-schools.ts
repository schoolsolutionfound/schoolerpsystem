import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';

const schools = [
  {
    institutionCode: 'TST001',
    institutionName: 'Greenfield International School',
    institutionType: 'school' as const,
    subscriptionStatus: 'active' as const,
    departments: ['Science', 'Mathematics', 'English', 'Social Studies', 'Computer Science'],
    academicYears: ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    courses: ['Primary', 'Middle School', 'High School'],
  },
  {
    institutionCode: 'OAK002',
    institutionName: 'Oakridge World Academy',
    institutionType: 'school' as const,
    subscriptionStatus: 'active' as const,
    departments: ['Humanities', 'Sciences', 'Visual Arts', 'Languages'],
    academicYears: ['PYP 1-5', 'MYP 1-5', 'DP 1-2'],
    courses: ['IB Primary', 'IB Middle Years', 'IB Diploma'],
  },
  {
    institutionCode: 'DPS003',
    institutionName: 'Delhi Public Academy',
    institutionType: 'school' as const,
    subscriptionStatus: 'active' as const,
    departments: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Commerce'],
    academicYears: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    courses: ['Primary', 'Secondary', 'Senior Secondary'],
  },
  {
    institutionCode: 'STX004',
    institutionName: "St. Xavier's High School",
    institutionType: 'school' as const,
    subscriptionStatus: 'active' as const,
    departments: ['English', 'History', 'Geography', 'Mathematics', 'Physical Education'],
    academicYears: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    courses: ['Middle School', 'ICSE High School'],
  },
  {
    institutionCode: 'HCS005',
    institutionName: 'The Heritage Cambridge International',
    institutionType: 'school' as const,
    subscriptionStatus: 'active' as const,
    departments: ['Sciences', 'Economics', 'English Literature', 'Design Technology'],
    academicYears: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'AS Level', 'A Level'],
    courses: ['Cambridge Lower Secondary', 'IGCSE', 'A-Levels'],
  },
  {
    institutionCode: 'LEM006',
    institutionName: 'Little Explorers Montessori Academy',
    institutionType: 'school' as const,
    subscriptionStatus: 'active' as const,
    departments: ['Early Childhood', 'Primary Foundations', 'Arts & Music'],
    academicYears: ['Nursery', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'],
    courses: ['Toddler', 'Primary Montessori', 'Elementary'],
  },
];

async function seed() {
  if (!db) {
    console.error('PostgreSQL database not connected');
    process.exit(1);
  }

  console.log('Inserting/updating 6 schools into PostgreSQL...');
  for (const s of schools) {
    const existing = await db
      .select()
      .from(schema.institutions)
      .where(eq(schema.institutions.institutionCode, s.institutionCode));

    if (existing.length === 0) {
      await db.insert(schema.institutions).values(s);
      console.log(`  ✓ Inserted ${s.institutionName} (${s.institutionCode})`);
    } else {
      await db
        .update(schema.institutions)
        .set(s)
        .where(eq(schema.institutions.institutionCode, s.institutionCode));
      console.log(`  ✓ Updated ${s.institutionName} (${s.institutionCode})`);
    }
  }

  console.log('\nInserting sample admission applications into PostgreSQL...');
  const sampleAdmissions = [
    {
      id: 'adm_safwan_tst001',
      parentId: 'DBx7zPa2E9ahU95HK2rVHrdKaIA2', // safwan.parent@gmail.com
      parentName: 'Safwan Parent',
      parentEmail: 'safwan.parent@gmail.com',
      parentPhone: '+91 9876543210',
      schoolId: 'TST001',
      schoolName: 'Greenfield International School',
      childFullName: 'Safwan Haneef',
      childAge: 12,
      childGender: 'male',
      previousSchool: 'Sunrise Primary School',
      gradeApplyingFor: 'Grade 6',
      status: 'accepted',
    },
    {
      id: 'adm_amina_oak002',
      parentId: 'DBx7zPa2E9ahU95HK2rVHrdKaIA2',
      parentName: 'Safwan Parent',
      parentEmail: 'safwan.parent@gmail.com',
      parentPhone: '+91 9876543210',
      schoolId: 'OAK002',
      schoolName: 'Oakridge World Academy',
      childFullName: 'Amina Haneef',
      childAge: 6,
      childGender: 'female',
      previousSchool: 'Little Angels Nursery',
      gradeApplyingFor: 'Grade 1',
      status: 'pending',
    },
    {
      id: 'adm_zayd_dps003',
      parentId: 'DBx7zPa2E9ahU95HK2rVHrdKaIA2',
      parentName: 'Safwan Parent',
      parentEmail: 'safwan.parent@gmail.com',
      parentPhone: '+91 9876543210',
      schoolId: 'DPS003',
      schoolName: 'Delhi Public Academy',
      childFullName: 'Zayd Haneef',
      childAge: 14,
      childGender: 'male',
      previousSchool: 'City Model High School',
      gradeApplyingFor: 'Grade 9',
      status: 'pending',
    },
    {
      id: 'adm_rohan_tst001',
      parentId: 'normal_parent_uid',
      parentName: 'Prospective Parent',
      parentEmail: 'normal.parent@gmail.com',
      parentPhone: '+91 9123456780',
      schoolId: 'TST001',
      schoolName: 'Greenfield International School',
      childFullName: 'Rohan Mehta',
      childAge: 11,
      childGender: 'male',
      previousSchool: 'St. Marys Convent',
      gradeApplyingFor: 'Grade 6',
      status: 'pending',
    },
  ];

  for (const adm of sampleAdmissions) {
    const existing = await db
      .select()
      .from(schema.admissions)
      .where(eq(schema.admissions.id, adm.id));

    if (existing.length === 0) {
      await db.insert(schema.admissions).values(adm);
      console.log(`  ✓ Inserted admission: ${adm.childFullName} -> ${adm.schoolName} [${adm.status}]`);
    } else {
      await db
        .update(schema.admissions)
        .set(adm)
        .where(eq(schema.admissions.id, adm.id));
      console.log(`  ✓ Updated admission: ${adm.childFullName} -> ${adm.schoolName} [${adm.status}]`);
    }
  }

  console.log('\nDone! Exiting.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
