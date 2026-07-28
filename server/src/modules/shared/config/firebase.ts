import * as admin from 'firebase-admin';

let isFirebaseAdminInitialized = false;

try {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
      });
      isFirebaseAdminInitialized = true;
      console.log('[Firebase Admin] Successfully initialized with service account credentials.');
    } else if (projectId) {
      admin.initializeApp({
        projectId,
        storageBucket,
      });
      isFirebaseAdminInitialized = true;
      console.log('[Firebase Admin] Initialized with Project ID:', projectId);
    } else {
      admin.initializeApp();
      isFirebaseAdminInitialized = true;
      console.log('[Firebase Admin] Initialized with default application credentials.');
    }
  } else {
    isFirebaseAdminInitialized = true;
  }
} catch (error: any) {
  console.warn('[Firebase Admin Warning] Could not initialize Firebase Admin SDK:', error.message);
  console.warn('[Firebase Admin Warning] Running in dev mode with fallback token verification.');
}

export { admin, isFirebaseAdminInitialized };
