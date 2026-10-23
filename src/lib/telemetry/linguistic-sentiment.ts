/**
 * Praxis AI - Clinical Linguistic Sentiment & Crisis NLP Analyzer
 * Evaluates spoken psychiatric dialogue for:
 * - DSM-5 Depressive Despair & Self-Harm Ideation
 * - Manic Pressured Speech & Grandiosity
 * - Somatic Panic & Acute Anxiety Triggers
 * - Speech Velocity (Words Per Minute) & Cognitive Hesitation
 * - Normalized Linguistic Severity Vector V_txt in [0.0, 1.0]
 */

export interface CrisisTokenMatch {
  phrase: string;
  category: 'suicide_risk' | 'depressive_despair' | 'panic_somatic' | 'manic_pressured';
  severityWeight: number; // 0.1 - 1.0
}

export interface LinguisticAnalysisResult {
  timestamp: number;
  text: string;
  wordCount: number;
  speechVelocityWpm: number;
  sentimentPolarity: number; // -1.0 (severe negative) to +1.0 (positive)
  linguisticSeverity: number; // 0.0 (healthy) to 1.0 (acute risk)
  clinicalRiskScore: number;  // 1.0 to 10.0 scale
  dominantCategory: 'neutral' | 'depressive_despair' | 'panic_somatic' | 'manic_pressured' | 'suicide_crisis';
  flaggedTokens: CrisisTokenMatch[];
  isCrisisAlert: boolean;
  clinicalExplanation: string;
}

// Clinically curated lexicons based on PHQ-9, GAD-7, and Columbia Suicide Severity Rating Scale (C-SSRS)
const CRISIS_LEXICON: Record<string, { category: CrisisTokenMatch['category']; weight: number }> = {
  // Suicidal Ideation & Severe Crisis (Weight 0.9 - 1.0)
  "end it all": { category: "suicide_risk", weight: 1.0 },
  "want to die": { category: "suicide_risk", weight: 1.0 },
  "better off dead": { category: "suicide_risk", weight: 1.0 },
  "kill myself": { category: "suicide_risk", weight: 1.0 },
  "no reason to live": { category: "suicide_risk", weight: 0.95 },
  "can't go on": { category: "suicide_risk", weight: 0.9 },
  "burden to everyone": { category: "suicide_risk", weight: 0.85 },
  "disappear forever": { category: "suicide_risk", weight: 0.85 },

  // Depressive Despair & Helplessness (Weight 0.5 - 0.8)
  "completely hopeless": { category: "depressive_despair", weight: 0.8 },
  "hopeless": { category: "depressive_despair", weight: 0.7 },
  "worthless": { category: "depressive_despair", weight: 0.75 },
  "empty inside": { category: "depressive_despair", weight: 0.7 },
  "nothing matters": { category: "depressive_despair", weight: 0.65 },
  "no energy": { category: "depressive_despair", weight: 0.5 },
  "can't get out of bed": { category: "depressive_despair", weight: 0.65 },
  "crying every day": { category: "depressive_despair", weight: 0.6 },
  "numb": { category: "depressive_despair", weight: 0.5 },

  // Panic, Somatic Alarm & Agoraphobia (Weight 0.5 - 0.85)
  "can't breathe": { category: "panic_somatic", weight: 0.8 },
  "having a heart attack": { category: "panic_somatic", weight: 0.85 },
  "terrified": { category: "panic_somatic", weight: 0.65 },
  "panic attack": { category: "panic_somatic", weight: 0.75 },
  "dread": { category: "panic_somatic", weight: 0.6 },
  "heart is pounding": { category: "panic_somatic", weight: 0.65 },
  "losing control": { category: "panic_somatic", weight: 0.75 },
  "choking": { category: "panic_somatic", weight: 0.6 },

  // Manic Acceleration & Psychosis (Weight 0.6 - 0.9)
  "thoughts are racing": { category: "manic_pressured", weight: 0.75 },
  "haven't slept for days": { category: "manic_pressured", weight: 0.8 },
  "no need to sleep": { category: "manic_pressured", weight: 0.75 },
  "special mission": { category: "manic_pressured", weight: 0.85 },
  "telepathic": { category: "manic_pressured", weight: 0.9 },
  "everyone is against me": { category: "manic_pressured", weight: 0.7 },
  "infinite energy": { category: "manic_pressured", weight: 0.7 }
};

const POSITIVE_LEXICON: string[] = [
  "better", "calm", "improving", "hopeful", "grateful", "sleeping well",
  "good", "stable", "relaxed", "fine", "optimistic", "relief", "helped"
];

export class ClinicalLinguisticAnalyzer {
  private utteranceHistory: Array<{ timestamp: number; wordCount: number }> = [];

  /**
   * Analyzes an utterance transcript
   */
  public analyzeUtterance(text: string, timestamp: number = Date.now()): LinguisticAnalysisResult {
    const cleaned = text.trim();
    if (!cleaned) {
      return this.emptyResult(timestamp);
    }

    const lower = cleaned.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Track speech rate
    this.utteranceHistory.push({ timestamp, wordCount });
    this.pruneHistory(timestamp);
    const wpm = this.calculateWpm();

    // Scan for crisis and clinical lexicon matches
    const flaggedTokens: CrisisTokenMatch[] = [];
    let maxSeverity = 0;
    let suicideDetected = false;
    let despairScore = 0;
    let panicScore = 0;
    let manicScore = 0;

    for (const [phrase, meta] of Object.entries(CRISIS_LEXICON)) {
      if (lower.includes(phrase)) {
        flaggedTokens.push({
          phrase,
          category: meta.category,
          severityWeight: meta.weight
        });

        if (meta.weight > maxSeverity) maxSeverity = meta.weight;
        if (meta.category === 'suicide_risk') suicideDetected = true;
        if (meta.category === 'depressive_despair') despairScore += meta.weight;
        if (meta.category === 'panic_somatic') panicScore += meta.weight;
        if (meta.category === 'manic_pressured') manicScore += meta.weight;
      }
    }

    // Count positive affirmations
    let positiveCount = 0;
    for (const pos of POSITIVE_LEXICON) {
      if (lower.includes(pos)) positiveCount++;
    }

    // Determine Sentiment Polarity [-1.0, 1.0]
    let polarity = 0.0;
    if (flaggedTokens.length > 0) {
      polarity = -Math.min(1.0, 0.3 * flaggedTokens.length + maxSeverity * 0.5);
    } else if (positiveCount > 0) {
      polarity = Math.min(1.0, 0.25 * positiveCount);
    }

    // Pressured speech velocity (> 180 wpm) adds to manic distress weight
    const isPressuredSpeech = wpm > 185;
    if (isPressuredSpeech) {
      manicScore += 0.4;
    }

    // Compute Linguistic Severity Vector V_txt in [0.0, 1.0]
    let severity = 0.1; // Baseline neutral conversation
    if (flaggedTokens.length > 0) {
      severity = Math.min(1.0, maxSeverity * 0.7 + (flaggedTokens.length * 0.15));
    } else if (positiveCount > 0) {
      severity = Math.max(0.05, 0.2 - positiveCount * 0.05);
    }

    if (suicideDetected) {
      severity = Math.max(severity, 0.9);
    }

    // Convert to 1.0 - 10.0 clinical scale
    const clinicalScore = parseFloat((1.0 + (9.0 * severity)).toFixed(1));

    // Determine dominant diagnostic category
    let dominantCategory: LinguisticAnalysisResult['dominantCategory'] = 'neutral';
    if (suicideDetected) dominantCategory = 'suicide_crisis';
    else if (despairScore >= panicScore && despairScore >= manicScore && despairScore > 0) dominantCategory = 'depressive_despair';
    else if (panicScore > despairScore && panicScore >= manicScore) dominantCategory = 'panic_somatic';
    else if (manicScore > 0) dominantCategory = 'manic_pressured';

    // Clinical Explanation Summary
    let explanation = "Normative conversational sentiment with no immediate crisis lexicon detected.";
    if (suicideDetected) {
      explanation = `CRITICAL ALERT: Explicit self-harm or suicidal despair ideation detected: "${flaggedTokens.map(t => t.phrase).join(', ')}".`;
    } else if (flaggedTokens.length > 0) {
      explanation = `Clinical keywords flagged in dialogue: ${flaggedTokens.map(t => `"${t.phrase}" (${t.category})`).join(', ')}.`;
    } else if (isPressuredSpeech) {
      explanation = `Pressured speech rate detected (${wpm} WPM), indicating psychomotor acceleration.`;
    }

    return {
      timestamp,
      text: cleaned,
      wordCount,
      speechVelocityWpm: wpm,
      sentimentPolarity: parseFloat(polarity.toFixed(2)),
      linguisticSeverity: parseFloat(severity.toFixed(2)),
      clinicalRiskScore: clinicalScore,
      dominantCategory,
      flaggedTokens,
      isCrisisAlert: suicideDetected || severity >= 0.8,
      clinicalExplanation: explanation
    };
  }

  private pruneHistory(currentTime: number) {
    const windowMs = 30000; // 30-second rolling window for WPM
    this.utteranceHistory = this.utteranceHistory.filter(h => currentTime - h.timestamp <= windowMs);
  }

  private calculateWpm(): number {
    if (this.utteranceHistory.length < 2) return 130; // Healthy adult conversational baseline
    const totalWords = this.utteranceHistory.reduce((sum, u) => sum + u.wordCount, 0);
    const durationMin = (this.utteranceHistory[this.utteranceHistory.length - 1].timestamp - this.utteranceHistory[0].timestamp) / 60000;
    if (durationMin <= 0.05) return 135;
    const calculated = Math.round(totalWords / durationMin);
    return Math.min(Math.max(calculated, 40), 280);
  }

  private emptyResult(timestamp: number): LinguisticAnalysisResult {
    return {
      timestamp,
      text: "",
      wordCount: 0,
      speechVelocityWpm: 130,
      sentimentPolarity: 0.0,
      linguisticSeverity: 0.1,
      clinicalRiskScore: 1.5,
      dominantCategory: "neutral",
      flaggedTokens: [],
      isCrisisAlert: false,
      clinicalExplanation: "Waiting for speech..."
    };
  }
}
