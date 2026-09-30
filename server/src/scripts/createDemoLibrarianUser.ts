import 'dotenv/config';
import pg from 'pg';
import { admin, isFirebaseAdminInitialized } from '../modules/shared/config/firebase.js';

async function createDemoLibrarianUser() {
  console.log('[Demo Librarian Provisioning] Starting setup...');
  const email = 'librarian@school.com';
  const password = 'Lib@1234';
  const fullName = 'Demo Librarian';
  const role = 'librarian';
  const institutionCode = 'TST001';

  let firebaseUid = '';

  if (!isFirebaseAdminInitialized) {
    console.error('[Firebase Admin] Firebase Admin SDK is NOT initialized.');
    process.exit(1);
  }

  try {
    const existingUser = await admin.auth().getUserByEmail(email);
    firebaseUid = existingUser.uid;
    console.log(`[Firebase Auth] Found existing librarian user (${firebaseUid}). Updating password & status...`);
    await admin.auth().updateUser(firebaseUid, {
      password,
      displayName: fullName,
      emailVerified: true,
      disabled: false,
    });
    console.log('[Firebase Auth] Librarian password and status updated successfully.');
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.log('[Firebase Auth] Librarian user not found. Creating new Firebase Auth user...');
      const newUser = await admin.auth().createUser({
        email,
        password,
        displayName: fullName,
        emailVerified: true,
        disabled: false,
      });
      firebaseUid = newUser.uid;
      console.log(`[Firebase Auth] Librarian user created successfully. UID: ${firebaseUid}`);
    } else {
      console.error('[Firebase Auth Error]', err.message);
      process.exit(1);
    }
  }

  // Connect to PostgreSQL
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/schoolerp';
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();

    // Insert or update PostgreSQL user record
    await client.query(`
      INSERT INTO users (id, firebase_uid, email, full_name, role, institution_code, must_change_password, profile_completed)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (firebase_uid) DO UPDATE
      SET email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          institution_code = EXCLUDED.institution_code,
          profile_completed = EXCLUDED.profile_completed,
          must_change_password = EXCLUDED.must_change_password;
    `, [`usr_demo_lib_${Date.now()}`, firebaseUid, email, fullName, role, institutionCode, false, true]);

    console.log('[PostgreSQL] Librarian ERP User Profile successfully created/updated in PostgreSQL!');

    const verify = await client.query(`SELECT id, firebase_uid, email, full_name, role, institution_code FROM users WHERE email = $1`, [email]);
    console.log('[Verification Record]:', verify.rows[0]);

  } catch (dbErr: any) {
    console.error('[PostgreSQL Error]', dbErr.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDemoLibrarianUser();
