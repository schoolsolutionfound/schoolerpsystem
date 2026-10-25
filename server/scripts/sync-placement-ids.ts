import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function syncPlacementIds() {
  const [admin] = await sql`SELECT id FROM users WHERE email = 'admin@schoolerp.com'`;
  const [placement] = await sql`SELECT id FROM users WHERE email = 'placement@schoolerp.com'`;
  const [student] = await sql`SELECT id FROM users WHERE email = 'student@schoolerp.com'`;

  console.log('Real User IDs:', { adminId: admin?.id, placementId: placement?.id, studentId: student?.id });

  // Update placement_members
  await sql`DELETE FROM placement_members`;
  await sql`
    INSERT INTO placement_members (id, institution_code, user_id, access_level, granted_by, created_at)
    VALUES (
      ${'pm_' + Date.now()},
      'GIS001',
      ${placement.id},
      'head',
      ${admin.id},
      NOW()
    )
  `;
  console.log('✓ Successfully mapped placement_members to placement@schoolerp.com (ID: ' + placement.id + ')');

  // Update student_placement_profiles
  await sql`DELETE FROM student_placement_profiles`;
  await sql`
    INSERT INTO student_placement_profiles (
      id, user_id, full_name, email, cgpa, tenth_percent, twelfth_or_diploma_percent,
      active_backlogs, resume_url, linkedin_url, github_url, leetcode_url
    ) VALUES (
      ${'spp_' + Date.now()},
      ${student.id},
      'Aarav Sharma',
      'student@schoolerp.com',
      8.75,
      88.50,
      89.20,
      0,
      'https://firebasestorage.googleapis.com/v0/b/school-erp-app-dec82.firebasestorage.app/o/sample-resume.pdf',
      'https://linkedin.com/in/aaravsharma',
      'https://github.com/aaravsharma',
      'https://leetcode.com/aaravsharma'
    )
  `;
  console.log('✓ Successfully mapped student_placement_profiles to student@schoolerp.com (ID: ' + student.id + ')');

  // Ensure CS-A section exists
  let [cs] = await sql`SELECT id FROM class_sections WHERE institution_code = 'GIS001' AND name = 'CS-A'`;
  if (!cs) {
    const [newCs] = await sql`
      INSERT INTO class_sections (id, institution_code, name, department, academic_year)
      VALUES (${'cs_' + Date.now()}, 'GIS001', 'CS-A', 'Computer Science', '2026 Batch')
      RETURNING id
    `;
    cs = newCs;
    console.log('✓ Created CS-A class section');
  }

  // Ensure Student Enrollment exists
  const [enrollment] = await sql`SELECT id FROM student_classes WHERE student_id = ${student.id}`;
  if (!enrollment) {
    await sql`
      INSERT INTO student_classes (id, institution_code, student_id, class_section_id, is_active)
      VALUES (${'sc_' + Date.now()}, 'GIS001', ${student.id}, ${cs.id}, true)
    `;
    console.log('✓ Enrolled student into CS-A');
  } else {
    await sql`UPDATE student_classes SET class_section_id = ${cs.id}, is_active = true WHERE id = ${enrollment.id}`;
    console.log('✓ Verified student enrollment in CS-A');
  }

  process.exit(0);
}

syncPlacementIds().catch(err => {
  console.error(err);
  process.exit(1);
});
