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

const usersToSetup = [
  { email: "doctor@praxis.ai", password: "Password123!", role: "clinician", name: "Dr. Demo" },
  { email: "patient@praxis.ai", password: "Password123!", role: "patient", name: "Demo Patient" }
];

async function setupUsers() {
  console.log("Setting up guaranteed login accounts...");

  for (const u of usersToSetup) {
    let uid;
    try {
      // Check if user exists
      const existingUser = await auth.getUserByEmail(u.email);
      uid = existingUser.uid;
      
      // Update the password to guarantee we know what it is
      await auth.updateUser(uid, {
        password: u.password,
        displayName: u.name
      });
      console.log(`Updated existing user: ${u.email} with new password.`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create user if they don't exist
        const newUser = await auth.createUser({
          email: u.email,
          password: u.password,
          displayName: u.name,
        });
        uid = newUser.uid;
        console.log(`Created new user: ${u.email}`);
      } else {
        console.error(`Error with ${u.email}:`, error);
        continue;
      }
    }

    // Set the role in Firestore so the dashboard routing works correctly
    try {
      await db.collection("users").doc(uid).set({
        email: u.email,
        role: u.role,
        displayName: u.name,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`✅ Successfully linked ${u.email} to role '${u.role}' in Firestore.`);
    } catch (fsError) {
      console.error(`❌ Error setting Firestore role for ${u.email}:`, fsError);
    }
  }

  console.log("\nSetup complete. You can now use these credentials:");
  usersToSetup.forEach(u => {
    console.log(`-> Email: ${u.email} | Password: ${u.password} | Role: ${u.role}`);
  });
  
  process.exit(0);
}

setupUsers();
