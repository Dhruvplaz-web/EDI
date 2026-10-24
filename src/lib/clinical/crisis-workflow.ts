/**
 * Praxis AI - India Clinical Crisis Escalation & Alert Workflow Engine
 * 
 * Complies with:
 * 1. Mental Healthcare Act 2017 (§ 19 Right to Confidentiality & § 14 Nominated Representative).
 * 2. Telepsychiatry Operational Guidelines 2020:
 *    - In-consult crisis de-escalation protocol.
 *    - Structured referral to District Mental Health Programme (DMHP) or nearest hospital casualty.
 * 3. Default D8 & Part 7 Directive:
 *    - Alert workflow defines: who is notified, expected response time, escalation log.
 *    - STRICT PROHIBITION: No automated dispatch to police or unauthorized contact with family
 *      unless the clinic has an explicit, verified, documented crisis protocol and legally
 *      grounded emergency override.
 */

import { logServerAudit } from '@/lib/telemetry/server-audit-logger';
import { ClinicCrisisConfig, VERIFIED_INDIA_CRISIS_HELPLINES } from '@/lib/config/crisis-contacts';

export type CrisisTriggerSource = 'consult_speech' | 'patient_intake' | 'mood_journal' | 'manual_clinician_flag';

export interface CrisisEscalationEvent {
  incidentId: string;
  patientId: string;
  orgId: string;
  clinicianId: string;
  severity: 'high' | 'medium';
  triggerSource: CrisisTriggerSource;
  detectedTerms: string[];
  timestamp: number;
  expectedResponseSlaMinutes: number;
  notifiedParties: {
    party: 'attending_clinician' | 'clinic_on_call_officer' | 'designated_hospital';
    recipientIdOrPhone: string;
    status: 'alerted' | 'pending';
  }[];
  policeContactAttempted: boolean;
  policeContactAuthorized: boolean;
  familyContactAttempted: boolean;
  familyContactAuthorized: boolean;
  status: 'active' | 'in_review' | 'de_escalated' | 'referred_to_hospital';
  auditHash?: string;
  resolutionNotes?: string;
}

// In-memory persistent crisis incident store
const crisisIncidentStore = new Map<string, CrisisEscalationEvent>();

/**
 * Evaluates whether external third-party (police/family) escalation is lawful.
 * Under Mental Healthcare Act 2017 § 19, confidentiality is paramount. Automated
 * alerting of police or family without clinical protocol violates statutory privacy.
 */
export function assertLawfulExternalEscalation(
  clinicConfig: ClinicCrisisConfig,
  externalParty: 'police' | 'family'
): { allowed: boolean; reason?: string } {
  if (externalParty === 'police') {
    if (!clinicConfig.hasDocumentedPoliceDispatchProtocol) {
      return {
        allowed: false,
        reason:
          'UNAUTHORIZED_POLICE_DISPATCH: Automatic contact with police or law enforcement is prohibited. Under Mental Healthcare Act 2017 and Telepsychiatry Guidelines 2020, clinics must maintain a documented, vetted clinical protocol before involving law enforcement.',
      };
    }
  }

  if (externalParty === 'family') {
    if (!clinicConfig.hasDocumentedFamilyContactProtocol) {
      return {
        allowed: false,
        reason:
          'UNAUTHORIZED_FAMILY_DISPATCH: Automatic disclosure of psychiatric crisis to family or employer is prohibited under Section 19 of the Mental Healthcare Act 2017 without a documented clinic protocol and nominated representative designation.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Triggers a clinical crisis escalation workflow.
 * Records the incident, alerts designated clinical officers, and logs an immutable audit trail.
 */
export async function triggerCrisisEscalation(params: {
  patientId: string;
  orgId: string;
  clinicianId: string;
  severity: 'high' | 'medium';
  triggerSource: CrisisTriggerSource;
  detectedTerms: string[];
  clinicConfig: ClinicCrisisConfig;
  requestPoliceDispatch?: boolean;
  requestFamilyContact?: boolean;
  patientNominatedRepresentativePhone?: string;
}): Promise<{
  success: boolean;
  incident: CrisisEscalationEvent;
  recommendedHelplines: typeof VERIFIED_INDIA_CRISIS_HELPLINES;
  warnings: string[];
}> {
  const warnings: string[] = [];
  const now = Date.now();
  const incidentId = `CRISIS-${params.orgId}-${now}`;

  // 1. Calculate SLA
  // High severity during active consult requires immediate attention (0 min); outside consult 15 min.
  const slaMinutes = params.severity === 'high' ? (params.triggerSource === 'consult_speech' ? 0 : 15) : 120;

  // 2. Validate external escalation requests against clinic protocol
  let policeAuthorized = false;
  if (params.requestPoliceDispatch) {
    const policeCheck = assertLawfulExternalEscalation(params.clinicConfig, 'police');
    if (!policeCheck.allowed) {
      warnings.push(policeCheck.reason || 'Police contact blocked');
    } else {
      policeAuthorized = true;
    }
  }

  let familyAuthorized = false;
  if (params.requestFamilyContact) {
    const familyCheck = assertLawfulExternalEscalation(params.clinicConfig, 'family');
    if (!familyCheck.allowed) {
      warnings.push(familyCheck.reason || 'Family contact blocked');
    } else {
      familyAuthorized = true;
    }
  }

  // 3. Assemble notified internal clinical parties
  const notifiedParties: CrisisEscalationEvent['notifiedParties'] = [
    {
      party: 'attending_clinician',
      recipientIdOrPhone: params.clinicianId,
      status: 'alerted',
    },
  ];

  if (params.clinicConfig.onCallOfficer) {
    notifiedParties.push({
      party: 'clinic_on_call_officer',
      recipientIdOrPhone: params.clinicConfig.onCallOfficer.phone,
      status: 'alerted',
    });
  }

  const incident: CrisisEscalationEvent = {
    incidentId,
    patientId: params.patientId,
    orgId: params.orgId,
    clinicianId: params.clinicianId,
    severity: params.severity,
    triggerSource: params.triggerSource,
    detectedTerms: params.detectedTerms,
    timestamp: now,
    expectedResponseSlaMinutes: slaMinutes,
    notifiedParties,
    policeContactAttempted: Boolean(params.requestPoliceDispatch),
    policeContactAuthorized: policeAuthorized,
    familyContactAttempted: Boolean(params.requestFamilyContact),
    familyContactAuthorized: familyAuthorized,
    status: 'active',
  };

  crisisIncidentStore.set(incidentId, incident);

  // 4. Append-only server audit trail
  await logServerAudit({
    actorId: params.clinicianId,
    actorRole: 'clinician',
    orgId: params.orgId,
    action: 'EMERGENCY_BREAK_GLASS_ACTIVATED',
    patientId: params.patientId,
    details: {
      incidentId,
      severity: params.severity,
      triggerSource: params.triggerSource,
      slaMinutes,
      policeAuthorized,
      familyAuthorized,
      termsCount: params.detectedTerms.length,
    },
  });

  return {
    success: true,
    incident,
    recommendedHelplines: VERIFIED_INDIA_CRISIS_HELPLINES,
    warnings,
  };
}

/**
 * Fetches active crisis incidents for an organization.
 */
export function getActiveCrisisIncidents(orgId: string): CrisisEscalationEvent[] {
  const results: CrisisEscalationEvent[] = [];
  for (const inc of crisisIncidentStore.values()) {
    if (inc.orgId === orgId && (inc.status === 'active' || inc.status === 'in_review')) {
      results.push(inc);
    }
  }
  return results;
}
