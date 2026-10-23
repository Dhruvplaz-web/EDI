import { CrossAttentionFusionEngine } from '../src/lib/telemetry/cross-attention-fusion.ts';

console.log("==================================================================");
console.log("   PRAXIS AI MULTIMODAL CROSS-ATTENTION FUSION TENSOR TEST");
console.log("==================================================================");

const engine = new CrossAttentionFusionEngine();

// Test 1: Normative Calm Baseline Case
console.log("\n[TEST 1] Testing Normative Calm Baseline Patient...");
const calmVis = { au4BrowDown: 0.05, au15MouthFrown: 0.08, blinkRate: 0.12, sustainedFrownRate: 0.02 };
const calmAud = { pitchHz: 160, jitterPercent: 0.8, shimmerPercent: 2.1, pitchVariance: 38, isFlatAffect: false, isVoiced: true };
const calmTxt = { linguisticSeverity: 0.1, sentimentPolarity: 0.6, speechVelocityWpm: 130, isCrisisAlert: false, flaggedTokenCount: 0 };

const res1 = engine.fuse(calmVis, calmAud, calmTxt, 2.5);
console.log(`  -> Fused Severity Score: ${res1.fusedSeverityScore} / 10`);
console.log(`  -> Attention Weights: Vis=${res1.attentionWeights.visual}, Aud=${res1.attentionWeights.acoustic}, Txt=${res1.attentionWeights.linguistic}`);
console.log(`  -> Sum of Weights: ${res1.attentionWeights.visual + res1.attentionWeights.acoustic + res1.attentionWeights.linguistic}`);

const sumWeights = res1.attentionWeights.visual + res1.attentionWeights.acoustic + res1.attentionWeights.linguistic;
if (Math.abs(sumWeights - 1.0) < 0.01 && res1.fusedSeverityScore < 3.5) {
  console.log("  ✓ PASSED: Attention weights sum to 1.0 and severity is normative (< 3.5).");
} else {
  console.error("  ✗ FAILED: Attention weights did not sum to 1.0 or score out of range.");
  process.exit(1);
}

// Test 2: Severe Masking Incongruence Case (Patient claims "I'm great", but Voice & Face are in severe distress)
console.log("\n[TEST 2] Testing Symptom Masking Incongruence Simulation...");
// Patient smiling/saying they are fine (subjective self-report = 2.0, linguistic severity = 0.1)
// BUT facial tension AU4 = 0.88, mouth depressor AU15 = 0.72
// AND vocal jitter = 4.2% (panic tremor), shimmer = 9.8%
const maskingVis = { au4BrowDown: 0.88, au15MouthFrown: 0.72, blinkRate: 0.45, sustainedFrownRate: 0.75 };
const maskingAud = { pitchHz: 210, jitterPercent: 4.2, shimmerPercent: 9.8, pitchVariance: 110, isFlatAffect: false, isVoiced: true };
const maskingTxt = { linguisticSeverity: 0.15, sentimentPolarity: 0.8, speechVelocityWpm: 185, isCrisisAlert: false, flaggedTokenCount: 0 };

// Simulate 12 seconds sustained to test masking alert trigger
const tStart = 1000000;
engine.fuse(maskingVis, maskingAud, maskingTxt, 2.0, tStart);
const resMasking = engine.fuse(maskingVis, maskingAud, maskingTxt, 2.0, tStart + 12000);

console.log(`  -> Patient Self-Report: 2.0 / 10`);
console.log(`  -> Involuntary Facial Score: ${resMasking.modalityScores.visualScore}/10`);
console.log(`  -> Involuntary Vocal Score: ${resMasking.modalityScores.acousticScore}/10`);
console.log(`  -> Incongruence Discrepancy D(t): ${resMasking.discrepancyD}`);
console.log(`  -> Masking Alert Active: ${resMasking.isMaskingAlertActive}`);
console.log(`  -> XAI Explanation: ${resMasking.xaiReasoning}`);

if (resMasking.discrepancyD >= 3.5 && resMasking.isMaskingAlertActive) {
  console.log("  ✓ PASSED: Cross-modal symptom masking accurately flagged (D >= 3.5 for > 10s).");
} else {
  console.error("  ✗ FAILED: Symptom masking failed to trigger alert.");
  process.exit(1);
}

// Test 3: Severe Depressive Psychomotor Blunting (Flat Affect)
console.log("\n[TEST 3] Testing Depressive Psychomotor Blunting (Flat Affect)...");
const flatVis = { au4BrowDown: 0.92, au15MouthFrown: 0.85, blinkRate: 0.08, sustainedFrownRate: 0.90 };
const flatAud = { pitchHz: 110, jitterPercent: 0.7, shimmerPercent: 2.0, pitchVariance: 10, isFlatAffect: true, isVoiced: true };
const flatTxt = { linguisticSeverity: 0.85, sentimentPolarity: -0.9, speechVelocityWpm: 68, isCrisisAlert: false, flaggedTokenCount: 3 };

const resFlat = engine.fuse(flatVis, flatAud, flatTxt, 8.5);
console.log(`  -> Fused Severity Score: ${resFlat.fusedSeverityScore} / 10`);
console.log(`  -> Dominant Modality: ${resFlat.dominantModality}`);
console.log(`  -> Attention Distribution: Vis=${Math.round(resFlat.attentionWeights.visual * 100)}%, Aud=${Math.round(resFlat.attentionWeights.acoustic * 100)}%, Txt=${Math.round(resFlat.attentionWeights.linguistic * 100)}%`);

if (resFlat.fusedSeverityScore >= 7.5) {
  console.log("  ✓ PASSED: Correctly identified acute psychiatric risk (Score >= 7.5).");
} else {
  console.error("  ✗ FAILED: Fused severity failed to capture severe depressive state.");
  process.exit(1);
}

console.log("\n==================================================================");
console.log("   ALL 3 MULTIMODAL CROSS-ATTENTION TESTS PASSED! ✓");
console.log("==================================================================\n");
