import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const { admin, isFirebaseAdminInitialized } = await import('../src/modules/shared/config/firebase.js');
  const { dbUpsertUser } = await import('../src/modules/shared/db/index.js');

  const email = 'onboarding.student@school.com';
  const password = 'Student@123';
  const fullName = 'Onboarding Student';
  const institutionCode = 'TST-SCH-001';
  const institutionName = 'Test High School';
  const institutionType = 'school';

  if (!isFirebaseAdminInitialized) {
    throw new Error('Firebase Admin SDK is not initialized.');
  }

  let firebaseUid = '';
  try {
    const existing = await admin.auth().getUserByEmail(email);
    firebaseUid = existing.uid;
    await admin.auth().updateUser(firebaseUid, {
      password,
      displayName: fullName,
      emailVerified: false,
      disabled: false,
    });
    console.log(`Firebase user updated: ${email}`);
  } catch (err: any) {
    if (err.code !== 'auth/user-not-found') throw err;
    const created = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: false,
      disabled: false,
    });
    firebaseUid = created.uid;
    console.log(`Firebase user created: ${email}`);
  }

  await dbUpsertUser({
    firebaseUid,
    email,
    fullName,
    role: 'student',
    institutionCode,
    institutionName,
    institutionType,
    rollNoOrUSN: 'ONB-001',
    mustChangePassword: true,
    profileCompleted: false,
    emailVerified: false,
  });

  const pg = await import('pg');
  const client = new pg.default.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const updated = await client.query(
      `UPDATE users
       SET email_verified = false,
           email_verified_at = NULL,
           must_change_password = true,
           profile_completed = false
       WHERE email = $1
       RETURNING email, role, institution_code, must_change_password, profile_completed, email_verified`,
      [email]
    );
    console.table(updated.rows);
  } finally {
    await client.end();
  }

  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('OTP: 123456');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Onboarding Student Setup]', err?.message || err);
    process.exit(1);
  });
