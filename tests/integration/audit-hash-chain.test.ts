import { describe, it, expect, beforeEach } from 'vitest';
import {
  logServerAudit,
  getAuditLogsForTesting,
  clearAuditLogsForTesting,
  verifyAuditChainIntegrity,
} from '@/lib/telemetry/server-audit-logger';

describe('Part H.3: Append-Only Audit Trail with Cryptographic Hash Chaining', () => {
  beforeEach(() => {
    clearAuditLogsForTesting();
  });

  it('generates a verified cryptographic hash chain across sequential audit records', async () => {
    const entry1 = await logServerAudit({
      actorId: 'clinician_1',
      actorRole: 'clinician',
      orgId: 'org_test',
      action: 'PHI_ACCESS',
      patientId: 'pat_1',
      details: { reason: 'Initial evaluation' },
    });

    const entry2 = await logServerAudit({
      actorId: 'clinician_1',
      actorRole: 'clinician',
      orgId: 'org_test',
      action: 'GENERATE_SOAP',
      patientId: 'pat_1',
      details: { riskLevel: 'MODERATE' },
    });

    const entry3 = await logServerAudit({
      actorId: 'admin_1',
      actorRole: 'clinic_manager',
      orgId: 'org_test',
      action: 'EXPORT_DATA',
      details: { recordsCount: 1 },
    });

    // Check chaining links
    expect(entry1.prevHash).toBe('0000000000000000000000000000000000000000000000000000000000000000');
    expect(entry2.prevHash).toBe(entry1.recordHash);
    expect(entry3.prevHash).toBe(entry2.recordHash);

    const logs = getAuditLogsForTesting();
    expect(logs.length).toBe(3);
    expect(verifyAuditChainIntegrity(logs)).toBe(true);
  });

  it('detects tampering: modifying any field in any historical log invalidates the hash chain', async () => {
    await logServerAudit({
      actorId: 'clinician_1',
      actorRole: 'clinician',
      orgId: 'org_test',
      action: 'PHI_ACCESS',
      patientId: 'pat_1',
    });

    await logServerAudit({
      actorId: 'clinician_1',
      actorRole: 'clinician',
      orgId: 'org_test',
      action: 'GENERATE_SOAP',
      patientId: 'pat_1',
    });

    const logs = getAuditLogsForTesting();
    expect(verifyAuditChainIntegrity(logs)).toBe(true);

    // Maliciously tamper with the first log entry
    logs[0].actorRole = 'super_admin'; // Tampered!

    expect(verifyAuditChainIntegrity(logs)).toBe(false);
  });
});
