import 'dotenv/config';
import { authService } from '../src/modules/auth/auth.service.js';
import { admin } from '../src/modules/shared/config/firebase.js';

async function test() {
  console.log('--- Testing loginSync for staff.multirole@school.com ---');
  const fb1 = await admin.auth().getUserByEmail('staff.multirole@school.com');
  const res1 = await authService.loginSync({
    uid: fb1.uid,
    email: fb1.email!,
    role: 'accountant',
  });
  console.log('staff.multirole loginSync result:');
  console.log({
    fullName: res1.fullName,
    userRole: res1.userRole,
    roles: res1.roles,
    institutionCode: res1.institutionCode,
    institutionName: res1.institutionName,
  });

  console.log('\n--- Testing loginSync for admission.oakridge@school.com ---');
  const fb2 = await admin.auth().getUserByEmail('admission.oakridge@school.com');
  const res2 = await authService.loginSync({
    uid: fb2.uid,
    email: fb2.email!,
    role: 'admission_officer',
  });
  console.log('admission.oakridge loginSync result:');
  console.log({
    fullName: res2.fullName,
    userRole: res2.userRole,
    roles: res2.roles,
    institutionCode: res2.institutionCode,
    institutionName: res2.institutionName,
  });

  process.exit(0);
}

test().catch(console.error);
