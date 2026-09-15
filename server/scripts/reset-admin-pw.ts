import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase.js';

async function main() {
  if (!isFirebaseAdminInitialized) {
    console.log('Firebase Admin not initialized');
    return;
  }
  const uid = 'HIE3PjugTbNopiu9bVf4wel0ibx1';
  await admin.auth().updateUser(uid, { password: 'Safwan@123' });
  console.log('Password reset successfully for safwancoding1919@gmail.com');
}
main().catch(console.error);
