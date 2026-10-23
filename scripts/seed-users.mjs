import admin from "firebase-admin";
import fs from "fs";
import path from "path";
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

const db = admin.firestore();
const auth = admin.auth();

const mockUsers = [
  { email: "super@praxis.ai", password: "password123", role: "super_admin", name: "System Admin" },
  { email: "clinic@praxis.ai", password: "password123", role: "clinic_manager", name: "Clinic Manager" },
  { email: "clinician@praxis.ai", password: "password123", role: "clinician", name: "Dr. Jane Smith" },
  { email: "patient@praxis.ai", password: "password123", role: "patient", name: "John Doe" }
];

async function seedUsers() {
  console.log("Starting DB seed...");
  for (const u of mockUsers) {
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(u.email);
        console.log(`User ${u.email} already exists.`);
      } catch (err) {
        if (err.code === "auth/user-not-found") {
          userRecord = await auth.createUser({
            email: u.email,
            password: u.password,
            displayName: u.name,
          });
          console.log(`Created user ${u.email} in Auth.`);
        } else {
          throw err;
        }
      }

      await db.collection("users").doc(userRecord.uid).set({
        email: u.email,
        role: u.role,
        displayName: u.name,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`Set Firestore document for ${u.email} as ${u.role}`);
    } catch (error) {
      console.error(`Error seeding ${u.email}:`, error);
    }
  }
  console.log("Seeding complete.");
  process.exit(0);
}

seedUsers();
