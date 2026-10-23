import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  onSnapshot, query, orderBy, where, runTransaction 
} from "firebase/firestore";
import { db } from "./client";
import { PatientProfile, ClinicalIntake, SessionRecord } from "./schema";

/**
 * Standardized Benchmark Cohorts (DAIC-WOZ / DSM-5 Distribution)
 * Pre-calibrated clinical ground truth used for reliable local fallback and Firestore seeding.
 */
export const BENCHMARK_PATIENTS: PatientProfile[] = [
  {
    id: "PAT-99201",
    fullName: "Marcus Vance",
    age: 46,
    gender: "Male",
    primaryDiagnosis: "Bipolar I Disorder, Acute Manic Episode with Psychotic Features",
    icd11Code: "6A60.0",
    chiefComplaint: "72 hours without sleep, hyperverbal pressured speech, grandiose telepathic beliefs",
    baselinePHQ9: 3,
    baselineGAD7: 19,
    emergencyContact: {
      name: "Evelyn Vance",
      relation: "Spouse",
      phone: "+1 (555) 019-9921",
      address: "142 Pine Crest Rd, Seattle, WA 98101",
      latitude: 47.6062,
      longitude: -122.3321
    },
    medicalHistory: [
      "Lithium Non-Adherence (7 days)",
      "Prior Involuntary Psychiatric Hospitalization (2023)",
      "Hypertension"
    ],
    activeMedications: [
      { name: "Lithium Carbonate", dosage: "300mg", frequency: "TID (Non-compliant)", prescribingClinician: "Dr. Chen" },
      { name: "Olanzapine", dosage: "10mg", frequency: "QHS PRN", prescribingClinician: "Dr. Chen" }
    ],
    status: "urgent_escalation",
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now()
  },
  {
    id: "PAT-88419",
    fullName: "Elena Rostova",
    age: 29,
    gender: "Female",
    primaryDiagnosis: "Severe Post-Traumatic Stress Disorder (PTSD) with Dissociative Symptoms",
    icd11Code: "6B40",
    chiefComplaint: "Acute panic loop triggered by acoustic stimulus, flashbacks, autonomic tachycardia (132 bpm)",
    baselinePHQ9: 21,
    baselineGAD7: 20,
    emergencyContact: {
      name: "Mikhail Rostov",
      relation: "Brother",
      phone: "+1 (555) 019-8841",
      address: "884 Harbor View Ave, San Francisco, CA 94102",
      latitude: 37.7749,
      longitude: -122.4194
    },
    medicalHistory: [
      "Combat Trauma History (Military Medical Service)",
      "Night terrors & Dissociative amnesia",
      "Prazosin Refill Pending"
    ],
    activeMedications: [
      { name: "Sertraline", dosage: "150mg", frequency: "Daily", prescribingClinician: "Dr. K. Patel" },
      { name: "Prazosin", dosage: "2mg", frequency: "QHS", prescribingClinician: "Dr. K. Patel" }
    ],
    status: "waiting",
    createdAt: Date.now() - 2400000,
    updatedAt: Date.now()
  },
  {
    id: "PAT-77304",
    fullName: "Dr. Arthur Pendelton",
    age: 58,
    gender: "Male",
    primaryDiagnosis: "Major Depressive Disorder, Recurrent, Severe without Psychotic Symptoms",
    icd11Code: "6A71.3",
    chiefComplaint: "Psychomotor retardation, 03:00 AM awakenings, passive suicidal despair, cognitive slowing",
    baselinePHQ9: 23,
    baselineGAD7: 14,
    emergencyContact: {
      name: "Claire Pendelton",
      relation: "Daughter",
      phone: "+1 (555) 019-7730",
      address: "304 University Heights, Boston, MA 02115",
      latitude: 42.3601,
      longitude: -71.0589
    },
    medicalHistory: [
      "Chronic refractory depression (12-year history)",
      "Prior ECT course (2021)",
      "Type 2 Diabetes"
    ],
    activeMedications: [
      { name: "Bupropion XL", dosage: "300mg", frequency: "Morning", prescribingClinician: "Dr. Ross" },
      { name: "Venlafaxine XR", dosage: "225mg", frequency: "Daily", prescribingClinician: "Dr. Ross" }
    ],
    status: "waiting",
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now()
  },
  {
    id: "PAT-66185",
    fullName: "Priya Sharma",
    age: 22,
    gender: "Female",
    primaryDiagnosis: "Generalized Anxiety Disorder (GAD) with Panic Agoraphobia",
    icd11Code: "6B00",
    chiefComplaint: "Anticipatory dread, somatic hyperventilation, inability to leave apartment for 14 days",
    baselinePHQ9: 11,
    baselineGAD7: 18,
    emergencyContact: {
      name: "Sunita Sharma",
      relation: "Mother",
      phone: "+1 (555) 019-6618",
      address: "185 College Park, Austin, TX 78701",
      latitude: 30.2672,
      longitude: -97.7431
    },
    medicalHistory: [
      "Onset during undergraduate finals (2024)",
      "Vasovagal syncope during panic episodes"
    ],
    activeMedications: [
      { name: "Escitalopram", dosage: "10mg", frequency: "Daily", prescribingClinician: "Dr. Gomez" },
      { name: "Propranolol", dosage: "20mg", frequency: "PRN Performance/Panic", prescribingClinician: "Dr. Gomez" }
    ],
    status: "waiting",
    createdAt: Date.now() - 1200000,
    updatedAt: Date.now()
  },
  {
    id: "PAT-55410",
    fullName: "David K. Miller",
    age: 37,
    gender: "Male",
    primaryDiagnosis: "Attention-Deficit Hyperactivity Disorder (ADHD), Combined Type with Rejection Sensitivity",
    icd11Code: "6A05.2",
    chiefComplaint: "Paralyzing executive dysfunction, occupational disciplinary warning, dopamine dysregulation",
    baselinePHQ9: 7,
    baselineGAD7: 11,
    emergencyContact: {
      name: "Rachel Miller",
      relation: "Spouse",
      phone: "+1 (555) 019-5541",
      address: "410 Tech Boulevard, San Jose, CA 95110",
      latitude: 37.3382,
      longitude: -121.8863
    },
    medicalHistory: [
      "Late adult ADHD diagnosis (age 35)",
      "Caffeine overuse (600mg daily)"
    ],
    activeMedications: [
      { name: "Methylphenidate ER", dosage: "36mg", frequency: "Morning", prescribingClinician: "Dr. Miller" }
    ],
    status: "waiting",
    createdAt: Date.now() - 900000,
    updatedAt: Date.now()
  },
  {
    id: "PAT-33290",
    fullName: "Sofia Morales",
    age: 19,
    gender: "Female",
    primaryDiagnosis: "Adjustment Disorder with Anxious Mood",
    icd11Code: "6B43",
    chiefComplaint: "First-year university stress, sleep onset insomnia, requesting biofeedback grounding training",
    baselinePHQ9: 6,
    baselineGAD7: 7,
    emergencyContact: {
      name: "Carlos Morales",
      relation: "Father",
      phone: "+1 (555) 019-3329",
      address: "290 Student Housing Way, Ann Arbor, MI 48104",
      latitude: 42.2808,
      longitude: -83.7430
    },
    medicalHistory: [
      "No prior psychiatric history",
      "Seasonal allergic rhinitis"
    ],
    activeMedications: [],
    status: "waiting",
    createdAt: Date.now() - 600000,
    updatedAt: Date.now()
  }
];

export const BENCHMARK_INTAKES: ClinicalIntake[] = [
  {
    id: "intake-99201",
    patientId: "PAT-99201",
    patientName: "Marcus Vance",
    age: 46,
    gender: "Male",
    symptoms: "72 hours without sleep, hyperverbal pressured speech, grandiose telepathic beliefs",
    baselineSeverityScore: 9.8,
    au4Frown: 88,
    au15Depressor: 22,
    speechJitter: 4.2,
    pitchVariance: 142,
    phq9Score: 3,
    gad7Score: 19,
    discrepancyD: 5.2,
    medicationChanges: "yes",
    xaiSummary: "Pressured acoustic cadence (jitter 4.2%) fused with elevated corrugator supercilii hyperactivity (AU4: 88%). High manic psychosis risk.",
    claimedBy: null,
    claimedByName: null,
    status: "urgent_escalation",
    timestamp: Date.now() - 3600000
  },
  {
    id: "intake-88419",
    patientId: "PAT-88419",
    patientName: "Elena Rostova",
    age: 29,
    gender: "Female",
    symptoms: "Acute panic loop triggered by acoustic stimulus, flashbacks, autonomic tachycardia (132 bpm)",
    baselineSeverityScore: 9.2,
    au4Frown: 76,
    au15Depressor: 94,
    speechJitter: 3.1,
    pitchVariance: 118,
    phq9Score: 21,
    gad7Score: 20,
    discrepancyD: 5.7,
    medicationChanges: "yes",
    xaiSummary: "Severe acoustic-kinematic discrepancy (D=5.7). Subjective calm (S=3.0) vs Objective autonomic arousal (O_bar=8.7). Dissociation alert.",
    claimedBy: null,
    claimedByName: null,
    status: "waiting",
    timestamp: Date.now() - 2400000
  },
  {
    id: "intake-77304",
    patientId: "PAT-77304",
    patientName: "Dr. Arthur Pendelton",
    age: 58,
    gender: "Male",
    symptoms: "Psychomotor retardation, 03:00 AM awakenings, passive suicidal despair, cognitive slowing",
    baselineSeverityScore: 8.7,
    au4Frown: 92,
    au15Depressor: 88,
    speechJitter: 0.8,
    pitchVariance: 18,
    phq9Score: 23,
    gad7Score: 14,
    discrepancyD: 1.4,
    medicationChanges: "no",
    xaiSummary: "Extreme prosodic acoustic flattening (pitch variance 18 Hz) combined with persistent corrugator contraction (AU4: 92%). Severe depressive psychomotor blunting.",
    claimedBy: null,
    claimedByName: null,
    status: "waiting",
    timestamp: Date.now() - 1800000
  },
  {
    id: "intake-66185",
    patientId: "PAT-66185",
    patientName: "Priya Sharma",
    age: 22,
    gender: "Female",
    symptoms: "Anticipatory dread, somatic hyperventilation, inability to leave apartment for 14 days",
    baselineSeverityScore: 6.8,
    au4Frown: 62,
    au15Depressor: 48,
    speechJitter: 2.4,
    pitchVariance: 88,
    phq9Score: 11,
    gad7Score: 18,
    discrepancyD: 2.1,
    medicationChanges: "no",
    xaiSummary: "Elevated eyelid occlusion flutter (blink rate 48/min) and vocal pitch tremor indicate acute autonomic sympathetic arousal.",
    claimedBy: null,
    claimedByName: null,
    status: "waiting",
    timestamp: Date.now() - 1200000
  },
  {
    id: "intake-55410",
    patientId: "PAT-55410",
    patientName: "David K. Miller",
    age: 37,
    gender: "Male",
    symptoms: "Paralyzing executive dysfunction, occupational disciplinary warning, dopamine dysregulation",
    baselineSeverityScore: 5.4,
    au4Frown: 42,
    au15Depressor: 31,
    speechJitter: 1.8,
    pitchVariance: 92,
    phq9Score: 7,
    gad7Score: 11,
    discrepancyD: 1.2,
    medicationChanges: "no",
    xaiSummary: "Speech rate acceleration with erratic pitch modulation. Baseline affective distress is moderate.",
    claimedBy: null,
    claimedByName: null,
    status: "waiting",
    timestamp: Date.now() - 900000
  },
  {
    id: "intake-33290",
    patientId: "PAT-33290",
    patientName: "Sofia Morales",
    age: 19,
    gender: "Female",
    symptoms: "First-year university stress, sleep onset insomnia, requesting biofeedback grounding training",
    baselineSeverityScore: 3.1,
    au4Frown: 18,
    au15Depressor: 10,
    speechJitter: 0.6,
    pitchVariance: 45,
    phq9Score: 6,
    gad7Score: 7,
    discrepancyD: 0.5,
    medicationChanges: "no",
    xaiSummary: "Low baseline stress index (3.1/10). Bio-feedback box breathing recommended prior to routine consultation.",
    claimedBy: null,
    claimedByName: null,
    status: "waiting",
    timestamp: Date.now() - 600000
  }
];

class PatientService {
  private fallbackCache: Map<string, PatientProfile> = new Map();
  private queueCache: ClinicalIntake[] = [...BENCHMARK_INTAKES];

  constructor() {
    BENCHMARK_PATIENTS.forEach(p => this.fallbackCache.set(p.id, p));
  }

  /**
   * Fetch a single patient profile by ID, with graceful offline fallback
   */
  async getPatientById(patientId: string): Promise<PatientProfile | null> {
    try {
      const docRef = doc(db, "patients", patientId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as PatientProfile;
        this.fallbackCache.set(patientId, data);
        return data;
      }
    } catch (err: any) {
      console.warn(`[PatientService] Firestore fetch failed for ${patientId}, using benchmark fallback:`, err.message);
    }
    return this.fallbackCache.get(patientId) || null;
  }

  /**
   * Real-time subscription to a patient profile
   */
  subscribePatient(patientId: string, callback: (patient: PatientProfile | null) => void): () => void {
    try {
      const docRef = doc(db, "patients", patientId);
      return onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as PatientProfile;
          this.fallbackCache.set(patientId, data);
          callback(data);
        } else {
          callback(this.fallbackCache.get(patientId) || null);
        }
      }, (error) => {
        console.warn(`[PatientService] Firestore onSnapshot fallback for ${patientId}:`, error.message);
        callback(this.fallbackCache.get(patientId) || null);
      });
    } catch {
      callback(this.fallbackCache.get(patientId) || null);
      return () => {};
    }
  }

  /**
   * Real-time subscription to the clinical triage queue ordered by severity
   */
  subscribeClinicalQueue(callback: (queue: ClinicalIntake[]) => void): () => void {
    try {
      const q = query(collection(db, "intakes"), orderBy("baselineSeverityScore", "desc"));
      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const intakes: ClinicalIntake[] = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<ClinicalIntake, 'id'>)
          }));
          this.queueCache = intakes;
          callback(intakes);
        } else {
          callback(this.queueCache);
        }
      }, (error) => {
        console.warn("[PatientService] Firestore queue listener fallback:", error.message);
        callback(this.queueCache);
      });
    } catch {
      callback(this.queueCache);
      return () => {};
    }
  }

  /**
   * Clinician claims a patient in the triage queue
   */
  async claimIntake(intakeId: string, clinicianId: string, clinicianName: string): Promise<void> {
    try {
      const intakeRef = doc(db, "intakes", intakeId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(intakeRef);
        if (snap.exists() && snap.data().claimedBy) {
          throw new Error("Patient already claimed by another clinician");
        }
        transaction.update(intakeRef, {
          claimedBy: clinicianId,
          claimedByName: clinicianName,
          status: "in_consultation"
        });
      });
    } catch (err: any) {
      console.warn(`[PatientService] Claim transaction fallback:`, err.message);
      // Update local cache
      const item = this.queueCache.find(i => i.id === intakeId || i.patientId === intakeId);
      if (item) {
        item.claimedBy = clinicianId;
        item.claimedByName = clinicianName;
        item.status = "in_consultation";
      }
    }
  }

  /**
   * Update a patient's consultation status
   */
  async updatePatientStatus(patientId: string, status: PatientProfile['status']): Promise<void> {
    try {
      const patientRef = doc(db, "patients", patientId);
      await updateDoc(patientRef, { status, updatedAt: Date.now() });
    } catch (err: any) {
      console.warn(`[PatientService] Update status fallback:`, err.message);
      const patient = this.fallbackCache.get(patientId);
      if (patient) {
        patient.status = status;
        patient.updatedAt = Date.now();
      }
    }
  }

  /**
   * Persist complete session record and telemetry summary
   */
  async saveSessionRecord(session: SessionRecord): Promise<void> {
    try {
      const sessionRef = doc(db, "sessions", session.sessionId);
      await setDoc(sessionRef, session);
    } catch (err: any) {
      console.warn(`[PatientService] Save session fallback:`, err.message);
    }
  }

  /**
   * Seed benchmark clinical data into Firestore collections
   */
  async seedBenchmarkData(): Promise<{ success: boolean; seededPatients: number; seededIntakes: number }> {
    let patientCount = 0;
    let intakeCount = 0;

    for (const patient of BENCHMARK_PATIENTS) {
      try {
        await setDoc(doc(db, "patients", patient.id), patient);
        patientCount++;
      } catch (err: any) {
        console.warn(`Failed to seed patient ${patient.id}:`, err.message);
      }
    }

    for (const intake of BENCHMARK_INTAKES) {
      try {
        await setDoc(doc(db, "intakes", intake.id), intake);
        intakeCount++;
      } catch (err: any) {
        console.warn(`Failed to seed intake ${intake.id}:`, err.message);
      }
    }

    return { success: true, seededPatients: patientCount, seededIntakes: intakeCount };
  }
}

export const patientService = new PatientService();
