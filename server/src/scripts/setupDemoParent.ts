import 'dotenv/config';
import pg from 'pg';
import { admin, isFirebaseAdminInitialized } from '../modules/shared/config/firebase.js';

async function setupDemoParent() {
  console.log('[Parent Account Setup] Starting setup...');

  if (!isFirebaseAdminInitialized) {
    console.error('[Firebase Admin] Firebase Admin SDK is NOT initialized.');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/schoolerp';
  const client = new pg.Client({ connectionString });
  await client.connect();

  // 1. Update password for existing safwan.parent@gmail.com
  try {
    const existing = await admin.auth().getUserByEmail('safwan.parent@gmail.com');
    await admin.auth().updateUser(existing.uid, {
      password: '12345678',
      emailVerified: true,
      disabled: false,
    });
    console.log('[Firebase Auth] safwan.parent@gmail.com password updated to: 12345678');
  } catch (err: any) {
    console.log('[Firebase Auth] safwan.parent@gmail.com update error:', err.message);
  }

  // 2. Setup standard parent@school.com
  const demoEmail = 'parent@school.com';
  const demoPassword = '12345678';
  const fullName = 'Haneef (Parent)';
  const role = 'parent';
  const institutionCode = 'TST001';
  let demoUid = '';

  try {
    const existingDemo = await admin.auth().getUserByEmail(demoEmail);
    demoUid = existingDemo.uid;
    await admin.auth().updateUser(demoUid, {
      password: demoPassword,
      displayName: fullName,
      emailVerified: true,
      disabled: false,
    });
    console.log(`[Firebase Auth] ${demoEmail} exists. Password updated to: ${demoPassword}`);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      const newUser = await admin.auth().createUser({
        email: demoEmail,
        password: demoPassword,
        displayName: fullName,
        emailVerified: true,
        disabled: false,
      });
      demoUid = newUser.uid;
      console.log(`[Firebase Auth] Created ${demoEmail} with UID: ${demoUid}`);
    } else {
      console.error('[Firebase Auth Error]', err.message);
      process.exit(1);
    }
  }

  // Scope linking to Safwan Haneef (student)
  const scopeObj = {
    relation: 'Father',
    studentIds: ['usr_1788361696558_4x5g'],
    studentNames: ['Safwan Haneef'],
    linkedStudentUSN: 'C6A-001',
  };

  const userId = `usr_demo_parent_${Date.now()}`;
  await client.query(`
    INSERT INTO users (id, firebase_uid, email, full_name, role, institution_code, must_change_password, profile_completed, scope)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (firebase_uid) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        institution_code = EXCLUDED.institution_code,
        scope = EXCLUDED.scope,
        must_change_password = EXCLUDED.must_change_password,
        profile_completed = EXCLUDED.profile_completed
  `, [
    userId,
    demoUid,
    demoEmail,
    fullName,
    role,
    institutionCode,
    false,
    true,
    JSON.stringify(scopeObj),
  ]);

  console.log(`[Postgres] User record for ${demoEmail} synchronized successfully.`);
  await client.end();
}

setupDemoParent().catch(console.error);
