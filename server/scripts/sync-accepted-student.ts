import 'dotenv/config';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { admissionsService } from '../src/modules/admissions/admissions.service.js';
import { eq } from 'drizzle-orm';

async function syncAccepted() {
  const miriam = await db
    .select()
    .from(schema.admissions)
    .where(eq(schema.admissions.id, 'adm_test_scheduled_02'));

  if (miriam.length > 0) {
    console.log('Found Miriam record, setting status to accepted and triggering handleAdmissionAccepted...');
    await admissionsService.updateAdmissionStatus('adm_test_scheduled_02', 'accepted');
    console.log('Successfully accepted Miriam and linked her to parent!');
  } else {
    console.log('Miriam record not found');
  }

  // Also check parent user
  const parent = await db.select().from(schema.users).where(eq(schema.users.email, 'normal.parent@gmail.com'));
  if (parent.length > 0) {
    console.log('Parent user in DB:', {
      email: parent[0].email,
      institutionCode: parent[0].institutionCode,
      institutionName: parent[0].institutionName,
      scope: parent[0].scope,
    });
  }

  process.exit(0);
}

syncAccepted().catch((e) => {
  console.error(e);
  process.exit(1);
});
