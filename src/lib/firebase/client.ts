import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy-app-id",
};

// Initialize Firebase for Client Side
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// Connect to local Firebase Emulators when configured
if (
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true' ||
   process.env.FIREBASE_AUTH_EMULATOR_HOST ||
   process.env.FIRESTORE_EMULATOR_HOST)
) {
  try {
    const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'http://127.0.0.1:9099';
    connectAuthEmulator(auth, authHost, { disableWarnings: true });
  } catch {
    // Already connected or uninitialized in hot reload
  }

  try {
    const fsHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    const [host, port] = fsHost.split(':');
    connectFirestoreEmulator(db, host || '127.0.0.1', parseInt(port || '8080', 10));
  } catch {
    // Already connected or uninitialized in hot reload
  }
}

export { app, auth, db };
