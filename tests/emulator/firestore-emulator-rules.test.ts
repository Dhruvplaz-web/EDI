import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

describe('C. Firestore Security Rules Real Emulator Verification', () => {
  beforeAll(async () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: 'demo-praxis-rules',
      firestore: {
        rules,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  // 1. Matrix: patients collection
  describe('Collection: /patients', () => {
    it('allows clinician to read patient in SAME org', async () => {
      // Seed patient via admin context
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('patients').doc('pat_101').set({
          patientId: 'pat_101',
          orgId: 'org_beacon',
          name: 'Alice Patient',
        });
      });

      const clinicianSameOrg = testEnv.authenticatedContext('clin_1', {
        role: 'clinician',
        orgId: 'org_beacon',
      });
      await assertSucceeds(clinicianSameOrg.firestore().collection('patients').doc('pat_101').get());
    });

    it('denies clinician reading patient in OTHER org (cross-tenant IDOR)', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('patients').doc('pat_202').set({
          patientId: 'pat_202',
          orgId: 'org_metro',
          name: 'Bob Patient',
        });
      });

      const clinicianOrgA = testEnv.authenticatedContext('clin_1', {
        role: 'clinician',
        orgId: 'org_beacon',
      });
      await assertFails(clinicianOrgA.firestore().collection('patients').doc('pat_202').get());
    });

    it('allows patient to read their OWN record', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('patients').doc('usr_alice').set({
          patientId: 'usr_alice',
          orgId: 'org_beacon',
          name: 'Alice',
        });
      });

      const alice = testEnv.authenticatedContext('usr_alice', {
        role: 'patient',
        orgId: 'org_beacon',
      });
      await assertSucceeds(alice.firestore().collection('patients').doc('usr_alice').get());
    });

    it('denies patient reading another patient record (same org)', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('patients').doc('usr_bob').set({
          patientId: 'usr_bob',
          orgId: 'org_beacon',
          name: 'Bob',
        });
      });

      const alice = testEnv.authenticatedContext('usr_alice', {
        role: 'patient',
        orgId: 'org_beacon',
      });
      await assertFails(alice.firestore().collection('patients').doc('usr_bob').get());
    });

    it('denies platform super_admin casual cross-tenant PHI read without break-glass', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('patients').doc('pat_tenant_x').set({
          patientId: 'pat_tenant_x',
          orgId: 'org_tenant_x',
          medicalRecord: 'Sensitive PHI',
        });
      });

      const platformAdmin = testEnv.authenticatedContext('super_root', {
        role: 'super_admin',
        orgId: 'org_platform_hq',
      });
      // Least-privilege separation: Super Admin is denied default cross-tenant clinical reads
      await assertFails(platformAdmin.firestore().collection('patients').doc('pat_tenant_x').get());
    });

    it('denies updating patient orgId (tenant-hijacking mutation)', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('patients').doc('pat_101').set({
          patientId: 'pat_101',
          orgId: 'org_beacon',
          status: 'active',
        });
      });

      const clinicianSameOrg = testEnv.authenticatedContext('clin_1', {
        role: 'clinician',
        orgId: 'org_beacon',
      });
      // Attempt to change orgId from org_beacon to org_hijacked
      await assertFails(
        clinicianSameOrg.firestore().collection('patients').doc('pat_101').update({
          orgId: 'org_hijacked',
        })
      );
    });

    it('allows clinical staff to update patient data within same org while preserving orgId', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('patients').doc('pat_101').set({
          patientId: 'pat_101',
          orgId: 'org_beacon',
          status: 'active',
        });
      });

      const clinicianSameOrg = testEnv.authenticatedContext('clin_1', {
        role: 'clinician',
        orgId: 'org_beacon',
      });
      await assertSucceeds(
        clinicianSameOrg.firestore().collection('patients').doc('pat_101').update({
          orgId: 'org_beacon',
          status: 'discharged',
        })
      );
    });
  });

  // 2. Matrix: audit_logs collection (B.3)
  describe('Collection: /audit_logs', () => {
    it('strictly DENIES client create on audit_logs (server Admin SDK only)', async () => {
      const clinician = testEnv.authenticatedContext('clin_1', {
        role: 'clinician',
        orgId: 'org_beacon',
      });
      await assertFails(
        clinician.firestore().collection('audit_logs').add({
          actor: 'clin_1',
          action: 'forged_log',
          orgId: 'org_beacon',
        })
      );

      const superAdmin = testEnv.authenticatedContext('adm_1', {
        role: 'super_admin',
        orgId: 'org_beacon',
      });
      await assertFails(
        superAdmin.firestore().collection('audit_logs').add({
          actor: 'adm_1',
          action: 'forged_log_from_admin',
          orgId: 'org_beacon',
        })
      );
    });

    it('allows org admin to read audit logs of their OWN org only', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('audit_logs').doc('log_beacon_1').set({
          actor: 'srv_system',
          action: 'phi_access',
          orgId: 'org_beacon',
        });
        await context.firestore().collection('audit_logs').doc('log_metro_1').set({
          actor: 'srv_system',
          action: 'phi_access',
          orgId: 'org_metro',
        });
      });

      const beaconAdmin = testEnv.authenticatedContext('mgr_beacon', {
        role: 'clinic_manager',
        orgId: 'org_beacon',
      });
      await assertSucceeds(beaconAdmin.firestore().collection('audit_logs').doc('log_beacon_1').get());
      await assertFails(beaconAdmin.firestore().collection('audit_logs').doc('log_metro_1').get());
    });

    it('denies update and delete on audit_logs to preserve immutability', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('audit_logs').doc('log_beacon_1').set({
          actor: 'srv_system',
          action: 'phi_access',
          orgId: 'org_beacon',
        });
      });

      const beaconAdmin = testEnv.authenticatedContext('mgr_beacon', {
        role: 'super_admin',
        orgId: 'org_beacon',
      });
      await assertFails(beaconAdmin.firestore().collection('audit_logs').doc('log_beacon_1').update({ action: 'tampered' }));
      await assertFails(beaconAdmin.firestore().collection('audit_logs').doc('log_beacon_1').delete());
    });
  });

  // 3. Matrix: calls collection (B.4)
  describe('Collection: /calls', () => {
    it('allows creating call when creator is assigned participant in same org', async () => {
      const clinician = testEnv.authenticatedContext('clin_1', {
        role: 'clinician',
        orgId: 'org_beacon',
      });
      await assertSucceeds(
        clinician.firestore().collection('calls').doc('call_001').set({
          clinicianId: 'clin_1',
          patientId: 'pat_1',
          orgId: 'org_beacon',
          createdAt: Date.now(),
        })
      );
    });

    it('denies creating call for unrelated non-participant third party', async () => {
      const eavesdropper = testEnv.authenticatedContext('eavesdropper', {
        role: 'clinician',
        orgId: 'org_beacon',
      });
      await assertFails(
        eavesdropper.firestore().collection('calls').doc('call_002').set({
          clinicianId: 'clin_1',
          patientId: 'pat_1',
          orgId: 'org_beacon',
        })
      );
    });

    it('denies changing clinicianId or patientId on call update', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('calls').doc('call_001').set({
          clinicianId: 'clin_1',
          patientId: 'pat_1',
          orgId: 'org_beacon',
          status: 'ringing',
        });
      });

      const clinician = testEnv.authenticatedContext('clin_1', {
        role: 'clinician',
        orgId: 'org_beacon',
      });

      // Attempt to tamper with assigned patientId or clinicianId
      await assertFails(
        clinician.firestore().collection('calls').doc('call_001').update({
          clinicianId: 'clin_imposter',
          patientId: 'pat_1',
          orgId: 'org_beacon',
        })
      );

      // Valid update preserving participants
      await assertSucceeds(
        clinician.firestore().collection('calls').doc('call_001').update({
          clinicianId: 'clin_1',
          patientId: 'pat_1',
          orgId: 'org_beacon',
          status: 'active',
        })
      );
    });
  });

  // 4. Matrix: emergency_overrides (Server-Only Creation)
  describe('Collection: /emergency_overrides', () => {
    it('DENIES clinical staff from creating break-glass records directly via client SDK', async () => {
      const clinician = testEnv.authenticatedContext('clin_emergency_1', {
        role: 'clinician',
        orgId: 'org_beacon',
      });
      await assertFails(
        clinician.firestore().collection('emergency_overrides').add({
          actorId: 'clin_emergency_1',
          orgId: 'org_beacon',
          patientId: 'pat_critical_9',
          reason: 'Severe acute suicidal crisis requiring immediate chart review',
          timestamp: Date.now(),
        })
      );
    });

    it('denies creating break-glass record with spoofed actorId or cross-org', async () => {
      const clinician = testEnv.authenticatedContext('clin_1', {
        role: 'clinician',
        orgId: 'org_beacon',
      });
      // Spoofed actorId
      await assertFails(
        clinician.firestore().collection('emergency_overrides').add({
          actorId: 'clin_another_doctor',
          orgId: 'org_beacon',
          reason: 'Unauthorized probe',
        })
      );
      // Cross-org
      await assertFails(
        clinician.firestore().collection('emergency_overrides').add({
          actorId: 'clin_1',
          orgId: 'org_other_hospital',
          reason: 'Unauthorized cross-tenant probe',
        })
      );
    });
  });

  // 5. Matrix: consent collection (C.2)
  describe('Collection: /consent', () => {
    it('allows patient to create their own telemetry consent record in same org', async () => {
      const patient = testEnv.authenticatedContext('pat_44', {
        role: 'patient',
        orgId: 'org_beacon',
      });
      await assertSucceeds(
        patient.firestore().collection('consent').doc('consent_pat_44').set({
          patientId: 'pat_44',
          orgId: 'org_beacon',
          scope: ['facial_kinematics', 'voice_prosody', 'ai_soap'],
          revoked: false,
          timestamp: Date.now(),
        })
      );
    });

    it('denies patient creating consent for another patient or in another org', async () => {
      const patient = testEnv.authenticatedContext('pat_44', {
        role: 'patient',
        orgId: 'org_beacon',
      });
      await assertFails(
        patient.firestore().collection('consent').doc('consent_pat_55').set({
          patientId: 'pat_55',
          orgId: 'org_beacon',
          scope: ['facial_kinematics'],
          revoked: false,
        })
      );
    });

    it('denies deleting consent records (must remain permanent audit record)', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('consent').doc('consent_pat_44').set({
          patientId: 'pat_44',
          orgId: 'org_beacon',
          scope: ['facial_kinematics'],
          revoked: false,
        });
      });

      const patient = testEnv.authenticatedContext('pat_44', {
        role: 'patient',
        orgId: 'org_beacon',
      });
      await assertFails(patient.firestore().collection('consent').doc('consent_pat_44').delete());
    });
  });

  // 6. Matrix: intakes collection (B.1)
  describe('Collection: /intakes', () => {
    it('allows patient to create intake for themselves in same org', async () => {
      const patient = testEnv.authenticatedContext('pat_99', {
        role: 'patient',
        orgId: 'org_beacon',
      });
      await assertSucceeds(
        patient.firestore().collection('intakes').doc('intake_99').set({
          patientId: 'pat_99',
          orgId: 'org_beacon',
          symptoms: 'Feeling persistently anxious',
        })
      );
    });

    it('denies patient creating intake for someone else', async () => {
      const patient = testEnv.authenticatedContext('pat_99', {
        role: 'patient',
        orgId: 'org_beacon',
      });
      await assertFails(
        patient.firestore().collection('intakes').doc('intake_100').set({
          patientId: 'pat_100',
          orgId: 'org_beacon',
          symptoms: 'Spoofed intake',
        })
      );
    });

    it('allows same-org clinical staff to read intake', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('intakes').doc('intake_99').set({
          patientId: 'pat_99',
          orgId: 'org_beacon',
          symptoms: 'Feeling persistently anxious',
        });
      });

      const clinician = testEnv.authenticatedContext('clin_1', {
        role: 'clinician',
        orgId: 'org_beacon',
      });
      await assertSucceeds(clinician.firestore().collection('intakes').doc('intake_99').get());
    });

    it('denies other-org clinical staff reading intake', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('intakes').doc('intake_99').set({
          patientId: 'pat_99',
          orgId: 'org_beacon',
          symptoms: 'Feeling persistently anxious',
        });
      });

      const clinicianOtherOrg = testEnv.authenticatedContext('clin_2', {
        role: 'clinician',
        orgId: 'org_other',
      });
      await assertFails(clinicianOtherOrg.firestore().collection('intakes').doc('intake_99').get());
    });
  });

  // 7. Matrix: sessions collection
  describe('Collection: /sessions', () => {
    it('allows clinician in same org to create clinical session', async () => {
      const clinician = testEnv.authenticatedContext('clin_1', {
        role: 'clinician',
        orgId: 'org_beacon',
      });
      await assertSucceeds(
        clinician.firestore().collection('sessions').doc('sess_001').set({
          clinicianId: 'clin_1',
          patientId: 'pat_1',
          orgId: 'org_beacon',
          status: 'in_progress',
        })
      );
    });

    it('denies cross-org clinician creating session for another org', async () => {
      const clinician = testEnv.authenticatedContext('clin_1', {
        role: 'clinician',
        orgId: 'org_beacon',
      });
      await assertFails(
        clinician.firestore().collection('sessions').doc('sess_002').set({
          clinicianId: 'clin_1',
          patientId: 'pat_1',
          orgId: 'org_other_hospital',
          status: 'in_progress',
        })
      );
    });
  });

  // 8. Matrix: organizations collection (Server-Only Subscription Protection)
  describe('Collection: /organizations (Subscription Server-Only)', () => {
    it('allows org admin to update non-subscription metadata', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('organizations').doc('org_beacon').set({
          orgId: 'org_beacon',
          name: 'Beacon Health Center',
          contactEmail: 'contact@beacon.com',
          subscription: { tier: 'starter', status: 'active', seats: 2 },
        });
      });

      const orgAdmin = testEnv.authenticatedContext('admin_beacon', {
        role: 'billing_admin',
        orgId: 'org_beacon',
      });

      await assertSucceeds(
        orgAdmin.firestore().collection('organizations').doc('org_beacon').update({
          name: 'Beacon Comprehensive Clinic',
        })
      );
    });

    it('DENIES org admin updating subscription fields (tier, status, seats, stripe ids)', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('organizations').doc('org_beacon').set({
          orgId: 'org_beacon',
          name: 'Beacon Health Center',
          tier: 'starter',
          status: 'active',
          seats: 2,
        });
      });

      const orgAdmin = testEnv.authenticatedContext('admin_beacon', {
        role: 'billing_admin',
        orgId: 'org_beacon',
      });

      // Attempt client self-upgrade to enterprise
      await assertFails(
        orgAdmin.firestore().collection('organizations').doc('org_beacon').update({
          tier: 'enterprise',
        })
      );

      // Attempt client seat expansion
      await assertFails(
        orgAdmin.firestore().collection('organizations').doc('org_beacon').update({
          seats: 500,
        })
      );
    });
  });

  // 9. Matrix: users collection (Client Role & OrgId Immutability)
  describe('Collection: /users (Role & OrgId Immutability)', () => {
    it('allows user to update their own non-sensitive profile field', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user_nurse_1').set({
          uid: 'user_nurse_1',
          role: 'nurse',
          orgId: 'org_beacon',
          displayName: 'Nurse Jackie',
        });
      });

      const user = testEnv.authenticatedContext('user_nurse_1', {
        role: 'nurse',
        orgId: 'org_beacon',
      });

      await assertSucceeds(
        user.firestore().collection('users').doc('user_nurse_1').update({
          displayName: 'Nurse Jacqueline RN',
        })
      );
    });

    it('DENIES user attempting privilege escalation by modifying their role', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user_patient_1').set({
          uid: 'user_patient_1',
          role: 'patient',
          orgId: 'org_beacon',
        });
      });

      const patient = testEnv.authenticatedContext('user_patient_1', {
        role: 'patient',
        orgId: 'org_beacon',
      });

      await assertFails(
        patient.firestore().collection('users').doc('user_patient_1').update({
          role: 'super_admin',
        })
      );
    });

    it('DENIES client direct creation of user documents with role', async () => {
      const patient = testEnv.authenticatedContext('user_new_rogue', {
        role: 'patient',
        orgId: 'org_beacon',
      });

      await assertFails(
        patient.firestore().collection('users').doc('user_new_rogue').set({
          uid: 'user_new_rogue',
          role: 'clinician',
          orgId: 'org_beacon',
        })
      );
    });
  });

  // 10. Matrix: emergency_overrides & Break-Glass Expiry
  describe('Collection: /emergency_overrides & Break-Glass Expiry', () => {
    it('DENIES client direct creation of emergency_overrides (must use server route)', async () => {
      const superAdmin = testEnv.authenticatedContext('sa_rogue', {
        role: 'super_admin',
        orgId: 'org_platform',
      });

      await assertFails(
        superAdmin.firestore().collection('emergency_overrides').doc('sa_rogue_pat_101').set({
          actorId: 'sa_rogue',
          patientId: 'pat_101',
          orgId: 'org_beacon',
          expiresAt: new Date(Date.now() + 3600000),
        })
      );
    });

    it('allows super_admin to read patient PHI when break-glass is ACTIVE (expiresAt in future)', async () => {
      // Seed patient in different org
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('patients').doc('pat_emergency_1').set({
          patientId: 'pat_emergency_1',
          orgId: 'org_beacon',
          name: 'Critical Patient',
        });

        // Seed ACTIVE break-glass override with expiresAt 1 hour in future
        await context.firestore().collection('emergency_overrides').doc('sa_verified_pat_emergency_1').set({
          overrideId: 'sa_verified_pat_emergency_1',
          actorId: 'sa_verified',
          patientId: 'pat_emergency_1',
          orgId: 'org_beacon',
          expiresAt: new Date(Date.now() + 3600000), // Future
        });
      });

      const superAdmin = testEnv.authenticatedContext('sa_verified', {
        role: 'super_admin',
        orgId: 'org_platform',
      });

      await assertSucceeds(
        superAdmin.firestore().collection('patients').doc('pat_emergency_1').get()
      );
    });

    it('DENIES super_admin reading patient PHI when break-glass is EXPIRED (expiresAt in past)', async () => {
      // Seed patient in different org
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('patients').doc('pat_expired_1').set({
          patientId: 'pat_expired_1',
          orgId: 'org_beacon',
          name: 'Historical Patient',
        });

        // Seed EXPIRED break-glass override with expiresAt in past
        await context.firestore().collection('emergency_overrides').doc('sa_expired_pat_expired_1').set({
          overrideId: 'sa_expired_pat_expired_1',
          actorId: 'sa_expired',
          patientId: 'pat_expired_1',
          orgId: 'org_beacon',
          expiresAt: new Date(Date.now() - 60000), // 1 minute in the PAST
        });
      });

      const superAdmin = testEnv.authenticatedContext('sa_expired', {
        role: 'super_admin',
        orgId: 'org_platform',
      });

      await assertFails(
        superAdmin.firestore().collection('patients').doc('pat_expired_1').get()
      );
    });
  });
});
