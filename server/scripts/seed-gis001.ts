import 'dotenv/config';
import { adminService } from '../src/modules/admin/admin.service.js';
import { institutionService } from '../src/modules/institutions/institution.service.js';

const CONCURRENCY = 5;

async function runBatch<T>(items: T[], fn: (item: T) => Promise<any>, label: string) {
  let ok = 0, fail = 0;
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const chunk = items.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(chunk.map(fn));
    for (const r of results) {
      if (r.status === 'fulfilled') { ok++; }
      else { fail++; }
    }
  }
  console.log(`${label}: ${ok} succeeded, ${fail} failed`);
}

async function main() {
  const instCode = 'GIS001';
  const instName = 'Greenfield International School';
  const password = 'TempPass123!';
  const start = Date.now();

  console.log(`Seeding ${instName} (${instCode}) as a school...\n`);

  try {
    await institutionService.createInstitution({
      institutionCode: instCode,
      institutionName: instName,
      institutionType: 'school',
      departments: ['English', 'Mathematics', 'Science'],
      academicYears: ['Grade 8', 'Grade 9', 'Grade 10'],
      courses: [],
    });
    console.log('  ✓ Institution created\n');
  } catch (err: any) {
    if (err.code === 'INSTITUTION_CODE_EXISTS') {
      console.log('  ~ Institution already exists, reusing\n');
    } else {
      throw err;
    }
  }

  const students = [
    { firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.s@gis.edu', rollNoOrUSN: 'GIS2026001', department: 'Science', academicYear: 'Grade 10', section: 'A', parentPhone: '+91-9876543210' },
    { firstName: 'Priya', lastName: 'Verma', email: 'priya.v@gis.edu', rollNoOrUSN: 'GIS2026002', department: 'Science', academicYear: 'Grade 10', section: 'A', parentPhone: '+91-9876543211' },
    { firstName: 'Rohan', lastName: 'Gupta', email: 'rohan.g@gis.edu', rollNoOrUSN: 'GIS2026003', department: 'Mathematics', academicYear: 'Grade 9', section: 'B', parentPhone: '+91-9876543212' },
    { firstName: 'Sneha', lastName: 'Patil', email: 'sneha.p@gis.edu', rollNoOrUSN: 'GIS2026004', department: 'English', academicYear: 'Grade 8', section: 'A', parentPhone: '+91-9876543213' },
    { firstName: 'Arjun', lastName: 'Reddy', email: 'arjun.r@gis.edu', rollNoOrUSN: 'GIS2026005', department: 'Science', academicYear: 'Grade 9', section: 'B', parentPhone: '+91-9876543214' },
  ];

  const teachers = [
    { firstName: 'Anita', lastName: 'Desai', email: 'anita.d@gis.edu', employeeId: 'TCH-GIS-001', department: 'Science' },
  ];

  await runBatch(students, (s) =>
    adminService.createStudent({ ...s, institutionCode: instCode, password })
      .then((r) => console.log(`  ✓ Student ${s.email} -> fb:${r.firebaseUid}`)),
    'Students'
  );

  await runBatch(teachers, (t) =>
    adminService.createTeacher({ ...t, institutionCode: instCode, password })
      .then((r) => console.log(`  ✓ Teacher ${t.email} -> fb:${r.firebaseUid}`)),
    'Teachers'
  );

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s.`);
}

main().catch(console.error);
