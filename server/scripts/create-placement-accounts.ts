import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';
import { dbUpsertUser } from '../src/modules/shared/db/index.js';

async function createUser(email: string, fullName: string, role: string) {
  const password = 'TestPassword123!';
  let firebaseUid = `${role}_${Date.now()}`;
  
  if (isFirebaseAdminInitialized) {
    try {
      const user = await admin.auth().createUser({ email, password, displayName: fullName });
      firebaseUid = user.uid;
      console.log(`Firebase Auth account created for ${role}: ${firebaseUid}`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        const existing = await admin.auth().getUserByEmail(email);
        firebaseUid = existing.uid;
        console.log(`Firebase Auth account already exists for ${role}: ${firebaseUid}`);
      } else {
        throw err;
      }
    }
  }

  await dbUpsertUser({
    firebaseUid,
    email,
    fullName,
    role,
    institutionCode: 'GIS001',
    institutionName: 'Greenfield International School',
    mustChangePassword: false,
    profileCompleted: true,
  });

  console.log(`Account ready: ${email} / ${password} (Role: ${role})`);
}

async function main() {
  console.log('Creating test accounts for Placement Cell...');
  await createUser('admin@schoolerp.com', 'System Admin', 'admin');
  await createUser('placement@schoolerp.com', 'Placement Officer', 'placement_officer');
  await createUser('student@schoolerp.com', 'Test Student', 'student');
  console.log('\nAll done! You can use these accounts to test.');
}

main().catch(console.error);
