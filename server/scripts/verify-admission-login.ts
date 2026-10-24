import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const { admin } = await import('../src/modules/shared/config/firebase.js');
  const user = await admin.auth().getUserByEmail('admission@schoolerp.com');
  console.log('Firebase User verified:', {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  });

  const { db } = await import('../src/modules/shared/db/index.js');
  const { users } = await import('../src/modules/shared/db/schema.js');
  const { eq } = await import('drizzle-orm');

  const dbUser = await db?.query.users.findFirst({
    where: eq(users.email, 'admission@schoolerp.com'),
  });

  console.log('Postgres DB User verified:', {
    id: dbUser?.id,
    email: dbUser?.email,
    role: dbUser?.role,
    institutionCode: dbUser?.institutionCode,
    institutionName: dbUser?.institutionName,
  });
  process.exit(0);
}

run();
