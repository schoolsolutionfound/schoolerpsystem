import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';

async function seedDeveloper() {
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:raees1122@localhost:5432/school_erp';
  const client = new pg.Client({ connectionString });

  const email = process.env.DEV_EMAIL || 'developer@schoolerp.com';
  const fullName = 'Platform Developer';
  const firebaseUid = 'dev_uid_local_123';
  const role = 'Developer'; // Strictly following docs/roles.md

  console.log(`[Seed Script] Updating Developer account role to '${role}' in PostgreSQL...`);
  try {
    await client.connect();
    await client.query(`
      INSERT INTO users (id, firebase_uid, email, full_name, role, must_change_password, profile_completed)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (firebase_uid) DO UPDATE
      SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    `, [`usr_dev_${Date.now()}`, firebaseUid, email, fullName, role, false, true]);

    console.log('[Seed Script SUCCESS] Developer row updated in PostgreSQL!');

    const verify = await client.query(`SELECT id, email, full_name, role, created_at FROM users WHERE email = $1`, [email]);
    console.log('[PostgreSQL DB Row Verified]:', verify.rows);
  } catch (err: any) {
    console.error('[PostgreSQL Seed Error]', err.message);
  } finally {
    await client.end();
  }
}

seedDeveloper();
