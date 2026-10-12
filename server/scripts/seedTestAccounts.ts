/**
 * @file seedTestAccounts.ts
 * @description Creates the 3 test Firebase Auth accounts used for local development.
 *
 * Run once from the server/ directory:
 *   npx tsx scripts/seedTestAccounts.ts
 *
 * Accounts created:
 *   admin@school.com       / admin123  → role: admin
 *   accountant@school.com  / admin123  → role: accountant
 *   student@school.com     / admin123  → role: student
 *
 * If an account already exists it is skipped (no error thrown).
 * After Firebase Auth accounts are created, matching rows are upserted
 * into the PostgreSQL `users` table so the app can read the role.
 */

import 'dotenv/config';
import * as admin from 'firebase-admin';
import pg from 'pg';

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

// ── DB client ────────────────────────────────────────────────────────────────
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

// ── Test accounts definition ─────────────────────────────────────────────────
const TEST_ACCOUNTS = [
  {
    email:     'admin@school.com',
    password:  'admin123',
    fullName:  'School Admin',
    role:      'admin',
    profileCompleted: true,
    mustChangePassword: false,
  },
  {
    email:     'accountant@school.com',
    password:  'admin123',
    fullName:  'School Accountant',
    role:      'accountant',
    profileCompleted: true,
    mustChangePassword: false,
  },
  {
    email:     'student@school.com',
    password:  'admin123',
    fullName:  'Test Student',
    role:      'student',
    profileCompleted: true,
    mustChangePassword: false,
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 Seeding test accounts...\n');

  // PostgreSQL is optional — Firebase Auth accounts are created regardless
  let dbConnected = false;
  try {
    await db.connect();
    dbConnected = true;
    console.log('  ✓ PostgreSQL connected\n');
  } catch {
    console.warn('  ⚠ PostgreSQL not reachable — will only create Firebase Auth accounts.\n');
  }

  for (const account of TEST_ACCOUNTS) {
    let uid: string;

    // 1. Create Firebase Auth user (skip if already exists)
    try {
      const created = await admin.auth().createUser({
        email:         account.email,
        password:      account.password,
        displayName:   account.fullName,
        emailVerified: true,
      });
      uid = created.uid;
      console.log(`  ✓ Firebase Auth created: ${account.email}  (uid: ${uid})`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        // Fetch existing user's UID
        const existing = await admin.auth().getUserByEmail(account.email);
        uid = existing.uid;
        console.log(`  ~ Already exists:       ${account.email}  (uid: ${uid})`);
      } else {
        console.error(`  ✗ Failed: ${account.email}`, err.message);
        continue;
      }
    }

    // 2. Upsert into PostgreSQL users table so app resolves role correctly
    if (dbConnected) try {
      await db.query(
        `INSERT INTO users
           (id, firebase_uid, email, full_name, role, must_change_password, profile_completed, institution_id, institution_code)
         VALUES
           ($1,  $2,           $3,    $4,        $5,   $6,                   $7,                 $8,             $9)
         ON CONFLICT (firebase_uid) DO UPDATE
           SET email              = EXCLUDED.email,
               full_name          = EXCLUDED.full_name,
               role               = EXCLUDED.role,
               profile_completed  = EXCLUDED.profile_completed`,
        [
          `usr_test_${uid.slice(0, 8)}`,
          uid,
          account.email,
          account.fullName,
          account.role,
          account.mustChangePassword,
          account.profileCompleted,
          'SCHOOL001',   // default institution id for test accounts
          'SCHOOL001',   // default institution code
        ]
      );
      console.log(`    ↳ PostgreSQL row upserted for role: ${account.role}`);
    } catch (dbErr: any) {
      // If the users table doesn't have some columns yet, log and continue
      console.warn(`    ⚠ PostgreSQL upsert skipped: ${dbErr.message}`);
    }
  }

  if (dbConnected) await db.end();
  console.log('\n✅ Done. You can now log in with:\n');
  console.log('   admin@school.com       / admin123  (Admin)');
  console.log('   accountant@school.com  / admin123  (Accountant)');
  console.log('   student@school.com     / admin123  (Student)\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});
