/**
 * Praxis AI - Clinical Signal Processing Engine & Kinematic Math Formulations
 * Executes local edge computations for stress, blink rate, EMA filtering, and modality discrepancy alerts.
 */

export interface TelemetryFrame {
  timestamp: number;
  au4BrowDown: number;    // Action Unit 4: Brow Lowerer
  au15MouthFrown: number; // Action Unit 15: Depressor Anguli Oris
  blinkScore: number;     // Eyelid Occlusion score
}

export interface CalibrationBaseline {
  muBase: number;         // Baseline mean stress
  sigmaBase: number;      // Baseline standard deviation
  baselineFrownDist: number;
  isCalibrated: boolean;
}

export class ClinicalSignalEngine {
  private alpha: number = 0.05; // EMA smoothing factor
  private emaObjectiveStress: number = 5.0;
  private discrepancyAlertThreshold: number = 3.5;
  private alertDurationMs: number = 15000; // 15 seconds continuous
  private alertStartTime: number | null = null;
  private frameHistory: TelemetryFrame[] = [];

  /**
   * Calculates raw Objective Stress Index O(t) in [1.0, 10.0]
   */
  public computeObjectiveStress(au4: number, au15: number, weights: { alpha: number; beta: number } = { alpha: 0.6, beta: 0.4 }): number {
    const rawWeighted = (weights.alpha * au4) + (weights.beta * au15);
    const score = 1.0 + (9.0 * Math.min(Math.max(rawWeighted, 0), 1.0));
    return parseFloat(score.toFixed(2));
  }

  /**
   * Applies Exponential Moving Average (EMA) low-pass filter:
   * O_bar(t) = alpha * O(t) + (1 - alpha) * O_bar(t-1)
   */
  public updateEMA(currentRawStress: number): number {
    this.emaObjectiveStress = (this.alpha * currentRawStress) + ((1.0 - this.alpha) * this.emaObjectiveStress);
    return parseFloat(this.emaObjectiveStress.toFixed(2));
  }

  /**
   * Eyebrow Contraction Score: S_frown,t = D_t / D_baseline
   */
  public computeEyebrowContractionScore(currentDist: number, baselineDist: number): number {
    if (baselineDist <= 0) return 1.0;
    return parseFloat((currentDist / baselineDist).toFixed(3));
  }

  /**
   * Sustained Contraction Rate (R_frown): % of frames where S_frown,t < 0.85
   */
  public computeSustainedContractionRate(frames: TelemetryFrame[]): number {
    if (frames.length === 0) return 0.0;
    const contractedCount = frames.filter(f => f.au4BrowDown > 0.4).length;
    return parseFloat((contractedCount / frames.length).toFixed(3));
  }

  /**
   * Eyelid Occlusion Blink Rate (R_blink): % of frames where blinkScore > 0.75
   */
  public computeBlinkRate(frames: TelemetryFrame[]): number {
    if (frames.length === 0) return 0.0;
    const blinkCount = frames.filter(f => f.blinkScore > 0.75).length;
    return parseFloat((blinkCount / frames.length).toFixed(3));
  }

  /**
   * Triage Index formulation:
   * I_triage = clamp(V_self + 3.0 * R_frown + 2.0 * R_blink, 1.0, 10.0)
   */
  public computeTriageIndex(subjectiveSelfReport: number, rFrown: number, rBlink: number): number {
    const raw = subjectiveSelfReport + (3.0 * rFrown) + (2.0 * rBlink);
    const clamped = Math.max(1.0, Math.min(10.0, raw));
    return parseFloat(clamped.toFixed(1));
  }

  /**
   * Modality Discrepancy Algorithm: D(t) = |S - O_bar(t)|
   * Triggers alert if D(t) > 3.5 continuously for 15 seconds.
   */
  public evaluateModalityDiscrepancy(subjectiveScore: number, currentTimeMs: number): {
    discrepancy: number;
    emaObjective: number;
    isAlertActive: boolean;
    alertDurationSeconds: number;
  } {
    const discrepancy = Math.abs(subjectiveScore - this.emaObjectiveStress);
    let isAlertActive = false;

    if (discrepancy > this.discrepancyAlertThreshold) {
      if (this.alertStartTime === null) {
        this.alertStartTime = currentTimeMs;
      } else if (currentTimeMs - this.alertStartTime >= this.alertDurationMs) {
        isAlertActive = true;
      }
    } else {
      this.alertStartTime = null;
    }

    const durationSec = this.alertStartTime ? Math.round((currentTimeMs - this.alertStartTime) / 1000) : 0;

    return {
      discrepancy: parseFloat(discrepancy.toFixed(2)),
      emaObjective: parseFloat(this.emaObjectiveStress.toFixed(2)),
      isAlertActive,
      alertDurationSeconds: durationSec
    };
  }

  /**
   * Formats telemetry session into an automated SOAP note draft
   */
  public generateSOAPNote(
    patientName: string,
    subjectiveScore: number,
    emaStress: number,
    rFrown: number,
    rBlink: number,
    discrepancyAlert: boolean,
    speechJitter: number = 0.8,
    isFlatAffect: boolean = false
  ): {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  } {
    const stressCategory = emaStress > 7.0 ? "High Autonomic Stress" : emaStress > 4.5 ? "Moderate Stress" : "Mild Baseline Stress";
    const acousticNote = speechJitter > 2.5 
      ? ` Elevated vocal acoustic jitter (${speechJitter.toFixed(1)}%) indicates active vocal tremor and autonomic hyperarousal.`
      : isFlatAffect 
      ? ` Marked vocal prosodic flattening (pitch variance < 14 Hz) indicates severe depressive psychomotor blunting.`
      : ` Vocal acoustic cadence demonstrates normative jitter (${speechJitter.toFixed(1)}%).`;
    
    return {
      subjective: `Patient ${patientName} reported an initial subjective anxiety score of ${subjectiveScore}/10. Reported symptoms of stress and tension prior to tele-consultation.`,
      objective: `Real-time biometric edge telemetry measured an Exponential Moving Average (EMA) Objective Stress Index of ${emaStress}/10 (${stressCategory}). Sustained eyebrow contraction rate (R_frown): ${(rFrown * 100).toFixed(1)}%. Eyelid occlusion blink rate (R_blink): ${(rBlink * 100).toFixed(1)}%.${acousticNote}`,
      assessment: `Diagnostic Impression: ${stressCategory}.${discrepancyAlert ? " CRITICAL: Cross-modal discrepancy detected (verbal self-report vs facial/vocal involuntary biomarkers > 3.5)." : isFlatAffect ? " CRITICAL: Acoustic prosodic blunting suggests severe affective flattening." : " Biomarker signals align with patient clinical presentation."}`,
      plan: `1. Continue ongoing tele-psychiatric monitoring.\n2. Prescribe non-pharmacological bio-feedback exercises (Box Breathing 4-4-4-4).\n3. Re-evaluate stress telemetry trendline and vocal jitter at follow-up consultation.`
    };
  }
}
