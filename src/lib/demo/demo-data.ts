/**
 * Synthetic Demo Cohort & Simulation Fixtures for Praxis AI (EDI)
 * 
 * IMPORTANT COMPLIANCE NOTICE:
 * All patient profiles, intakes, and records defined in this file are entirely SYNTHETIC.
 * They represent simulated psychiatric test archetypes used for training, sales demonstrations,
 * and automated testing. They do NOT contain Protected Health Information (PHI) or real human records.
 * All demo records are marked with isDemo: true and quarantined under DEFAULT_DEMO_ORG_ID.
 */

import { PatientProfile, ClinicalIntake } from "@/lib/firebase/schema";
import { DEFAULT_DEMO_ORG_ID } from "@/lib/tenant/context";

export const DEMO_PATIENTS: PatientProfile[] = [
  {
    id: "DEMO-PAT-99201",
    orgId: DEFAULT_DEMO_ORG_ID,
    fullName: "Marcus Vance (Synthetic Persona)",
    age: 46,
    gender: "Male",
    primaryDiagnosis: "Bipolar I Disorder, Acute Manic Episode (Simulated)",
    icd11Code: "6A60.0",
    chiefComplaint: "Simulated manic presentation: pressured speech, elevated psychomotor arousal",
    baselinePHQ9: 3,
    baselineGAD7: 19,
    emergencyContact: {
      name: "Evelyn Vance (Mock Contact)",
      relation: "Spouse",
      phone: "+1 (555) 019-9921",
      address: "142 Simulation Way, Seattle, WA 98101",
      latitude: 47.6062,
      longitude: -122.3321
    },
    medicalHistory: [
      "Simulated Lithium non-adherence scenario",
      "Prior psychiatric hospitalization in synthetic scenario",
      "Hypertension"
    ],
    activeMedications: [
      { name: "Lithium Carbonate", dosage: "300mg", frequency: "TID", prescribingClinician: "Dr. Chen (Simulated)" },
      { name: "Olanzapine", dosage: "10mg", frequency: "QHS PRN", prescribingClinician: "Dr. Chen (Simulated)" }
    ],
    status: "urgent_escalation",
    isDemo: true,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now()
  },
  {
    id: "DEMO-PAT-88419",
    orgId: DEFAULT_DEMO_ORG_ID,
    fullName: "Elena Rostova (Synthetic Persona)",
    age: 29,
    gender: "Female",
    primaryDiagnosis: "Post-Traumatic Stress Disorder with Dissociative Symptoms (Simulated)",
    icd11Code: "6B40",
    chiefComplaint: "Simulated panic cycle triggered by acoustic stimulus; autonomic tremor",
    baselinePHQ9: 21,
    baselineGAD7: 20,
    emergencyContact: {
      name: "Mikhail Rostov (Mock Contact)",
      relation: "Brother",
      phone: "+1 (555) 019-8841",
      address: "884 Harbor View Ave, San Francisco, CA 94102",
      latitude: 37.7749,
      longitude: -122.4194
    },
    medicalHistory: [
      "Simulated combat trauma archetype",
      "Night terrors scenario",
      "Prazosin titration scenario"
    ],
    activeMedications: [
      { name: "Sertraline", dosage: "150mg", frequency: "Daily", prescribingClinician: "Dr. K. Patel (Simulated)" },
      { name: "Prazosin", dosage: "2mg", frequency: "QHS", prescribingClinician: "Dr. K. Patel (Simulated)" }
    ],
    status: "waiting",
    isDemo: true,
    createdAt: Date.now() - 2400000,
    updatedAt: Date.now()
  },
  {
    id: "DEMO-PAT-77304",
    orgId: DEFAULT_DEMO_ORG_ID,
    fullName: "Dr. Arthur Pendelton (Synthetic Persona)",
    age: 58,
    gender: "Male",
    primaryDiagnosis: "Major Depressive Disorder, Severe (Simulated)",
    icd11Code: "6A71.3",
    chiefComplaint: "Psychomotor retardation, blunted facial affect (AU4/AU15), vocal pitch flattening",
    baselinePHQ9: 23,
    baselineGAD7: 14,
    emergencyContact: {
      name: "Claire Pendelton (Mock Contact)",
      relation: "Daughter",
      phone: "+1 (555) 019-7730",
      address: "304 University Heights, Boston, MA 02115",
      latitude: 42.3601,
      longitude: -71.0589
    },
    medicalHistory: [
      "Refractory depression scenario",
      "Prior ECT course in simulation",
      "Type 2 Diabetes"
    ],
    activeMedications: [
      { name: "Bupropion XL", dosage: "300mg", frequency: "Morning", prescribingClinician: "Dr. Ross (Simulated)" },
      { name: "Venlafaxine XR", dosage: "225mg", frequency: "Daily", prescribingClinician: "Dr. Ross (Simulated)" }
    ],
    status: "in_consultation",
    isDemo: true,
    createdAt: Date.now() - 1200000,
    updatedAt: Date.now()
  }
];

export const DEMO_INTAKES: ClinicalIntake[] = [
  {
    id: "DEMO-INTAKE-01",
    orgId: DEFAULT_DEMO_ORG_ID,
    patientId: "DEMO-PAT-99201",
    patientName: "Marcus Vance (Synthetic Persona)",
    age: 46,
    gender: "Male",
    symptoms: "Extreme psychomotor agitation, pressured speech velocity (>195 WPM), rapid topic switching.",
    baselineSeverityScore: 9.2,
    au4Frown: 22,
    au15Depressor: 15,
    speechJitter: 3.8,
    pitchVariance: 48.2,
    phq9Score: 3,
    gad7Score: 19,
    discrepancyD: 4.8,
    medicationChanges: "yes",
    xaiSummary: "Extreme speech velocity and jitter elevation indicate acute hypomanic/manic state; self-report PHQ-9 severely underreports distress.",
    claimedBy: null,
    claimedByName: null,
    status: "urgent_escalation",
    isDemo: true,
    timestamp: Date.now() - 1800000
  },
  {
    id: "DEMO-INTAKE-02",
    orgId: DEFAULT_DEMO_ORG_ID,
    patientId: "DEMO-PAT-88419",
    patientName: "Elena Rostova (Synthetic Persona)",
    age: 29,
    gender: "Female",
    symptoms: "Acoustic startle response, micro-frown leakage (AU4 68%), vocal tremor under questioning.",
    baselineSeverityScore: 8.4,
    au4Frown: 68,
    au15Depressor: 74,
    speechJitter: 2.9,
    pitchVariance: 14.2,
    phq9Score: 21,
    gad7Score: 20,
    discrepancyD: 3.9,
    medicationChanges: "no",
    xaiSummary: "Multimodal tension indices corroborate severe autonomic arousal and high self-reported PTSD symptoms.",
    claimedBy: null,
    claimedByName: null,
    status: "waiting",
    isDemo: true,
    timestamp: Date.now() - 900000
  }
];
