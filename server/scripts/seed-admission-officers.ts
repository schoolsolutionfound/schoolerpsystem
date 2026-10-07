import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';

interface SeedAccount {
  email: string;
  password: string;
  fullName: string;
  role: string;
  roles: string[];
  institutionCode: string;
  institutionName: string;
}

const ACCOUNTS: SeedAccount[] = [
  {
    email: 'admission.oakridge@school.com',
    password: 'Officer@123',
    fullName: 'Oakridge Admission Officer',
    role: 'admission_officer',
    roles: ['admission_officer'],
    institutionCode: 'OAK002',
    institutionName: 'Oakridge World Academy',
  },
  {
    email: 'staff.multirole@school.com',
    password: 'Staff@123',
    fullName: 'Finance & Admission Head',
    role: 'accountant',
    roles: ['accountant', 'admission_officer'],
    institutionCode: 'OAK002',
    institutionName: 'Oakridge World Academy',
  },
  {
    email: 'admission.heritage@school.com',
    password: 'Officer@123',
    fullName: 'Heritage Admission Officer',
    role: 'admission_officer',
    roles: ['admission_officer'],
    institutionCode: 'HCS005',
    institutionName: 'The Heritage Cambridge International',
  },
  {
    email: 'admission.greenfield@school.com',
    password: 'Officer@123',
    fullName: 'Greenfield Admission Officer',
    role: 'admission_officer',
    roles: ['admission_officer'],
    institutionCode: 'TST001',
    institutionName: 'Greenfield International School',
  },
  {
    email: 'admission.dps@school.com',
    password: 'Officer@123',
    fullName: 'DPS Admission Officer',
    role: 'admission_officer',
    roles: ['admission_officer'],
    institutionCode: 'DPS003',
    institutionName: 'Delhi Public Academy',
  },
];

async function seed() {
  console.log('--- Seeding Admission Officers and Multi-Role Staff ---');
  if (!isFirebaseAdminInitialized) {
    console.error('Firebase admin not initialized!');
    process.exit(1);
  }

  for (const acc of ACCOUNTS) {
    let uid = '';
    try {
      const existing = await admin.auth().getUserByEmail(acc.email);
      uid = existing.uid;
      await admin.auth().updateUser(uid, {
        displayName: acc.fullName,
        password: acc.password,
      });
      console.log(`Updated Firebase auth user for ${acc.email} (${uid})`);
    } catch {
      const created = await admin.auth().createUser({
        email: acc.email,
        password: acc.password,
        displayName: acc.fullName,
      });
      uid = created.uid;
      console.log(`Created Firebase auth user for ${acc.email} (${uid})`);
    }

    // Upsert into PostgreSQL
    const existingDb = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, acc.email));

    if (existingDb.length > 0) {
      await db
        .update(schema.users)
        .set({
          firebaseUid: uid,
          fullName: acc.fullName,
          role: acc.role,
          roles: acc.roles,
          institutionCode: acc.institutionCode,
          institutionName: acc.institutionName,
          institutionType: 'school',
          mustChangePassword: false,
          profileCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.email, acc.email));
      console.log(`Updated PostgreSQL user for ${acc.email}`);
    } else {
      await db.insert(schema.users).values({
        id: `usr_${acc.institutionCode.toLowerCase()}_${Date.now().toString().slice(-4)}_${Math.random().toString(36).slice(2, 6)}`,
        firebaseUid: uid,
        email: acc.email,
        fullName: acc.fullName,
        role: acc.role,
        roles: acc.roles,
        institutionCode: acc.institutionCode,
        institutionName: acc.institutionName,
        institutionType: 'school',
        mustChangePassword: false,
        profileCompleted: true,
        phone: '+91 9800011223',
        scope: { role: acc.role, roles: acc.roles, campus: acc.institutionName },
      });
      console.log(`Created PostgreSQL user for ${acc.email}`);
    }
  }

  console.log('\n--- Successfully seeded all admission officer and multi-role accounts! ---');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
