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
    { email: 'hod.cs@school.com', password: 'Hod@123', role: 'hod', roles: ['hod', 'teacher'], department: 'Computer Science & Engineering', institutionCode: 'OAK002', name: 'Dr. Rajeshwar Rao' },
    { email: 'hod.mech@vmhs.com', password: 'Hod@123', role: 'hod', roles: ['hod', 'teacher'], department: 'Mechanical Engineering', institutionCode: 'VMHS001002', name: 'Dr. James Watt' },
    { email: 'hod.cse@vmhs.com', password: 'Hod@123', role: 'hod', roles: ['hod', 'teacher'], department: 'Computer Science & Engineering', institutionCode: 'VMHS001002', name: 'Dr. Linus Torvalds' },
    { email: 'hod.ece@vmhs.com', password: 'Hod@123', role: 'hod', roles: ['hod', 'teacher'], department: 'Electronics & Communication', institutionCode: 'VMHS001002', name: 'Dr. Claude Shannon' },
    { email: 'hod.civil@vmhs.com', password: 'Hod@123', role: 'hod', roles: ['hod', 'teacher'], department: 'Civil Engineering', institutionCode: 'VMHS001002', name: 'Dr. E. Sreedharan' },
    { email: 'hod.aiml@vmhs.com', password: 'Hod@123', role: 'hod', roles: ['hod', 'teacher'], department: 'Artificial Intelligence & Machine Learning', institutionCode: 'VMHS001002', name: 'Dr. Geoffrey Hinton' },
    { email: 'safwan.parent@gmail.com', password: 'Parent@123', role: 'parent' },
    { email: 'parent.oakridge@school.com', password: 'Parent@123', role: 'parent' },
    { email: 'normal.parent@gmail.com', password: 'Parent@123', role: 'parent' },
    { email: 'principal.oakridge@school.com', password: 'Principal@123', role: 'principal', roles: ['principal'], institutionCode: 'OAK002', name: 'Dr. Evelyn Montgomery' },
    { email: 'admi.okridge@school.com', password: 'Admin@123', role: 'admin', roles: ['admin'], institutionCode: 'OAK002', name: 'Oakridge Admin' },
    { email: 'safwancoding1919@gmail.com', password: 'Safwan@123', role: 'student' },
    { email: 'dev@schoolerp.com', password: 'Devpass123!', role: 'dev', roles: ['dev'] },
  ];

  console.log('--- Setting Firebase Auth Passwords & Custom Claims ---');
  for (const acc of accounts) {
    try {
      let uid = '';
      try {
        const user = await admin.auth().getUserByEmail(acc.email);
        uid = user.uid;
        await admin.auth().updateUser(uid, { password: acc.password });
        console.log(`✓ Updated password for: ${acc.email} -> ${acc.password}`);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          const created = await admin.auth().createUser({
            email: acc.email,
            password: acc.password,
          });
          uid = created.uid;
          console.log(`✓ Created user & set password for: ${acc.email} -> ${acc.password} (UID: ${created.uid})`);
        } else {
          throw err;
        }
      }

      if (acc.role && uid) {
        await admin.auth().setCustomUserClaims(uid, {
          role: acc.role,
          roles: acc.roles || [acc.role],
          department: (acc as any).department || '',
          institutionCode: (acc as any).institutionCode || '',
        });
        if ((acc as any).name) {
          await admin.auth().updateUser(uid, { displayName: (acc as any).name });
        }
        console.log(`  ✓ Set custom claims for: ${acc.email} (role: ${acc.role}, dept: ${(acc as any).department || 'N/A'})`);
      }
    } catch (err: any) {
      console.error(`✗ Failed for ${acc.email}:`, err.message);
    }
  }

  console.log('--- Done syncing passwords ---');
}

syncPasswords().catch(console.error);
