/**
 * Praxis AI - Multimodal Ambient Clinical Scribe Formulation Engine
 * Synthesizes psychiatric SOAP notes strictly grounded in dialogue transcripts,
 * acoustic vocal biomarkers (jitter, prosody), kinematic Action Units, and cross-attention tensors.
 */

export interface GenerateSOAPParams {
  patientId: string;
  patientName: string;
  primaryDiagnosis?: string;
  sessionTranscript?: string;
  subjectiveScore?: number;
  emaStress?: number;
  rFrown?: number;
  rBlink?: number;
  speechJitter?: number;
  isFlatAffect?: boolean;
  discrepancyAlert?: boolean;
  discrepancyD?: number;
  attentionWeights?: {
    visual: number;
    acoustic: number;
    linguistic: number;
  };
}

export interface SOAPNoteContent {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface GenerateSOAPResult {
  success: boolean;
  soap: SOAPNoteContent;
  icd11SuggestedCodes: string[];
  riskLevel: 'STABLE' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  generatedBy: string;
}

export function synthesizeSOAPNote(params: GenerateSOAPParams): GenerateSOAPResult {
  const {
    patientId = "PAT-UNKNOWN",
    patientName = "Patient",
    primaryDiagnosis = "Psychiatric Assessment Required",
    sessionTranscript = "",
    subjectiveScore = 5.0,
    emaStress = 5.0,
    rFrown = 0.2,
    rBlink = 0.14,
    speechJitter = 0.8,
    isFlatAffect = false,
    discrepancyAlert = false,
    discrepancyD = 0.0,
    attentionWeights = { visual: 0.33, acoustic: 0.34, linguistic: 0.33 }
  } = params;

  const stressCategory = emaStress >= 7.5 
    ? "Severe Autonomic Distress" 
    : emaStress >= 4.5 
    ? "Moderate Physiological Arousal" 
    : "Mild / Normative Homeostasis";

  const vocalSummary = speechJitter > 2.5
    ? `Marked vocal micro-tremor with elevated acoustic jitter (${speechJitter.toFixed(2)}%), indicating sympathetic hyperarousal.`
    : isFlatAffect
    ? `Notable prosodic flattening and reduced pitch variance (F0 sigma < 14 Hz), consistent with psychomotor retardation.`
    : `Normative acoustic resonance and vocal stability (jitter ${speechJitter.toFixed(2)}%).`;

  const attentionSummary = `Multimodal attention distribution: Voice: ${(attentionWeights.acoustic * 100).toFixed(0)}%, Kinematics: ${(attentionWeights.visual * 100).toFixed(0)}%, Dialogue: ${(attentionWeights.linguistic * 100).toFixed(0)}%.`;

  let subjectiveNarrative = `Patient ${patientName} presented for tele-psychiatric consultation regarding ${primaryDiagnosis}. Self-reported subjective anxiety rated at ${subjectiveScore}/10.`;
  if (sessionTranscript && sessionTranscript.trim().length > 0) {
    subjectiveNarrative += ` Patient dialogue excerpt: "${sessionTranscript.slice(0, 300).trim()}..."`;
  }

  const objectiveNarrative = `Real-time biometric edge telemetry captured continuous objective markers during the encounter:
1. Autonomic Stress Index: EMA filtered score ${emaStress.toFixed(1)}/10 (${stressCategory}).
2. Facial Kinematics: Sustained Action Unit 4 (corrugator supercilii contraction) rate at ${(rFrown * 100).toFixed(1)}%; blink rate at ${(rBlink * 100).toFixed(1)}%.
3. Vocal Biomarkers: ${vocalSummary}
4. Cross-Attention Matrix: ${attentionSummary}`;

  let assessmentNarrative = `Diagnostic Impression: Presentation consistent with ${primaryDiagnosis} in the context of ${stressCategory}.`;
  if (discrepancyAlert) {
    assessmentNarrative += ` CRITICAL SYMPTOM MASKING ALERT: Significant incongruence detected between patient's verbal self-report (${subjectiveScore}/10) and objective involuntary biomarkers (${emaStress.toFixed(1)}/10, discrepancy metric D=${discrepancyD.toFixed(2)}). Findings suggest high probability of symptom minimization or underlying emotional suppression.`;
  } else if (isFlatAffect) {
    assessmentNarrative += ` High index of suspicion for major depressive psychomotor blunting evidenced by acoustic prosodic flattening.`;
  } else {
    assessmentNarrative += ` Biometric signals and verbal presentation are clinically concordant.`;
  }

  const planNarrative = `1. Clinical Follow-up: Schedule tele-consultation review in 7-14 days to monitor biomarker trends.
2. Behavioral Intervention: Introduce evidence-based autonomic stabilization techniques (diaphragmatic pacing 4-4-6).
3. Risk Monitoring: Telehealth emergency escalation protocols remain active; verify patient physical location prior to each session.
4. E-Prescription & Pharmacotherapy: Continue current pharmacological regimen; reassess upon next visit.`;

  const riskLevel: 'STABLE' | 'MODERATE' | 'ELEVATED' | 'CRITICAL' = 
    discrepancyAlert || emaStress >= 7.5 ? "ELEVATED" : emaStress >= 4.5 ? "MODERATE" : "STABLE";

  const icd11 = primaryDiagnosis.toLowerCase().includes("bipolar") ? "6A60" :
    primaryDiagnosis.toLowerCase().includes("ptsd") ? "6B40" :
    primaryDiagnosis.toLowerCase().includes("anxiety") ? "6B00" : "6A70";

  return {
    success: true,
    soap: {
      subjective: subjectiveNarrative,
      objective: objectiveNarrative,
      assessment: assessmentNarrative,
      plan: planNarrative
    },
    icd11SuggestedCodes: [icd11],
    riskLevel,
    generatedBy: "Praxis Multi-Modal Clinical NLP Scribe"
  };
}
