import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (projectId && clientEmail && privateKey) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
} else {
  admin.initializeApp({ projectId });
}

async function setPassword() {
  const email = 'safwanhaneef786@gmail.com';
  const newPassword = 'Student@123';
  
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().updateUser(user.uid, {
    password: newPassword,
    disabled: false,
    emailVerified: true,
  });

  console.log(`Successfully updated password for ${email} (UID: ${user.uid}) to "${newPassword}"`);
}

setPassword().catch(console.error);
