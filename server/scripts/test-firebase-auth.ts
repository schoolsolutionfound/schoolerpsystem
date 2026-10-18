import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';

async function test() {
  console.log('Firebase Admin Initialized?', isFirebaseAdminInitialized);
  if (!isFirebaseAdminInitialized) return;

  const users = [
    'admin@schoolerp.com',
    'placement@schoolerp.com',
    'faculty@schoolerp.com',
    'student@schoolerp.com'
  ];

  for (const email of users) {
    try {
      const fbUser = await admin.auth().getUserByEmail(email);
      console.log(`Found Firebase user: ${email} (UID: ${fbUser.uid})`);
      await admin.auth().updateUser(fbUser.uid, {
        password: 'TestPassword123!',
      });
      console.log(`✓ Set password for ${email} to TestPassword123!`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        const created = await admin.auth().createUser({
          email,
          password: 'TestPassword123!',
        });
        console.log(`✓ Created user in Firebase: ${email} (UID: ${created.uid})`);
      } else {
        console.error(`Error for ${email}:`, err.message);
      }
    }
  }
}

test().then(() => process.exit(0)).catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
