/**
 * Clinical Data Schema & Type Definitions for Praxis AI (EDI)
 * Standardized across multi-tenant Firestore collections:
 * /organizations, /patients, /intakes, /sessions, /telemetry, /audit_logs
 */

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate?: string;
  prescribingClinician?: string;
}

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';

export interface Organization {
  id: string; // Tenant ID, e.g. "org_metro_psych_01"
  name: string;
  slug: string;
  tier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: SubscriptionStatus;
  seatCount: number; // Purchased clinician seats
  activeCliniciansCount: number;
  trialEndsAt?: number; // Unix epoch ms
  currentPeriodEnd?: number; // Unix epoch ms
  cancelAtPeriodEnd?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface OrganizationMember {
  uid: string;
  orgId: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'clinical_director' | 'clinician' | 'patient' | 'operations';
  active: boolean;
  invitedAt?: number;
  joinedAt: number;
}

export interface PatientProfile {
  id: string; // e.g. PAT-99201
  orgId: string; // Tenant Isolation
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Non-Binary' | 'Other';
  primaryDiagnosis: string;
  icd11Code: string;
  chiefComplaint: string;
  baselinePHQ9: number; // 0 - 27
  baselineGAD7: number; // 0 - 21
  emergencyContact: EmergencyContact;
  medicalHistory: string[];
  activeMedications: Medication[];
  status: 'waiting' | 'in_consultation' | 'completed' | 'urgent_escalation';
  assignedClinicianId?: string | null;
  assignedClinicianName?: string | null;
  isDemo?: boolean; // True for sales/training demo cohort, false for clinical PHI
  createdAt: number;
  updatedAt: number;
}

export interface ClinicalIntake {
  id: string; // Document ID
  orgId: string; // Tenant Isolation
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  symptoms: string;
  baselineSeverityScore: number; // 1.0 - 10.0
  au4Frown: number; // 0 - 100%
  au15Depressor: number; // 0 - 100%
  speechJitter: number; // % period perturbation
  pitchVariance: number; // Hz standard deviation
  phq9Score: number;
  gad7Score: number;
  discrepancyD: number;
  medicationChanges: 'yes' | 'no';
  xaiSummary: string;
  claimedBy: string | null;
  claimedByName: string | null;
  status: 'waiting' | 'in_consultation' | 'completed' | 'urgent_escalation';
  isDemo?: boolean;
  timestamp: number;
}

export interface TelemetrySummary {
  meanObjectiveStress: number;
  peakDiscrepancy: number;
  discrepancyAlertsTriggered: number;
  dominantModality: 'facial' | 'acoustic' | 'linguistic';
  sustainedFrownRate: number;
  blinkRate: number;
  meanVocalJitter: number;
  meanSpeechVelocityWpm?: number;
}

export interface SOAPNoteContent {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icd11DiagnosisCode?: string;
  signedByClinician?: string;
  signedAt?: number;
}

export interface SessionRecord {
  sessionId: string;
  orgId: string; // Tenant Isolation
  patientId: string;
  patientName: string;
  clinicianId: string;
  clinicianName: string;
  startTimestamp: number;
  endTimestamp?: number;
  durationSeconds?: number;
  telemetrySummary: TelemetrySummary;
  soapNote?: SOAPNoteContent;
  emergencyTriggered: boolean;
  isDemo?: boolean;
  emergencyDetails?: {
    timestamp: number;
    reason: string;
    responderUnitDispatched?: string;
  };
}

export interface WebRTCSignalingDoc {
  callId: string;
  orgId: string;
  clinicianId: string;
  patientId: string;
  offer?: {
    type: 'offer';
    sdp: string;
  };
  answer?: {
    type: 'answer';
    sdp: string;
  };
  status: 'waiting' | 'connected' | 'ended';
  createdAt: number;
}
