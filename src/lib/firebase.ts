import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-domain',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-bucket',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'demo-sender',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app',
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // In preview mode (no env vars), we just let it use dummy config quietly
  // so that the Next.js dev server doesn't show an error overlay.

  return initializeApp(firebaseConfig);
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getFirebaseApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Re-throw so the app can show a proper error state
  throw error;
}

export { app, auth, db };
