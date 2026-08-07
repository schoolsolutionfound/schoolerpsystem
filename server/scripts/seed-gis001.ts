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
  console.log(  -> :  succeeded,  failed);
}

async function main() {
  const instCode = 'GIS001';
  const instName = 'Greenfield Institute of Technology';
  const password = 'TempPass123!';
  const start = Date.now();

  console.log(Seeding  - \n);

  try {
    await institutionService.createInstitution({
      institutionCode: instCode,
      institutionName: instName,
      institutionType: 'college',
      departments: ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
      academicYears: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      courses: ['B.Tech', 'M.Tech'],
    });
    console.log(  ✓ Institution created\n);
  } catch (err: any) {
    if (err.code === 'INSTITUTION_CODE_EXISTS') {
      console.log(  ~ Institution already exists, reusing\n);
    } else {
      throw err;
    }
  }

  const students = [
    { firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.s@gis.edu', rollNoOrUSN: '1MS21CS001', department: 'Computer Science', academicYear: '3rd Year', section: 'Section A', parentPhone: '+91-9876543210' },
    { firstName: 'Priya', lastName: 'Verma', email: 'priya.v@gis.edu', rollNoOrUSN: '1MS21CS002', department: 'Computer Science', academicYear: '3rd Year', section: 'Section A', parentPhone: '+91-9876543211' },
    { firstName: 'Rohan', lastName: 'Gupta', email: 'rohan.g@gis.edu', rollNoOrUSN: '1MS22EC001', department: 'Electronics', academicYear: '2nd Year', section: 'Section B', parentPhone: '+91-9876543212' },
    { firstName: 'Sneha', lastName: 'Patil', email: 'sneha.p@gis.edu', rollNoOrUSN: '1MS23ME001', department: 'Mechanical', academicYear: '1st Year', section: 'Section A', parentPhone: '+91-9876543213' },
    { firstName: 'Arjun', lastName: 'Reddy', email: 'arjun.r@gis.edu', rollNoOrUSN: '1MS22CS003', department: 'Computer Science', academicYear: '2nd Year', section: 'Section B', parentPhone: '+91-9876543214' },
  ];

  const teachers = [
    { firstName: 'Anita', lastName: 'Desai', email: 'anita.d@gis.edu', employeeId: 'TCH-GIS-001', department: 'Computer Science' },
  ];

  await runBatch(students, (s) =>
    adminService.createStudent({ ...s, institutionCode: instCode, password })
      .then((r) => console.log(  v   () -> fb:...)),
    'Students'
  );

  await runBatch(teachers, (t) =>
    adminService.createTeacher({ ...t, institutionCode: instCode, password })
      .then((r) => console.log(  v   () -> fb:...)),
    'Teachers'
  );

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(\nDone in s.);
}

main().catch(console.error);
