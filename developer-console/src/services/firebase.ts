import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  throw new Error('Missing Firebase configuration. Set VITE_FIREBASE_* environment variables (see .env.example).');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Developer Console] Could not enable persistent session:', err.message);
});

export { signInWithEmailAndPassword, signOut };
