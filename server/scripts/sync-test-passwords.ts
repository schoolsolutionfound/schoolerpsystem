import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';

async function syncPasswords() {
  if (!isFirebaseAdminInitialized) {
    console.error('Firebase Admin is not initialized!');
    process.exit(1);
  }

  const accounts = [
    { email: 'safwanhaneef786@gmail.com', password: 'Student@123' },
    { email: 'student@school.com', password: 'Student@123' },
    { email: 'kadar@gmail.com', password: 'Teacher@123' },
    { email: 'hod.cs@school.com', password: 'Hod@123' },
    { email: 'safwan.parent@gmail.com', password: 'Parent@123' },
    { email: 'parent.oakridge@school.com', password: 'Parent@123' },
    { email: 'normal.parent@gmail.com', password: 'Parent@123' },
    { email: 'principal.oakridge@school.com', password: 'Principal@123' },
    { email: 'admi.okridge@school.com', password: 'Admin@123' },
    { email: 'safwancoding1919@gmail.com', password: 'Safwan@123' },
  ];

  console.log('--- Setting Firebase Auth Passwords ---');
  for (const acc of accounts) {
    try {
      const user = await admin.auth().getUserByEmail(acc.email);
      await admin.auth().updateUser(user.uid, { password: acc.password });
      console.log(`✓ Updated password for: ${acc.email} -> ${acc.password}`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        const created = await admin.auth().createUser({
          email: acc.email,
          password: acc.password,
        });
        console.log(`✓ Created user & set password for: ${acc.email} -> ${acc.password} (UID: ${created.uid})`);
      } else {
        console.error(`✗ Failed for ${acc.email}:`, err.message);
      }
    }
  }

  console.log('--- Done syncing passwords ---');
}

syncPasswords().catch(console.error);
