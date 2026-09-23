import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";

const VALID_API_KEY = "AIzaSyAcEE-UveuoG4Fgy48AE20q1a38aQmkqDY";

const firebaseConfig = {
  apiKey: VALID_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "school-erp-app-dec82.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "school-erp-app-dec82",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "school-erp-app-dec82.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "321397563029",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:321397563029:web:314a5bba3887c5c266459c",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-Q250F7HT2P",
};

let app: any;
try {
  const { getApps, getApp } = require("firebase/app");
  if (getApps().length > 0) {
    app = getApp();
    if (app.options) app.options.apiKey = VALID_API_KEY;
  } else {
    app = initializeApp(firebaseConfig);
  }
} catch {
  app = initializeApp(firebaseConfig);
}

let analytics: any;
isSupported().then((yes: boolean) => {
  if (yes) {
    analytics = getAnalytics(app);
  }
});

const trackEvent = (name: string, params?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, name, params);
  }
};

let auth: any;
try {
  const { getReactNativePersistence } = require('firebase/auth');
  const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch {
  auth = getAuth(app);
}

if (auth && auth.config) {
  auth.config.apiKey = VALID_API_KEY;
}

let db: any;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  db = getFirestore(app);
}

const storage = getStorage(app);

export { auth, db, storage, trackEvent };
