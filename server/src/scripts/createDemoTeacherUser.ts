import 'dotenv/config';
import pg from 'pg';
import { admin, isFirebaseAdminInitialized } from '../modules/shared/config/firebase.js';

async function createDemoTeacherUser() {
  console.log('[Demo Teacher Provisioning] Starting setup...');
  const email = 'teacher@school.com';
  const password = 'Teacher@123';
  const fullName = 'Demo Teacher';
  const role = 'teacher';
  const institutionCode = 'TST001';
  const institutionName = 'Test School';
  const institutionType = 'school';

  let firebaseUid = '';

  if (!isFirebaseAdminInitialized) {
    console.error('[Firebase Admin] Firebase Admin SDK is NOT initialized.');
    process.exit(1);
  }

  try {
    const existingUser = await admin.auth().getUserByEmail(email);
    firebaseUid = existingUser.uid;
    console.log(`[Firebase Auth] Found existing teacher user (${firebaseUid}). Updating password & status...`);
    await admin.auth().updateUser(firebaseUid, {
      password,
      displayName: fullName,
      emailVerified: true,
      disabled: false,
    });
    console.log('[Firebase Auth] Teacher password and status updated successfully.');
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.log('[Firebase Auth] Teacher user not found. Creating new Firebase Auth user...');
      const newUser = await admin.auth().createUser({
        email,
        password,
        displayName: fullName,
        emailVerified: true,
        disabled: false,
      });
      firebaseUid = newUser.uid;
      console.log(`[Firebase Auth] Teacher user created successfully. UID: ${firebaseUid}`);
    } else {
      console.error('[Firebase Auth Error]', err.message);
      process.exit(1);
    }
  }

  // Connect to PostgreSQL
  const connectionString =
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/schoolerp';
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();

    const scopeObj = JSON.stringify({
      employeeId: 'TCH-DEMO-001',
      department: 'Mathematics',
    });

    // Check if user already exists in DB by email or firebase_uid
    const existingDb = await client.query(
      `SELECT id FROM users WHERE email = $1 OR firebase_uid = $2`,
      [email, firebaseUid]
    );

    let teacherId = '';
    if (existingDb.rows.length > 0) {
      teacherId = existingDb.rows[0].id;
      await client.query(
        `UPDATE users
         SET firebase_uid = $1,
             email = $2,
             full_name = $3,
             role = $4,
             institution_code = $5,
             institution_name = $6,
             institution_type = $7,
             must_change_password = false,
             profile_completed = true,
             scope = $8
         WHERE id = $9`,
        [firebaseUid, email, fullName, role, institutionCode, institutionName, institutionType, scopeObj, teacherId]
      );
      console.log(`[PostgreSQL] Updated existing teacher in DB (${teacherId})`);
    } else {
      teacherId = `usr_demo_teacher_${Date.now()}`;
      await client.query(
        `INSERT INTO users
           (id, firebase_uid, email, full_name, role, institution_code, institution_name, institution_type,
            must_change_password, profile_completed, scope)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, true, $9)`,
        [teacherId, firebaseUid, email, fullName, role, institutionCode, institutionName, institutionType, scopeObj]
      );
      console.log(`[PostgreSQL] Inserted new teacher in DB (${teacherId})`);
    }

    // Assign Demo Teacher as class teacher of 'Class 5 A'
    const classRes = await client.query(
      `SELECT id, name FROM class_sections WHERE institution_code = $1 AND name = 'Class 5 A'`,
      [institutionCode]
    );
    if (classRes.rows.length > 0) {
      const classId = classRes.rows[0].id;
      await client.query(
        `UPDATE class_sections SET class_teacher_id = $1 WHERE id = $2`,
        [teacherId, classId]
      );
      console.log(`[PostgreSQL] Assigned Demo Teacher as class teacher of Class 5 A (${classId})`);

      // Also ensure subject assignment in Class 5 A (e.g. Mathematics)
      const mathSub = await client.query(
        `SELECT id FROM subjects WHERE institution_code = $1 AND name = 'Mathematics'`,
        [institutionCode]
      );
      if (mathSub.rows.length > 0) {
        const mathSubId = mathSub.rows[0].id;
        const existingSt = await client.query(
          `SELECT id FROM subject_teachers WHERE class_section_id = $1 AND subject_id = $2`,
          [classId, mathSubId]
        );
        if (existingSt.rows.length > 0) {
          await client.query(
            `UPDATE subject_teachers SET teacher_id = $1, updated_at = NOW() WHERE id = $2`,
            [teacherId, existingSt.rows[0].id]
          );
        } else {
          await client.query(
            `INSERT INTO subject_teachers (id, institution_code, class_section_id, subject_id, teacher_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [`st_${Date.now()}`, institutionCode, classId, mathSubId, teacherId]
          );
        }
        console.log(`[PostgreSQL] Assigned Demo Teacher to teach Mathematics in Class 5 A`);
      }
    }

    const verify = await client.query(
      `SELECT id, firebase_uid, email, full_name, role, institution_code, must_change_password, profile_completed
       FROM users WHERE email = $1`,
      [email]
    );
    console.log('[Verification Record]:', verify.rows[0]);

  } catch (dbErr: any) {
    console.error('[PostgreSQL Error]', dbErr.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDemoTeacherUser();
