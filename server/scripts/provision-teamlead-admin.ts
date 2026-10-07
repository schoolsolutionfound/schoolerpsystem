import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';

async function provisionTeamLeadAdmin() {
  const email = 'admi.okridge@school.com';
  const password = 'Admin@123'; // Standard test password
  const fullName = 'Oakridge Administrator';
  const institutionCode = 'OAK002';
  const institutionName = 'Oakridge World Academy';

  console.log(`--- Provisioning team lead admin: ${email} ---`);

  if (!isFirebaseAdminInitialized) {
    console.error('Firebase Admin not initialized');
    process.exit(1);
  }

  let uid = '';
  try {
    const existing = await admin.auth().getUserByEmail(email);
    uid = existing.uid;
    await admin.auth().updateUser(uid, {
      displayName: fullName,
      password: password,
    });
    console.log(`Updated existing Firebase Auth account for ${email} (UID: ${uid})`);
  } catch {
    const created = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
    });
    uid = created.uid;
    console.log(`Created new Firebase Auth account for ${email} (UID: ${uid})`);
  }

  // 1. Upsert into PostgreSQL
  const dbUser = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (dbUser.length > 0) {
    await db
      .update(schema.users)
      .set({
        firebaseUid: uid,
        fullName,
        role: 'admin',
        roles: ['admin'],
        institutionCode,
        institutionName,
        institutionType: 'school',
        profileCompleted: true,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.email, email));
    console.log(`Updated PostgreSQL user for ${email}`);
  } else {
    await db.insert(schema.users).values({
      id: `usr_oak_lead_${Date.now().toString().slice(-4)}`,
      firebaseUid: uid,
      email,
      fullName,
      role: 'admin',
      roles: ['admin'],
      institutionCode,
      institutionName,
      institutionType: 'school',
      profileCompleted: true,
      mustChangePassword: false,
      phone: '+91 9800000001',
      scope: { role: 'admin', campus: institutionName },
      permissions: ['ALL'],
    });
    console.log(`Inserted PostgreSQL user for ${email}`);
  }

  // 2. Also write to Firestore users collection as a fallback
  try {
    const firestore = admin.firestore();
    await firestore.collection('users').doc(uid).set(
      {
        email,
        fullName,
        displayName: fullName,
        role: 'admin',
        userRole: 'admin',
        institutionCode,
        institutionId: institutionCode,
        institutionName,
        schoolName: institutionName,
        institutionType: 'school',
        profileCompleted: true,
        mustChangePassword: false,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`Synced to Firestore users/${uid}`);
  } catch (err: any) {
    console.warn('Firestore fallback sync error:', err.message);
  }

  console.log(`\nSuccessfully verified and configured ${email} as Admin of Oakridge World Academy!`);
  process.exit(0);
}

provisionTeamLeadAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
