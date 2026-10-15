import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';

async function main() {
  if (!isFirebaseAdminInitialized) {
    console.log('Firebase Admin is not initialized!');
    return;
  }
  const result = await admin.auth().listUsers(100);
  console.log(`Found ${result.users.length} Firebase users:`);
  for (const u of result.users) {
    console.log(`- ${u.email} | UID: ${u.uid} | Name: ${u.displayName || 'N/A'}`);
  }
}

main().catch(console.error);
