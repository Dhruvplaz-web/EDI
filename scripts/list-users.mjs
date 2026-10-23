import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function listUsers() {
  console.log("Fetching users from Firebase Auth...");
  try {
    const listUsersResult = await auth.listUsers(1000);
    const users = listUsersResult.users;
    
    console.log(`Found ${users.length} users in Auth:`);
    for (const user of users) {
      // Fetch role from Firestore
      const doc = await db.collection("users").doc(user.uid).get();
      const role = doc.exists ? doc.data().role : "NO ROLE SET IN FIRESTORE";
      
      console.log(`- Email: ${user.email} | UID: ${user.uid} | Role: ${role}`);
    }
  } catch (error) {
    console.error("Error listing users:", error);
  }
  process.exit(0);
}

listUsers();
