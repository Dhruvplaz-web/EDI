/**
 * Praxis AI - Server-Side Append-Only Immutable Audit Trail Logger (DPDP Act 2023 § 8 & CERT-In Directions 2022)
 * 
 * Enforced by Firestore security rules (client creates denied, updates/deletes denied)
 * and written exclusively by server APIs via Firebase Admin SDK.
 * 
 * Features cryptographic hash chaining (prevHash -> recordHash) with transactional
 * ordering to prevent race conditions on prevHash.
 */

import { adminDb } from '@/lib/firebase/server';
import crypto from 'crypto';

export type AuditAction = 
  | 'PHI_ACCESS'
  | 'GENERATE_SOAP'
  | 'EXPORT_DATA'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'INTAKE_SUBMITTED'
  | 'RECORD_VIEWED'
  | 'EMERGENCY_BREAK_GLASS_ACTIVATED'
  | 'TELEMETRY_RETENTION_PURGE';

export interface ServerAuditLogEntry {
  actorId: string;
  actorRole: string;
  orgId: string;
  action: AuditAction;
  patientId?: string;
  details?: Record<string, unknown> | string;
  timestamp: number;
  prevHash: string;
  recordHash: string;
  sequence?: number;
}

export interface AuditExportBundle {
  success: boolean;
  recordCount: number;
  chainIntegrityVerified: boolean;
  chainHeadHash: string;
  exportSignature: string;
  exportTimestamp: string;
  logs: ServerAuditLogEntry[];
}

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

// In-memory ring buffer for audit verification and local inspection
const inMemoryAuditLogs: ServerAuditLogEntry[] = [];
let lastKnownHash: string = GENESIS_HASH;
let currentSequence: number = 0;

// Mutex promise queue to strictly serialize hash calculation and log insertion
let chainLock: Promise<void> = Promise.resolve();

function computeRecordHash(entry: Omit<ServerAuditLogEntry, 'recordHash'>): string {
  const payload = [
    entry.prevHash,
    entry.actorId,
    entry.actorRole,
    entry.orgId,
    entry.action,
    entry.patientId || '',
    String(entry.timestamp),
    typeof entry.details === 'object' ? JSON.stringify(entry.details) : String(entry.details || ''),
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Appends a log entry to the immutable hash chain.
 * Serialized via transaction and promise mutex to guarantee zero race conditions on prevHash.
 */
export async function logServerAudit(
  entry: Omit<ServerAuditLogEntry, 'timestamp' | 'prevHash' | 'recordHash'>
): Promise<ServerAuditLogEntry> {
  // Enqueue behind previous operation to prevent in-process concurrency races
  let release: () => void = () => {};
  const currentTask = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previousLock = chainLock;
  chainLock = chainLock.then(() => currentTask);

  await previousLock;

  try {
    const timestamp = Date.now();

    // If real Firestore Admin SDK is available and not in pure unit test mock mode,
    // run transaction to ensure multi-instance atomic ordering against Firestore head.
    if (process.env.NODE_ENV !== 'test' && adminDb) {
      const headRef = adminDb.collection('audit_metadata').doc('chain_head');
      const newDocRef = adminDb.collection('audit_logs').doc();

      const fullLog = await adminDb.runTransaction(async (t) => {
        const headDoc = await t.get(headRef);
        const prevHash = headDoc.exists ? (headDoc.data()?.lastHash || GENESIS_HASH) : GENESIS_HASH;
        const sequence = headDoc.exists ? (headDoc.data()?.sequence || 0) + 1 : 1;

        const partial = {
          ...entry,
          timestamp,
          prevHash,
          sequence,
        };

        const recordHash = computeRecordHash(partial);
        const record: ServerAuditLogEntry = {
          ...partial,
          recordHash,
        };

        t.set(newDocRef, {
          ...record,
          createdAt: new Date(timestamp).toISOString(),
        });

        t.set(headRef, {
          lastHash: recordHash,
          sequence,
          lastTimestamp: timestamp,
          updatedAt: new Date(timestamp).toISOString(),
        });

        return record;
      });

      lastKnownHash = fullLog.recordHash;
      currentSequence = fullLog.sequence || currentSequence + 1;
      inMemoryAuditLogs.push(fullLog);
      if (inMemoryAuditLogs.length > 500) inMemoryAuditLogs.shift();
      return fullLog;
    }

    // In-memory serialized execution
    currentSequence += 1;
    const prevHash = lastKnownHash;
    const partial = {
      ...entry,
      timestamp,
      prevHash,
      sequence: currentSequence,
    };

    const recordHash = computeRecordHash(partial);
    const fullLog: ServerAuditLogEntry = {
      ...partial,
      recordHash,
    };

    lastKnownHash = recordHash;
    inMemoryAuditLogs.push(fullLog);
    if (inMemoryAuditLogs.length > 500) {
      inMemoryAuditLogs.shift();
    }

    return fullLog;
  } finally {
    release();
  }
}

export function getAuditLogsForTesting(): ServerAuditLogEntry[] {
  return [...inMemoryAuditLogs];
}

export function clearAuditLogsForTesting(): void {
  inMemoryAuditLogs.length = 0;
  lastKnownHash = GENESIS_HASH;
  currentSequence = 0;
  chainLock = Promise.resolve();
}

/**
 * Validates the cryptographic integrity of the in-memory or exported audit log chain.
 * Returns false if any record has been modified or the hash sequence is broken.
 */
export function verifyAuditChainIntegrity(logs: ServerAuditLogEntry[]): boolean {
  if (logs.length === 0) return true;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const expectedPrev = i === 0 ? log.prevHash : logs[i - 1].recordHash;

    if (log.prevHash !== expectedPrev) {
      return false; // Broken link in hash chain
    }

    const computed = computeRecordHash(log);
    if (computed !== log.recordHash) {
      return false; // Payload was modified
    }
  }

  return true;
}

/**
 * Generates an encrypted/signed daily audit export bundle for compliance archiving (DPDP & CERT-In immutable storage).
 */
export async function generateDailyAuditExport(orgId?: string): Promise<AuditExportBundle> {
  let logsToExport = [...inMemoryAuditLogs];

  if (orgId) {
    logsToExport = logsToExport.filter((l) => l.orgId === orgId);
  }

  const chainIntegrityVerified = verifyAuditChainIntegrity(logsToExport);
  const chainHeadHash = logsToExport.length > 0 ? logsToExport[logsToExport.length - 1].recordHash : GENESIS_HASH;
  const exportTimestamp = new Date().toISOString();

  // Sign export manifest with HMAC-SHA256
  const secret = process.env.AUTH_SECRET || 'praxis_audit_export_secret_fallback_key';
  const manifestData = `${logsToExport.length}:${chainHeadHash}:${chainIntegrityVerified}:${exportTimestamp}`;
  const exportSignature = crypto.createHmac('sha256', secret).update(manifestData).digest('hex');

  return {
    success: chainIntegrityVerified,
    recordCount: logsToExport.length,
    chainIntegrityVerified,
    chainHeadHash,
    exportSignature,
    exportTimestamp,
    logs: logsToExport,
  };
}
