import { 
  collection, doc, getDoc, setDoc, updateDoc, 
  onSnapshot, query, where, orderBy, runTransaction 
} from "firebase/firestore";
import { db } from "./client";
import { PatientProfile, ClinicalIntake, SessionRecord } from "./schema";
import { DEMO_PATIENTS, DEMO_INTAKES } from "@/lib/demo/demo-data";
import { DEFAULT_DEMO_ORG_ID } from "@/lib/tenant/context";

/**
 * Standardized Synthetic Cohort
 * Quarantined for sales demonstration, UI layout verification, and offline fallback.
 */
export const BENCHMARK_PATIENTS: PatientProfile[] = DEMO_PATIENTS;
export const BENCHMARK_INTAKES: ClinicalIntake[] = DEMO_INTAKES;

class PatientService {
  private fallbackCache: Map<string, PatientProfile> = new Map();
  private queueCache: ClinicalIntake[] = [...DEMO_INTAKES];

  constructor() {
    DEMO_PATIENTS.forEach(p => this.fallbackCache.set(p.id, p));
  }

  /**
   * Fetch a single patient profile by ID with tenant validation and fallback
   */
  async getPatientById(patientId: string, orgId?: string): Promise<PatientProfile | null> {
    try {
      const docRef = doc(db, "patients", patientId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as PatientProfile;
        if (orgId && data.orgId && data.orgId !== orgId && data.orgId !== DEFAULT_DEMO_ORG_ID) {
          console.warn(`[PatientService] Cross-tenant access blocked for patient ${patientId} in org ${orgId}`);
          return null;
        }
        this.fallbackCache.set(patientId, data);
        return data;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`[PatientService] Firestore fetch fallback for ${patientId}:`, errorMsg);
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
   * Real-time subscription to the clinical triage queue, tenant-scoped by orgId
   */
  subscribeClinicalQueue(callback: (queue: ClinicalIntake[]) => void, orgId?: string): () => void {
    try {
      const targetOrg = orgId || DEFAULT_DEMO_ORG_ID;
      const q = query(
        collection(db, "intakes"),
        where("orgId", "==", targetOrg),
        orderBy("baselineSeverityScore", "desc")
      );
      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const intakes: ClinicalIntake[] = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<ClinicalIntake, 'id'>)
          }));
          this.queueCache = intakes;
          callback(intakes);
        } else {
          // Fallback to demo queue if collection is empty
          callback(this.queueCache.filter(item => !orgId || item.orgId === targetOrg || item.isDemo));
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`[PatientService] Claim transaction fallback:`, errorMsg);
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`[PatientService] Update status fallback:`, errorMsg);
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`[PatientService] Save session fallback:`, errorMsg);
    }
  }

  /**
   * Seed demo clinical cohort safely under the dedicated DEMO tenant
   */
  async seedDemoCohort(): Promise<{ success: boolean; seededPatients: number; seededIntakes: number }> {
    let patientCount = 0;
    let intakeCount = 0;

    for (const patient of DEMO_PATIENTS) {
      try {
        await setDoc(doc(db, "patients", patient.id), patient);
        patientCount++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.warn(`Failed to seed demo patient ${patient.id}:`, errorMsg);
      }
    }

    for (const intake of DEMO_INTAKES) {
      try {
        await setDoc(doc(db, "intakes", intake.id), intake);
        intakeCount++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.warn(`Failed to seed demo intake ${intake.id}:`, errorMsg);
      }
    }

    return { success: true, seededPatients: patientCount, seededIntakes: intakeCount };
  }
}

export const patientService = new PatientService();
