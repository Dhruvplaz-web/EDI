import { describe, it, expect, beforeEach } from 'vitest';
import {
  logServerAudit,
  getAuditLogsForTesting,
  clearAuditLogsForTesting,
  verifyAuditChainIntegrity,
  generateDailyAuditExport,
} from '@/lib/telemetry/server-audit-logger';

describe('Audit Hash Chain: Transactional Race Prevention & Daily Export', () => {
  beforeEach(() => {
    clearAuditLogsForTesting();
  });

  it('prevents races on prevHash under high concurrent write load (transactional ordering)', async () => {
    const concurrentWrites = 25;
    
    // Fire 25 concurrent audit logs simultaneously
    const promises = Array.from({ length: concurrentWrites }, (_, i) =>
      logServerAudit({
        actorId: `user_worker_${i}`,
        actorRole: 'clinician',
        orgId: 'org_praxis_demo',
        action: 'PHI_ACCESS',
        patientId: `patient_${i}`,
        details: { operation: 'read_vitals', index: i },
      })
    );

    const results = await Promise.all(promises);
    expect(results).toHaveLength(concurrentWrites);

    const logs = getAuditLogsForTesting();
    expect(logs).toHaveLength(concurrentWrites);

    // Collect all prevHashes to ensure NO duplicates (which would indicate a race condition / fork)
    const prevHashes = logs.map(l => l.prevHash);
    const uniquePrevHashes = new Set(prevHashes);
    expect(uniquePrevHashes.size).toBe(concurrentWrites);

    // Verify sequential integrity of the full chain
    const isValidChain = verifyAuditChainIntegrity(logs);
    expect(isValidChain).toBe(true);

    // Each log recordHash must equal the next log prevHash
    for (let i = 0; i < logs.length - 1; i++) {
      expect(logs[i + 1].prevHash).toBe(logs[i].recordHash);
    }
  });

  it('detects tampering when any payload field or hash is modified', async () => {
    await logServerAudit({
      actorId: 'dr_alice',
      actorRole: 'clinician',
      orgId: 'org_praxis_demo',
      action: 'RECORD_VIEWED',
      patientId: 'patient_101',
    });

    await logServerAudit({
      actorId: 'dr_bob',
      actorRole: 'clinician',
      orgId: 'org_praxis_demo',
      action: 'GENERATE_SOAP',
      patientId: 'patient_102',
    });

    const logs = getAuditLogsForTesting();
    expect(verifyAuditChainIntegrity(logs)).toBe(true);

    // Deliberately tamper with one log
    const tamperedLogs = JSON.parse(JSON.stringify(logs));
    tamperedLogs[0].patientId = 'patient_attacker_injected';

    expect(verifyAuditChainIntegrity(tamperedLogs)).toBe(false);
  });

  it('generates a signed daily audit export bundle with verifiable hash chain manifest', async () => {
    for (let i = 0; i < 5; i++) {
      await logServerAudit({
        actorId: `dr_${i}`,
        actorRole: 'clinician',
        orgId: 'org_praxis_demo',
        action: 'PHI_ACCESS',
        patientId: `patient_${i}`,
      });
    }

    const exportBundle = await generateDailyAuditExport('org_praxis_demo');

    expect(exportBundle.success).toBe(true);
    expect(exportBundle.recordCount).toBe(5);
    expect(exportBundle.chainIntegrityVerified).toBe(true);
    expect(exportBundle.chainHeadHash).toBeTruthy();
    expect(exportBundle.exportSignature).toBeTruthy();
    expect(exportBundle.logs).toHaveLength(5);
  });
});
