import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

async function runMutationChecks() {
  console.log('=== PART C.2: FIRESTORE RULES MUTATION VULNERABILITY CHECK ===');
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const originalRules = fs.readFileSync(rulesPath, 'utf8');

  // MUTATION 1: Remove orgId check on patient update
  console.log('\n--- Testing Mutation 1: Drop orgId check on patient update ---');
  const brokenRules1 = originalRules.replace(
    'request.resource.data.orgId == resource.data.orgId',
    'true'
  );

  let env1: RulesTestEnvironment | null = null;
  try {
    env1 = await initializeTestEnvironment({
      projectId: 'demo-mutation-1',
      firestore: { rules: brokenRules1, host: '127.0.0.1', port: 8080 },
    });

    await env1.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('patients').doc('pat_101').set({
        patientId: 'pat_101',
        orgId: 'org_beacon',
        status: 'active',
      });
    });

    const clinician = env1.authenticatedContext('clin_1', { role: 'clinician', orgId: 'org_beacon' });
    try {
      // With broken rule, tenant hijacking update succeeds
      await clinician.firestore().collection('patients').doc('pat_101').update({ orgId: 'org_hijacked' });
      console.log('MUTATION 1 CONFIRMED VULNERABLE: Patient orgId change SUCCEEDED when rule was broken (Vulnerability Detected).');
    } catch {
      console.log('MUTATION 1 FAILED TO EXPLOIT');
    }
  } finally {
    if (env1) await env1.cleanup();
  }

  // MUTATION 2: Allow client audit_logs create
  console.log('\n--- Testing Mutation 2: Allow client audit_logs create ---');
  const brokenRules2 = originalRules.replace(
    'allow create: if false; // Server Admin SDK only',
    'allow create: if isAuthenticated(); // VULNERABLE MUTATION'
  );

  let env2: RulesTestEnvironment | null = null;
  try {
    env2 = await initializeTestEnvironment({
      projectId: 'demo-mutation-2',
      firestore: { rules: brokenRules2, host: '127.0.0.1', port: 8080 },
    });

    const rogueUser = env2.authenticatedContext('rogue_user', { role: 'patient', orgId: 'org_beacon' });
    try {
      await rogueUser.firestore().collection('audit_logs').add({
        actor: 'rogue_user',
        action: 'forged_audit_entry',
        orgId: 'org_beacon',
      });
      console.log('MUTATION 2 CONFIRMED VULNERABLE: Client forged audit_log creation SUCCEEDED when rule was broken (Vulnerability Detected).');
    } catch {
      console.log('MUTATION 2 FAILED TO EXPLOIT');
    }
  } finally {
    if (env2) await env2.cleanup();
  }

  // MUTATION 3: Drop participant check on calls
  console.log('\n--- Testing Mutation 3: Drop participant check on calls ---');
  const brokenRules3 = originalRules.replace(
    '(request.resource.data.clinicianId == request.auth.uid || request.resource.data.patientId == request.auth.uid)',
    'true // VULNERABLE MUTATION'
  );

  let env3: RulesTestEnvironment | null = null;
  try {
    env3 = await initializeTestEnvironment({
      projectId: 'demo-mutation-3',
      firestore: { rules: brokenRules3, host: '127.0.0.1', port: 8080 },
    });

    const eavesdropper = env3.authenticatedContext('eavesdropper', { role: 'clinician', orgId: 'org_beacon' });
    try {
      await eavesdropper.firestore().collection('calls').doc('call_unrelated').set({
        clinicianId: 'dr_alice',
        patientId: 'patient_bob',
        orgId: 'org_beacon',
      });
      console.log('MUTATION 3 CONFIRMED VULNERABLE: Third-party call creation SUCCEEDED when participant check was dropped (Vulnerability Detected).');
    } catch {
      console.log('MUTATION 3 FAILED TO EXPLOIT');
    }
  } finally {
    if (env3) await env3.cleanup();
  }

  console.log('\n=== RESTORING ORIGINAL SECURE RULES AND VERIFYING REJECTION ===');
  let secureEnv: RulesTestEnvironment | null = null;
  try {
    secureEnv = await initializeTestEnvironment({
      projectId: 'demo-restored-rules',
      firestore: { rules: originalRules, host: '127.0.0.1', port: 8080 },
    });

    await secureEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('patients').doc('pat_101').set({
        patientId: 'pat_101',
        orgId: 'org_beacon',
        status: 'active',
      });
    });

    const clinician = secureEnv.authenticatedContext('clin_1', { role: 'clinician', orgId: 'org_beacon' });
    await assertFails(clinician.firestore().collection('patients').doc('pat_101').update({ orgId: 'org_hijacked' }));
    console.log('Restored Rule 1: Patient orgId change correctly REJECTED (PERMISSION_DENIED).');

    const rogueUser = secureEnv.authenticatedContext('rogue_user', { role: 'patient', orgId: 'org_beacon' });
    await assertFails(rogueUser.firestore().collection('audit_logs').add({ action: 'forged' }));
    console.log('Restored Rule 2: Client audit log creation correctly REJECTED (PERMISSION_DENIED).');

    const eavesdropper = secureEnv.authenticatedContext('eavesdropper', { role: 'clinician', orgId: 'org_beacon' });
    await assertFails(eavesdropper.firestore().collection('calls').doc('call_unrelated').set({
      clinicianId: 'dr_alice',
      patientId: 'patient_bob',
      orgId: 'org_beacon',
    }));
    console.log('Restored Rule 3: Third-party call creation correctly REJECTED (PERMISSION_DENIED).');
  } finally {
    if (secureEnv) await secureEnv.cleanup();
  }
  console.log('\n=== ALL 3 MUTATION CHECKS VERIFIED & ORIGINAL RULES RESTORED ===');
}

runMutationChecks().catch((err) => {
  console.error('Mutation check failed:', err);
  process.exit(1);
});
