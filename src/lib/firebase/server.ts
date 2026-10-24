import admin from 'firebase-admin';

const adminApp = (admin as typeof admin & { default?: typeof admin }).default || admin;

if (!adminApp.apps || !adminApp.apps.length) {
  try {
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      adminApp.initializeApp({
        credential: adminApp.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'dummy-project-id',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      adminApp.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'praxis-ai-health-dev',
      });
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Firebase admin initialization notice:', errorMsg);
    try {
      if (!adminApp.apps.length) {
        adminApp.initializeApp({ projectId: 'praxis-fallback' });
      }
    } catch {}
  }
}

let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;

try {
  if (adminApp.apps.length) {
    adminAuth = adminApp.auth();
    adminDb = adminApp.firestore();
  }
} catch (e) {
  console.warn('Firebase admin services notice:', e);
}

export { adminAuth, adminDb };
