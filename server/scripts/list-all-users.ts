import 'dotenv/config';
import { admin } from '../src/modules/shared/config/firebase.js';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';

async function listUsers() {
  console.log('=== Firebase Auth Users ===');
  let nextPageToken: string | undefined;
  do {
    const listUsersResult = await admin.auth().listUsers(100, nextPageToken);
    listUsersResult.users.forEach((userRecord) => {
      console.log(`FB: ${userRecord.email} | UID: ${userRecord.uid} | Name: ${userRecord.displayName}`);
    });
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log('\n=== PostgreSQL Users ===');
  const allDbUsers = await db.select().from(schema.users);
  allDbUsers.forEach((u) => {
    console.log(`DB: ${u.email} | Role: ${u.role} | Roles: ${JSON.stringify(u.roles)} | Inst: ${u.institutionCode} (${u.institutionName})`);
  });

  process.exit(0);
}

listUsers().catch((e) => {
  console.error(e);
  process.exit(1);
});
