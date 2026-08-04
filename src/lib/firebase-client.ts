import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredFirebaseFields = {
  NEXT_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  NEXT_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
};

export function getFirebaseConfigurationError(): string | null {
  const missing = Object.entries(requiredFirebaseFields)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    return `Firebase web configuration is missing: ${missing.join(', ')}. Start Xtara with npm run dev or provide these variables explicitly.`;
  }
  if (!/^AIza[0-9A-Za-z_-]{20,}$/.test(firebaseConfig.apiKey || '')) {
    return 'Firebase web configuration contains a malformed API key. Start Xtara with npm run dev or verify NEXT_PUBLIC_FIREBASE_API_KEY.';
  }
  if (firebaseConfig.projectId !== 'bigmints-xtara') {
    return 'Firebase web configuration belongs to an unexpected project.';
  }
  return null;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  const configurationError = getFirebaseConfigurationError();
  if (configurationError) throw new Error(configurationError);
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig as Required<typeof firebaseConfig>);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}
