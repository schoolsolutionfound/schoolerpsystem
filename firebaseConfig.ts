import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

if (!apiKey && __DEV__) {
  console.warn(
    "[FirebaseConfig] EXPO_PUBLIC_FIREBASE_API_KEY is not defined. Please check your .env configuration."
  );
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: any;
try {
  const { getApps, getApp } = require("firebase/app");
  if (getApps().length > 0) {
    app = getApp();
    if (app.options && apiKey) app.options.apiKey = apiKey;
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

if (auth && auth.config && apiKey) {
  auth.config.apiKey = apiKey;
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
