/**
 * @file seedFirestoreUsers.ts
 * @description Seeds the 3 test user documents into Firestore so the app can
 * resolve role/profile data even when the Fastify backend is offline.
 *
 * Run once from the server/ directory:
 *   npx tsx scripts/seedFirestoreUsers.ts
 *
 * Prerequisites: Firebase Auth accounts must already exist (run seedTestAccounts.ts first).
 */

import 'dotenv/config';
import * as admin from 'firebase-admin';

// ── Firebase Admin init ──────────────────────────────────────────────────────
const projectId   = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('[ERROR] Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY in server/.env');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const firestoreDb = admin.firestore();

// ── Test accounts ─────────────────────────────────────────────────────────────
const TEST_ACCOUNTS = [
  { email: 'admin@school.com',      role: 'admin',      fullName: 'School Admin',      institutionCode: 'SCHOOL001' },
  { email: 'accountant@school.com', role: 'accountant', fullName: 'School Accountant', institutionCode: 'SCHOOL001' },
  { email: 'student@school.com',    role: 'student',    fullName: 'Test Student',       institutionCode: 'SCHOOL001' },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 Seeding Firestore user documents...\n');

  for (const account of TEST_ACCOUNTS) {
    // Look up the Firebase Auth UID for this email
    let uid: string;
    try {
      const user = await admin.auth().getUserByEmail(account.email);
      uid = user.uid;
    } catch {
      console.warn(`  ⚠ Firebase Auth user not found for ${account.email} — run seedTestAccounts.ts first`);
      continue;
    }

    // Write the Firestore document at users/{uid}
    // The app's fallback sync (useAppSync.ts) reads this exact path
    await firestoreDb.collection('users').doc(uid).set(
      {
        uid,
        email: account.email,
        fullName: account.fullName,
        role: account.role,           // ← primary role field read by useAppSync
        userRole: account.role,       // ← secondary alias for safety
        institutionCode: account.institutionCode,
        institutionName: 'SchoolHub Demo School',
        institutionType: 'school',
        mustChangePassword: false,
        profileCompleted: true,
        isEmailVerified: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }  // merge so we don't overwrite any extra fields if doc already exists
    );

    console.log(`  ✓ Firestore doc written: users/${uid}  (${account.email} → ${account.role})`);
  }

  console.log('\n✅ Firestore seeding complete!\n');
  console.log('   The app will now resolve role & profile from Firestore when backend is offline.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});
