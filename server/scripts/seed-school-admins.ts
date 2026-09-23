import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';

interface SchoolAdminConfig {
  email: string;
  password: string;
  fullName: string;
  institutionCode: string;
  institutionName: string;
}

const schoolAdmins: SchoolAdminConfig[] = [
  {
    email: 'admin.greenfield@school.com',
    password: 'Admin@123',
    fullName: 'Greenfield Administrator',
    institutionCode: 'TST001',
    institutionName: 'Greenfield International School',
  },
  {
    email: 'admin.oakridge@school.com',
    password: 'Admin@123',
    fullName: 'Oakridge Administrator',
    institutionCode: 'OAK002',
    institutionName: 'Oakridge World Academy',
  },
  {
    email: 'admin.dps@school.com',
    password: 'Admin@123',
    fullName: 'DPS Administrator',
    institutionCode: 'DPS003',
    institutionName: 'Delhi Public Academy',
  },
  {
    email: 'admin.stxaviers@school.com',
    password: 'Admin@123',
    fullName: "St. Xavier's Administrator",
    institutionCode: 'STX004',
    institutionName: "St. Xavier's High School",
  },
  {
    email: 'admin.heritage@school.com',
    password: 'Admin@123',
    fullName: 'Heritage Cambridge Administrator',
    institutionCode: 'HCS005',
    institutionName: 'The Heritage Cambridge International',
  },
  {
    email: 'admin.montessori@school.com',
    password: 'Admin@123',
    fullName: 'Montessori Administrator',
    institutionCode: 'LEM006',
    institutionName: 'Little Explorers Montessori Academy',
  },
];

async function seed() {
  if (!db) {
    console.error('PostgreSQL database connection not available.');
    process.exit(1);
  }

  console.log('=====================================================');
  console.log('🏫 PROVISIONING ADMIN CREDENTIALS FOR ALL 6 SCHOOLS');
  console.log('=====================================================\n');

  for (const a of schoolAdmins) {
    let firebaseUid = `uid_${a.institutionCode.toLowerCase()}_admin`;

    // 1. Firebase Auth
    if (isFirebaseAdminInitialized) {
      try {
        const fbUser = await admin.auth().getUserByEmail(a.email);
        firebaseUid = fbUser.uid;
        await admin.auth().updateUser(firebaseUid, {
          password: a.password,
          displayName: a.fullName,
          emailVerified: true,
        });
        console.log(`✓ Firebase Auth updated: ${a.email}`);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          const created = await admin.auth().createUser({
            email: a.email,
            password: a.password,
            displayName: a.fullName,
            emailVerified: true,
          });
          firebaseUid = created.uid;
          console.log(`✓ Firebase Auth created: ${a.email}`);
        } else {
          console.error(`Firebase error for ${a.email}:`, err.message);
        }
      }
    }

    // 2. PostgreSQL Users Table
    const existingDbUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, a.email));

    if (existingDbUser.length === 0) {
      await db.insert(schema.users).values({
        id: `usr_adm_${a.institutionCode.toLowerCase()}_${Date.now().toString().slice(-4)}`,
        firebaseUid,
        email: a.email,
        fullName: a.fullName,
        role: 'admin',
        institutionCode: a.institutionCode,
        institutionName: a.institutionName,
        institutionType: 'school',
        profileCompleted: true,
        mustChangePassword: false,
        phone: '+91 9800000000',
        scope: JSON.stringify({ role: 'admin', campus: a.institutionName }),
      });
      console.log(`  ✓ PostgreSQL user created: ${a.fullName} (${a.institutionCode})`);
    } else {
      await db
        .update(schema.users)
        .set({
          firebaseUid,
          fullName: a.fullName,
          role: 'admin',
          institutionCode: a.institutionCode,
          institutionName: a.institutionName,
          institutionType: 'school',
          profileCompleted: true,
          mustChangePassword: false,
        })
        .where(eq(schema.users.email, a.email));
      console.log(`  ✓ PostgreSQL user updated: ${a.fullName} (${a.institutionCode})`);
    }
  }

  console.log('\n=====================================================');
  console.log('✨ ALL 6 SCHOOL ADMIN ACCOUNTS PROVISIONED!');
  console.log('=====================================================');
  process.exit(0);
}

seed().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});
