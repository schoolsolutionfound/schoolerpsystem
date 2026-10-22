require('dotenv').config();
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

(async () => {
  await c.connect();

  console.log('\n=== SCHOOLS (institutions) ===');
  const schools = await c.query(
    'select institution_code, institution_name, institution_type, subscription_status, maintenance_enabled from institutions order by institution_code'
  );
  schools.rows.forEach((r) =>
    console.log(
      `  ${r.institution_code} | ${r.institution_name} | ${r.institution_type} | ${r.subscription_status} | maintenance=${r.maintenance_enabled}`
    )
  );
  console.log(`  TOTAL SCHOOLS: ${schools.rows.length}`);

  console.log('\n=== USERS BY ROLE ===');
  const byRole = await c.query(
    'select role, count(*)::int as n from users group by role order by n desc'
  );
  byRole.rows.forEach((r) => console.log(`  ${r.role}: ${r.n}`));
  const total = byRole.rows.reduce((a, r) => a + r.n, 0);
  console.log(`  TOTAL USERS: ${total}`);

  console.log('\n=== FULL ROSTER (role | name | email | school | roll/USN) ===');
  const all = await c.query(
    `select role, full_name, email, institution_code, roll_no_usn, must_change_password
     from users order by role, institution_code, full_name`
  );
  all.rows.forEach((r) =>
    console.log(
      `  [${r.role}] ${r.full_name} | ${r.email} | ${r.institution_code || '-'} | ${r.roll_no_usn || '-'}${r.must_change_password ? ' | mustChangePw' : ''}`
    )
  );

  console.log('\n=== USERS PER SCHOOL ===');
  const perSchool = await c.query(
    `select u.institution_code, u.role, count(*)::int as n
     from users u group by u.institution_code, u.role
     order by u.institution_code, u.role`
  );
  const grouped = {};
  perSchool.rows.forEach((r) => {
    const k = r.institution_code || '(none)';
    grouped[k] = grouped[k] || {};
    grouped[k][r.role] = r.n;
  });
  Object.entries(grouped).forEach(([k, v]) => console.log(`  ${k}: ${JSON.stringify(v)}`));

  console.log('\n=== STUDENT <-> CLASS MAPPING ===');
  const sc = await c.query(
    `select count(*)::int as links, count(distinct student_id)::int as students from student_classes`
  );
  console.log(`  enrollment links: ${sc.rows[0].links} | distinct students enrolled: ${sc.rows[0].students}`);

  await c.end();
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
