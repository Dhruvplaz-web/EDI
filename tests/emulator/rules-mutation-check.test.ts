import { describe, it, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

describe('Part C.2: Deliberate Security Rule Mutation Checks', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const originalRules = fs.readFileSync(rulesPath, 'utf8');

  it('Mutation 1: deliberately removing orgId check allows tenant hijacking; restored rule rejects it', async () => {
    const brokenRules1 = originalRules.replaceAll(
      'request.resource.data.orgId == resource.data.orgId',
      'true'
    );

    const env1 = await initializeTestEnvironment({
      projectId: 'demo-mutation-1',
      firestore: { rules: brokenRules1, host: '127.0.0.1', port: 8080 },
    });

    try {
      await env1.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('patients').doc('pat_101').set({
          patientId: 'pat_101',
          orgId: 'org_beacon',
          status: 'active',
        });
      });

      const clinician = env1.authenticatedContext('clin_1', { role: 'clinician', orgId: 'org_beacon' });
      // When broken: update succeeds
      await assertSucceeds(
        clinician.firestore().collection('patients').doc('pat_101').update({ orgId: 'org_hijacked' })
      );
      console.log('MUTATION 1 CONFIRMED: Dropping orgId check allowed tenant hijacking (assertSucceeds on malicious payload).');
    } finally {
      await env1.cleanup();
    }

    // Now verify the restored/original rule rejects it
    const secureEnv = await initializeTestEnvironment({
      projectId: 'demo-restored-1',
      firestore: { rules: originalRules, host: '127.0.0.1', port: 8080 },
    });

    try {
      await secureEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('patients').doc('pat_101').set({
          patientId: 'pat_101',
          orgId: 'org_beacon',
          status: 'active',
        });
      });

      const clinician = secureEnv.authenticatedContext('clin_1', { role: 'clinician', orgId: 'org_beacon' });
      await assertFails(
        clinician.firestore().collection('patients').doc('pat_101').update({ orgId: 'org_hijacked' })
      );
      console.log('RESTORED RULE 1 CONFIRMED: Tenant hijacking update was rejected (PERMISSION_DENIED).');
    } finally {
      await secureEnv.cleanup();
    }
  }, 30000);

  it('Mutation 2: deliberately allowing client audit_logs create allows log forgery; restored rule rejects it', async () => {
    const brokenRules2 = originalRules.replace(
      'allow create: if false; // Server Admin SDK only',
      'allow create: if isAuthenticated();'
    );

    const env2 = await initializeTestEnvironment({
      projectId: 'demo-mutation-2',
      firestore: { rules: brokenRules2, host: '127.0.0.1', port: 8080 },
    });

    try {
      const rogueUser = env2.authenticatedContext('rogue_user', { role: 'patient', orgId: 'org_beacon' });
      await assertSucceeds(
        rogueUser.firestore().collection('audit_logs').add({
          actor: 'rogue_user',
          action: 'forged_audit_entry',
          orgId: 'org_beacon',
        })
      );
      console.log('MUTATION 2 CONFIRMED: Allowing client create enabled forged audit log entry (assertSucceeds).');
    } finally {
      await env2.cleanup();
    }

    // Now verify the restored/original rule rejects it
    const secureEnv = await initializeTestEnvironment({
      projectId: 'demo-restored-2',
      firestore: { rules: originalRules, host: '127.0.0.1', port: 8080 },
    });

    try {
      const rogueUser = secureEnv.authenticatedContext('rogue_user', { role: 'patient', orgId: 'org_beacon' });
      await assertFails(
        rogueUser.firestore().collection('audit_logs').add({
          actor: 'rogue_user',
          action: 'forged_audit_entry',
          orgId: 'org_beacon',
        })
      );
      console.log('RESTORED RULE 2 CONFIRMED: Client audit log creation was rejected (PERMISSION_DENIED).');
    } finally {
      await secureEnv.cleanup();
    }
  }, 30000);

  it('Mutation 3: deliberately dropping participant check on calls allows third-party creation; restored rule rejects it', async () => {
    const brokenRules3 = originalRules.replace(
      '(request.resource.data.clinicianId == request.auth.uid || request.resource.data.patientId == request.auth.uid)',
      'true'
    );

    const env3 = await initializeTestEnvironment({
      projectId: 'demo-mutation-3',
      firestore: { rules: brokenRules3, host: '127.0.0.1', port: 8080 },
    });

    try {
      const eavesdropper = env3.authenticatedContext('eavesdropper', { role: 'clinician', orgId: 'org_beacon' });
      await assertSucceeds(
        eavesdropper.firestore().collection('calls').doc('call_unrelated').set({
          clinicianId: 'dr_alice',
          patientId: 'patient_bob',
          orgId: 'org_beacon',
        })
      );
      console.log('MUTATION 3 CONFIRMED: Dropping participant check allowed eavesdropper to create call (assertSucceeds).');
    } finally {
      await env3.cleanup();
    }

    // Now verify the restored/original rule rejects it
    const secureEnv = await initializeTestEnvironment({
      projectId: 'demo-restored-3',
      firestore: { rules: originalRules, host: '127.0.0.1', port: 8080 },
    });

    try {
      const eavesdropper = secureEnv.authenticatedContext('eavesdropper', { role: 'clinician', orgId: 'org_beacon' });
      await assertFails(
        eavesdropper.firestore().collection('calls').doc('call_unrelated').set({
          clinicianId: 'dr_alice',
          patientId: 'patient_bob',
          orgId: 'org_beacon',
        })
      );
      console.log('RESTORED RULE 3 CONFIRMED: Third-party call creation was rejected (PERMISSION_DENIED).');
    } finally {
      await secureEnv.cleanup();
    }
  }, 30000);

  it('Mutation 4: deliberately removing subscription protection allows client tier hijacking; restored rule rejects it', async () => {
    // Deliberately remove subscription affectedKeys check
    const brokenRules4 = originalRules.replace(
      "!request.resource.data.diff(resource.data).affectedKeys().hasAny([\n          'subscription', 'tier', 'status', 'seats', 'currentSeats', 'maxSeats', 'stripeCustomerId', 'stripeSubscriptionId'\n        ])",
      'true'
    );

    const env4 = await initializeTestEnvironment({
      projectId: 'demo-mutation-4',
      firestore: { rules: brokenRules4, host: '127.0.0.1', port: 8080 },
    });

    try {
      await env4.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('organizations').doc('org_beacon').set({
          orgId: 'org_beacon',
          tier: 'starter',
          name: 'Beacon Health',
        });
      });

      const orgAdmin = env4.authenticatedContext('admin_1', { role: 'billing_admin', orgId: 'org_beacon' });
      // When broken: client can upgrade self to enterprise tier
      await assertSucceeds(
        orgAdmin.firestore().collection('organizations').doc('org_beacon').update({ tier: 'enterprise' })
      );
      console.log('MUTATION 4 CONFIRMED: Removing subscription field guard enabled client tier escalation (assertSucceeds).');
    } finally {
      await env4.cleanup();
    }

    // Verify restored rule rejects tier modification by client
    const secureEnv = await initializeTestEnvironment({
      projectId: 'demo-restored-4',
      firestore: { rules: originalRules, host: '127.0.0.1', port: 8080 },
    });

    try {
      await secureEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('organizations').doc('org_beacon').set({
          orgId: 'org_beacon',
          tier: 'starter',
          name: 'Beacon Health',
        });
      });

      const orgAdmin = secureEnv.authenticatedContext('admin_1', { role: 'billing_admin', orgId: 'org_beacon' });
      await assertFails(
        orgAdmin.firestore().collection('organizations').doc('org_beacon').update({ tier: 'enterprise' })
      );
      console.log('RESTORED RULE 4 CONFIRMED: Client tier modification was rejected (PERMISSION_DENIED).');
    } finally {
      await secureEnv.cleanup();
    }
  }, 30000);

  it('Mutation 5: deliberately removing user role immutability allows client privilege escalation; restored rule rejects it', async () => {
    // Deliberately remove role/orgId immutability check
    const brokenRules5 = originalRules.replace(
      "!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'orgId'])",
      'true'
    );

    const env5 = await initializeTestEnvironment({
      projectId: 'demo-mutation-5',
      firestore: { rules: brokenRules5, host: '127.0.0.1', port: 8080 },
    });

    try {
      await env5.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user_hacker_1').set({
          uid: 'user_hacker_1',
          role: 'patient',
          orgId: 'org_beacon',
        });
      });

      const patient = env5.authenticatedContext('user_hacker_1', { role: 'patient', orgId: 'org_beacon' });
      // When broken: patient escalates to super_admin
      await assertSucceeds(
        patient.firestore().collection('users').doc('user_hacker_1').update({ role: 'super_admin' })
      );
      console.log('MUTATION 5 CONFIRMED: Removing role immutability allowed client privilege escalation (assertSucceeds).');
    } finally {
      await env5.cleanup();
    }

    // Verify restored rule rejects role modification
    const secureEnv = await initializeTestEnvironment({
      projectId: 'demo-restored-5',
      firestore: { rules: originalRules, host: '127.0.0.1', port: 8080 },
    });

    try {
      await secureEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user_hacker_1').set({
          uid: 'user_hacker_1',
          role: 'patient',
          orgId: 'org_beacon',
        });
      });

      const patient = secureEnv.authenticatedContext('user_hacker_1', { role: 'patient', orgId: 'org_beacon' });
      await assertFails(
        patient.firestore().collection('users').doc('user_hacker_1').update({ role: 'super_admin' })
      );
      console.log('RESTORED RULE 5 CONFIRMED: Client privilege escalation was rejected (PERMISSION_DENIED).');
    } finally {
      await secureEnv.cleanup();
    }
  }, 30000);
});
