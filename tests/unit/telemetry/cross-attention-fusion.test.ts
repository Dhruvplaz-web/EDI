import { describe, it, expect, beforeEach } from 'vitest';
import { CrossAttentionFusionEngine } from '@/lib/telemetry/cross-attention-fusion';

describe('CrossAttentionFusionEngine (Multimodal Attention & Discrepancy Index)', () => {
  let engine: CrossAttentionFusionEngine;

  beforeEach(() => {
    engine = new CrossAttentionFusionEngine();
  });

  it('computes composite objective stress index between 1.0 and 10.0', () => {
    const result = engine.fuse(
      { au4BrowDown: 0.2, au15MouthFrown: 0.15, blinkRate: 0.14, sustainedFrownRate: 0.1 },
      { pitchHz: 130, jitterPercent: 0.8, shimmerPercent: 2.1, pitchVariance: 35, isFlatAffect: false, isVoiced: true },
      { linguisticSeverity: 2.0, sentimentPolarity: 0.2, speechVelocityWpm: 135, isCrisisAlert: false, flaggedTokenCount: 0 },
      2.5
    );

    expect(result.fusedSeverityScore).toBeGreaterThanOrEqual(1.0);
    expect(result.fusedSeverityScore).toBeLessThanOrEqual(10.0);
    expect(result.attentionWeights.visual).toBeGreaterThan(0);
    expect(result.attentionWeights.acoustic).toBeGreaterThan(0);
    expect(result.attentionWeights.linguistic).toBeGreaterThan(0);

    const sumWeights = result.attentionWeights.visual + result.attentionWeights.acoustic + result.attentionWeights.linguistic;
    expect(sumWeights).toBeCloseTo(1.0, 2);
  });

  it('evaluates discrepancy boundary threshold: D(t) < 3.5 does NOT trigger masking alert', () => {
    const result = engine.fuse(
      { au4BrowDown: 0.45, au15MouthFrown: 0.40, blinkRate: 0.15, sustainedFrownRate: 0.2 },
      { pitchHz: 140, jitterPercent: 1.5, shimmerPercent: 3.5, pitchVariance: 30, isFlatAffect: false, isVoiced: true },
      { linguisticSeverity: 5.0, sentimentPolarity: 0.0, speechVelocityWpm: 120, isCrisisAlert: false, flaggedTokenCount: 0 },
      5.0
    );

    expect(result.discrepancyD).toBeLessThan(3.5);
    expect(result.isMaskingAlertActive).toBe(false);
  });

  it('triggers symptom masking alert when high objective distress contrasts with low self-report for >10 seconds', () => {
    const highStressVisual = { au4BrowDown: 0.90, au15MouthFrown: 0.95, blinkRate: 0.35, sustainedFrownRate: 0.8 };
    const highStressAudio = { pitchHz: 195, jitterPercent: 4.8, shimmerPercent: 11.2, pitchVariance: 10, isFlatAffect: true, isVoiced: true };
    const linguisticClaims = { linguisticSeverity: 1.0, sentimentPolarity: 0.8, speechVelocityWpm: 80, isCrisisAlert: false, flaggedTokenCount: 0 };
    const verbalSelfReport = 1.0;

    const t0 = 1000000;
    // Initial high-discrepancy frame (starts sustain counter)
    const firstFrame = engine.fuse(highStressVisual, highStressAudio, linguisticClaims, verbalSelfReport, t0);
    expect(firstFrame.discrepancyD).toBeGreaterThan(3.5);

    // After 12 seconds of sustained high discrepancy (exceeds 10-second threshold)
    const sustainedResult = engine.fuse(highStressVisual, highStressAudio, linguisticClaims, verbalSelfReport, t0 + 12000);

    expect(sustainedResult.discrepancyD).toBeGreaterThan(3.5);
    expect(sustainedResult.isMaskingAlertActive).toBe(true);
    expect(sustainedResult.xaiReasoning).toContain('CRITICAL SYMPTOM MASKING');
  });

  it('accurately identifies dominant modality when vocal acoustic tremor is highest', () => {
    const result = engine.fuse(
      { au4BrowDown: 0.1, au15MouthFrown: 0.1, blinkRate: 0.1, sustainedFrownRate: 0.05 },
      { pitchHz: 210, jitterPercent: 6.2, shimmerPercent: 14.5, pitchVariance: 8, isFlatAffect: true, isVoiced: true },
      { linguisticSeverity: 2.0, sentimentPolarity: 0.0, speechVelocityWpm: 120, isCrisisAlert: false, flaggedTokenCount: 0 },
      2.0
    );

    expect(result.dominantModality).toBe('acoustic');
  });
});
