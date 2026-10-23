/**
 * Clinical Data Schema & Type Definitions for XAI-Triage (Praxis AI)
 * Standardized across Firestore collections: /patients, /intakes, /sessions, /telemetry
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

export interface PatientProfile {
  id: string; // e.g. PAT-99201
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
  createdAt: number;
  updatedAt: number;
}

export interface ClinicalIntake {
  id: string; // Document ID
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
  emergencyDetails?: {
    timestamp: number;
    reason: string;
    responderUnitDispatched?: string;
  };
}
