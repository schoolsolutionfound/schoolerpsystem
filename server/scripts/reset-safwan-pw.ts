import 'dotenv/config';
import { admin, isFirebaseAdminInitialized } from '../src/modules/shared/config/firebase';

async function main() {
  if (!isFirebaseAdminInitialized) {
    console.log('Firebase Admin not initialized');
    return;
  }

  const password = process.env.RESET_PASSWORD;
  if (!password) {
    console.error('RESET_PASSWORD is not set — add it to server/.env, then re-run.');
    process.exit(1);
  }

  const email = process.env.RESET_EMAIL || 'safwanhaneef786@gmail.com';
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().updateUser(user.uid, { password });
  console.log(`Password reset successfully for ${email}`);
}
main().catch(console.error);
