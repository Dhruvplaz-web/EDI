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

async function deployRules() {
  try {
    const rulesSource = fs.readFileSync(path.join(process.cwd(), "firestore.rules"), "utf8");
    const securityRules = admin.securityRules();
    
    console.log("Creating new ruleset...");
    const ruleset = await securityRules.createRuleset(
      securityRules.createRulesFileFromSource("firestore.rules", rulesSource)
    );
    
    console.log("Releasing ruleset...");
    await securityRules.releaseFirestoreRuleset(ruleset.name);
    
    console.log("✅ Successfully deployed firestore.rules!");
  } catch (error) {
    console.error("❌ Error deploying rules:", error);
  }
  process.exit(0);
}

deployRules();
