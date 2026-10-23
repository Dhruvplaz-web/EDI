import admin from 'firebase-admin';

const adminApp = (admin as any).default || admin;

if (!adminApp.apps || !adminApp.apps.length) {
  try {
    adminApp.initializeApp({
      credential: adminApp.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'dummy-project-id',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'dummy@dummy.com',
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDK\n-----END PRIVATE KEY-----\n',
      }),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const adminAuth = adminApp.auth();
const adminDb = adminApp.firestore();

export { adminAuth, adminDb };
