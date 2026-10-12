/**
 * @file setCustomClaims.ts
 * @description Sets Firebase Auth custom claims (role, profileCompleted) on the
 * 3 test accounts. This allows the app to resolve the user's role directly from
 * the auth token — no backend or Firestore needed.
 *
 * Run once:  npx tsx scripts/setCustomClaims.ts
 */

import 'dotenv/config';
import * as admin from 'firebase-admin';

const projectId   = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('[ERROR] Missing Firebase Admin credentials in server/.env');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const ACCOUNTS = [
  { email: 'admin@school.com',      role: 'admin' },
  { email: 'accountant@school.com', role: 'accountant' },
  { email: 'student@school.com',    role: 'student' },
];

async function main() {
  console.log('\n🔑 Setting Firebase Auth custom claims...\n');

  for (const acct of ACCOUNTS) {
    try {
      const user = await admin.auth().getUserByEmail(acct.email);
      await admin.auth().setCustomUserClaims(user.uid, {
        role: acct.role,
        profileCompleted: true,
        institutionCode: 'SCHOOL001',
      });
      console.log(`  ✓ ${acct.email} → role: ${acct.role}`);
    } catch (err: any) {
      console.error(`  ✗ ${acct.email}: ${err.message}`);
    }
  }

  console.log('\n✅ Done! Users must re-login to pick up new claims.\n');
  process.exit(0);
}

main().catch(console.error);
