import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';
import { dbUpsertUser } from '../src/modules/shared/db/index.js';

async function main() {
  const email = 'dev@schoolerp.com';
  const password = 'DevPass123!';
  const fullName = 'Developer Admin';

  let firebaseUid = `dev_${Date.now()}`;
  if (isFirebaseAdminInitialized) {
    try {
      const user = await admin.auth().createUser({ email, password, displayName: fullName });
      firebaseUid = user.uid;
      console.log(`Firebase Auth account created: ${firebaseUid}`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        const existing = await admin.auth().getUserByEmail(email);
        firebaseUid = existing.uid;
        console.log(`Firebase Auth account already exists: ${firebaseUid}`);
      } else {
        throw err;
      }
    }
  }

  await dbUpsertUser({
    firebaseUid,
    email,
    fullName,
    role: 'dev',
    institutionCode: 'SUPER',
    institutionName: 'SchoolERP Platform',
    mustChangePassword: false,
    profileCompleted: true,
  });

  console.log(`Dev account ready — ${email} / ${password}`);
}

main().catch(console.error);
