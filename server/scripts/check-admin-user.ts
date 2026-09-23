import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';
import { admin } from '../src/modules/shared/config/firebase.js';

async function main() {
  console.log('--- Checking admin.oakridge@school.com ---');
  try {
    const fbUser = await admin.auth().getUserByEmail('admin.oakridge@school.com');
    console.log('Firebase user found:', {
      uid: fbUser.uid,
      email: fbUser.email,
      customClaims: fbUser.customClaims,
    });
  } catch (err: any) {
    console.log('Firebase user error:', err.message);
  }

  const dbUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, 'admin.oakridge@school.com'));
  console.log('DB user found:', dbUser);

  const oakInst = await db
    .select()
    .from(schema.institutions)
    .where(eq(schema.institutions.institutionCode, 'OAK002'));
  console.log('Oakridge Institution in DB:', oakInst);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
