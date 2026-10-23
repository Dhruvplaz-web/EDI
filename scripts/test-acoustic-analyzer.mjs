import { AcousticSignalAnalyzer } from '../src/lib/telemetry/acoustic-analyzer.ts';

/**
 * Generates an audio signal with cycle-level jitter and shimmer perturbations
 */
function generateTestVocalSignal(baseFreq, sampleRate, durationSec, jitterAmount = 0.0, shimmerAmount = 0.0) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new Float32Array(numSamples);
  let sampleIndex = 0;
  let cycleCount = 0;

  while (sampleIndex < numSamples) {
    // Perturb cycle duration (Jitter)
    // Alternate longer/shorter cycles or pseudo-random perturbation
    const cycleJitter = jitterAmount * Math.sin(cycleCount * 1.7);
    const cycleDurationSec = (1.0 / baseFreq) * (1.0 + cycleJitter);
    const cycleSamples = Math.max(Math.round(cycleDurationSec * sampleRate), 10);

    // Perturb cycle peak amplitude (Shimmer)
    const cycleShimmer = shimmerAmount * Math.sin(cycleCount * 1.3);
    const cyclePeakAmp = Math.max(0.5 * (1.0 + cycleShimmer), 0.05);

    for (let j = 0; j < cycleSamples && sampleIndex < numSamples; j++) {
      const phase = (2 * Math.PI * j) / cycleSamples;
      buffer[sampleIndex] = cyclePeakAmp * Math.sin(phase);
      sampleIndex++;
    }
    cycleCount++;
  }

  return buffer;
}

console.log("=============================================================");
console.log("   PRAXIS AI ACOUSTIC SIGNAL ANALYZER (YIN & DSP) TEST");
console.log("=============================================================");

const sampleRate = 48000;
const frameSize = 2048;
const analyzer = new AcousticSignalAnalyzer(sampleRate);

// Test 1: Clean 220 Hz Tone Pitch Detection
console.log("\n[TEST 1] Pitch Detection YIN on 220 Hz Fundamental...");
const tone220 = generateTestVocalSignal(220, sampleRate, 0.5, 0.0, 0.0);
let detectedPitch = 0;
for (let i = 0; i < tone220.length - frameSize; i += frameSize) {
  const frame = tone220.subarray(i, i + frameSize);
  const res = analyzer.processFrame(frame);
  if (res.isVoiced) {
    detectedPitch = res.pitchHz;
  }
}
console.log(`  -> Expected ~220.0 Hz, Detected: ${detectedPitch} Hz`);
if (Math.abs(detectedPitch - 220) < 5.0) {
  console.log("  ✓ PASSED: YIN pitch detection error < 2.5%");
} else {
  console.error(`  ✗ FAILED: Expected 220 Hz, got ${detectedPitch}`);
  process.exit(1);
}

// Test 2: Vocal Jitter Detection on Perturbed Signal
console.log("\n[TEST 2] Vocal Jitter Detection on 4% Cycle-Perturbed Signal...");
analyzer.reset();
const jitteryTone = generateTestVocalSignal(180, sampleRate, 0.8, 0.04, 0.0);
let finalJitter = 0;
for (let i = 0; i < jitteryTone.length - frameSize; i += frameSize) {
  const frame = jitteryTone.subarray(i, i + frameSize);
  const res = analyzer.processFrame(frame);
  if (res.isVoiced) {
    finalJitter = res.jitterPercent;
  }
}
console.log(`  -> Jitter Detected: ${finalJitter}%`);
if (finalJitter >= 1.5) {
  console.log("  ✓ PASSED: Jitter correctly flagged elevated vocal tremor (>= 1.5%)");
} else {
  console.error(`  ✗ FAILED: Jitter did not reflect perturbation: ${finalJitter}`);
  process.exit(1);
}

// Test 3: Vocal Shimmer Detection on 15% Amplitude-Modulated Signal
console.log("\n[TEST 3] Vocal Shimmer Detection on 15% Amplitude-Modulated Signal...");
analyzer.reset();
const shimmerTone = generateTestVocalSignal(180, sampleRate, 0.8, 0.0, 0.15);
let finalShimmer = 0;
for (let i = 0; i < shimmerTone.length - frameSize; i += frameSize) {
  const frame = shimmerTone.subarray(i, i + frameSize);
  const res = analyzer.processFrame(frame);
  if (res.isVoiced) {
    finalShimmer = res.shimmerPercent;
  }
}
console.log(`  -> Shimmer Detected: ${finalShimmer}%`);
if (finalShimmer >= 3.0) {
  console.log("  ✓ PASSED: Shimmer correctly flagged amplitude instability (>= 3.0%)");
} else {
  console.error(`  ✗ FAILED: Shimmer did not detect amplitude modulation: ${finalShimmer}`);
  process.exit(1);
}

// Test 4: Silence & Noise Floor Rejection
console.log("\n[TEST 4] Silence & Noise Floor Rejection...");
const silentBuffer = new Float32Array(frameSize);
const silentRes = analyzer.processFrame(silentBuffer);
console.log(`  -> RMS: ${silentRes.rmsEnergy}, isVoiced: ${silentRes.isVoiced}`);
if (!silentRes.isVoiced && silentRes.pitchHz === 0) {
  console.log("  ✓ PASSED: Silent frame correctly classified as unvoiced (F0 = 0)");
} else {
  console.error("  ✗ FAILED: Silence was falsely classified as voiced");
  process.exit(1);
}

console.log("\n=============================================================");
console.log("   ALL 4 ACOUSTIC SIGNAL ANALYZER TESTS PASSED! ✓");
console.log("=============================================================\n");
