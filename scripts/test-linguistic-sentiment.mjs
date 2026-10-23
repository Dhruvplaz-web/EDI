import { ClinicalLinguisticAnalyzer } from '../src/lib/telemetry/linguistic-sentiment.ts';

console.log("=============================================================");
console.log("   PRAXIS AI CLINICAL LINGUISTIC NLP ENGINE TEST");
console.log("=============================================================");

const analyzer = new ClinicalLinguisticAnalyzer();

// Test 1: Positive Baseline
console.log("\n[TEST 1] Testing Positive / Recovery Statement...");
const res1 = analyzer.analyzeUtterance("I am feeling much better today, sleeping well and calm.");
console.log(`  -> Polarity: ${res1.sentimentPolarity}, Severity: ${res1.linguisticSeverity}, Score: ${res1.clinicalRiskScore}/10`);
console.log(`  -> Explanation: ${res1.clinicalExplanation}`);
if (res1.linguisticSeverity <= 0.25 && res1.sentimentPolarity > 0) {
  console.log("  ✓ PASSED: Correctly scored as low-risk positive affirmation.");
} else {
  console.error("  ✗ FAILED: Did not detect positive sentiment.");
  process.exit(1);
}

// Test 2: Depressive Despair
console.log("\n[TEST 2] Testing Severe Depressive Despair Statement...");
const res2 = analyzer.analyzeUtterance("I feel completely hopeless and worthless, I just have no energy.");
console.log(`  -> Polarity: ${res2.sentimentPolarity}, Severity: ${res2.linguisticSeverity}, Score: ${res2.clinicalRiskScore}/10`);
console.log(`  -> Dominant Category: ${res2.dominantCategory}`);
console.log(`  -> Tokens: ${JSON.stringify(res2.flaggedTokens.map(t => t.phrase))}`);
if (res2.dominantCategory === 'depressive_despair' && res2.clinicalRiskScore >= 6.5) {
  console.log("  ✓ PASSED: Correctly flagged depressive despair category and high score.");
} else {
  console.error("  ✗ FAILED: Expected depressive_despair category.");
  process.exit(1);
}

// Test 3: Acute Suicide Crisis
console.log("\n[TEST 3] Testing Acute Suicidal Ideation Statement...");
const res3 = analyzer.analyzeUtterance("I want to end it all. I am just a burden to everyone.");
console.log(`  -> Polarity: ${res3.sentimentPolarity}, Severity: ${res3.linguisticSeverity}, Score: ${res3.clinicalRiskScore}/10`);
console.log(`  -> Crisis Alert: ${res3.isCrisisAlert}`);
console.log(`  -> Explanation: ${res3.clinicalExplanation}`);
if (res3.isCrisisAlert && res3.dominantCategory === 'suicide_crisis' && res3.clinicalRiskScore >= 9.0) {
  console.log("  ✓ PASSED: Critical suicide alert triggered (Score >= 9.0/10).");
} else {
  console.error("  ✗ FAILED: Crisis alert failed to trigger.");
  process.exit(1);
}

// Test 4: Panic & Somatic Attack
console.log("\n[TEST 4] Testing Panic & Somatic Alarm...");
const res4 = analyzer.analyzeUtterance("I can't breathe, my heart is pounding, I feel like I am having a heart attack!");
console.log(`  -> Category: ${res4.dominantCategory}, Severity: ${res4.linguisticSeverity}`);
if (res4.dominantCategory === 'panic_somatic') {
  console.log("  ✓ PASSED: Correctly categorized as panic_somatic.");
} else {
  console.error("  ✗ FAILED: Expected panic_somatic category.");
  process.exit(1);
}

console.log("\n=============================================================");
console.log("   ALL 4 CLINICAL LINGUISTIC NLP TESTS PASSED! ✓");
console.log("=============================================================\n");
