import 'dotenv/config';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';

async function main() {
  const targetEmail = 'admin@vmhs.com';
  const newPassword = 'Admin@123';

  console.log(`Checking user: ${targetEmail}`);

  if (!isFirebaseAdminInitialized) {
    console.error('Firebase Admin is not initialized!');
    process.exit(1);
  }

  try {
    const fbUser = await admin.auth().getUserByEmail(targetEmail);
    console.log(`Firebase user found: UID ${fbUser.uid}, Email: ${fbUser.email}`);
    
    await admin.auth().updateUser(fbUser.uid, {
      password: newPassword,
    });
    console.log(`Successfully reset Firebase Auth password for ${targetEmail} to: ${newPassword}`);
  } catch (err: any) {
    console.error(`Firebase lookup/update error:`, err.message);
  }

  const dbUsers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, targetEmail));
  
  console.log(`DB users count: ${dbUsers.length}`);
  if (dbUsers.length > 0) {
    console.log('DB user details:', {
      id: dbUsers[0].id,
      email: dbUsers[0].email,
      role: dbUsers[0].role,
      roles: dbUsers[0].roles,
      institutionCode: dbUsers[0].institutionCode,
      institutionName: dbUsers[0].institutionName,
      institutionType: dbUsers[0].institutionType,
    });
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
