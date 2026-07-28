import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAcEE-UveuoG4Fgy48AE20q1a38aQmkqDY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'school-erp-app-dec82.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'school-erp-app-dec82',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'school-erp-app-dec82.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '321397563029',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:321397563029:web:314a5bba3887c5c266459c',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export { signInWithEmailAndPassword, signOut };
