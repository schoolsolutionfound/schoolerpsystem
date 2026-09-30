import 'dotenv/config';
import pg from 'pg';
import { admin, isFirebaseAdminInitialized } from '../modules/shared/config/firebase.js';

async function createDemoAdminUser() {
  console.log('[Demo Admin Provisioning] Starting setup...');
  const oldEmail = 'announcement.admin@demo.com';
  const email = 'announcement@school.com';
  const password = '12345678';
  const fullName = 'Demo Admin';
  const role = 'admin';
  const institutionCode = 'TST001';

  let firebaseUid = '';

  if (!isFirebaseAdminInitialized) {
    console.error('[Firebase Admin] Firebase Admin SDK is NOT initialized.');
    process.exit(1);
  }

  try {
    let existingUser;
    try {
      existingUser = await admin.auth().getUserByEmail(email);
      console.log(`[Firebase Auth] Found existing user with new email (${existingUser.uid}).`);
    } catch {
      existingUser = await admin.auth().getUserByEmail(oldEmail);
      console.log(`[Firebase Auth] Found existing user with old email (${existingUser.uid}). Updating email & password...`);
    }
    firebaseUid = existingUser.uid;
    await admin.auth().updateUser(firebaseUid, {
      email,
      password,
      displayName: fullName,
      emailVerified: true,
    });
    console.log('[Firebase Auth] Email and Password updated successfully.');
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.log('[Firebase Auth] User not found. Creating new Firebase Auth user...');
      const newUser = await admin.auth().createUser({
        email,
        password,
        displayName: fullName,
        emailVerified: true,
      });
      firebaseUid = newUser.uid;
      console.log(`[Firebase Auth] User created successfully. UID: ${firebaseUid}`);
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
    `, [`usr_demo_admin_${Date.now()}`, firebaseUid, email, fullName, role, institutionCode, false, true]);

    console.log('[PostgreSQL] ERP User Profile successfully created/updated in PostgreSQL!');

    const verify = await client.query(`SELECT id, firebase_uid, email, full_name, role, institution_code FROM users WHERE email = $1`, [email]);
    console.log('[Verification Record]:', verify.rows[0]);

  } catch (dbErr: any) {
    console.error('[PostgreSQL Error]', dbErr.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDemoAdminUser();
