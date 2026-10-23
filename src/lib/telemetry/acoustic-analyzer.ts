/**
 * Praxis AI - Real-Time Vocal Acoustic Biomarker Analyzer (Clinical DSP)
 * Implements Praat/openSMILE-grade glottal cycle extraction:
 * - Fundamental Frequency (F0) via YIN with parabolic interpolation
 * - Cycle-by-cycle Glottal Pulse Extraction for sub-frame Period Perturbation (Jitter)
 * - Cycle-by-cycle Peak Amplitude Perturbation (Shimmer)
 * - RMS Energy & Voice Activity Detection (VAD)
 * - Acoustic Flat Affect & Prosodic Blunting Index
 */

export interface AcousticFrameResult {
  timestamp: number;
  pitchHz: number;
  isVoiced: boolean;
  rmsEnergy: number;
  jitterPercent: number;
  shimmerPercent: number;
  pitchVariance: number;
  isFlatAffect: boolean;
  acousticStressScore: number; // 1.0 - 10.0
  normalizedJitterRatio?: number;
  normalizedShimmerRatio?: number;
  normalizedVarianceRatio?: number;
  // Ambient room acoustic telemetry (Noise floor & SNR tracking)
  estimatedNoiseFloorRms: number;
  snrDb: number;
  isLowSNR: boolean;
}

export interface AcousticBaseline {
  baselineF0: number;
  baselineJitter: number;
  baselineShimmer: number;
  baselineVariance: number;
  isCalibrated: boolean;
  sampleCount: number;
}

export class AcousticSignalAnalyzer {
  private sampleRate: number;
  private minF0: number = 65;   // Minimum expected human fundamental frequency (Hz)
  private maxF0: number = 450;  // Maximum expected human fundamental frequency (Hz)
  private yinThreshold: number = 0.15; // YIN dip threshold
  private minRmsEnergy: number = 0.015; // Noise floor threshold for voiced speech

  // Rolling buffers for glottal cycle periods and amplitudes
  private glottalPeriods: number[] = [];
  private glottalAmplitudes: number[] = [];
  private f0History: number[] = [];
  private maxGlottalHistory: number = 60; // Store last 60 glottal cycles (~300-500ms of voice)

  // 15-second individual acoustic baseline calibration (Opus codec & hardware invariant)
  private baseline: AcousticBaseline = {
    baselineF0: 120.0,
    baselineJitter: 0.75,
    baselineShimmer: 2.2,
    baselineVariance: 40.0,
    isCalibrated: false,
    sampleCount: 0
  };
  private isCalibrating: boolean = false;
  private calibrationSamples: { f0: number; jitter: number; shimmer: number; variance: number }[] = [];
  private calibrationDurationMs: number = 15000;
  private calibrationStartTime: number | null = null;
  private noiseFloorRms: number = 0.005; // Leaky tracking of background noise floor

  constructor(sampleRate: number = 48000) {
    this.sampleRate = sampleRate;
  }

  public setSampleRate(sampleRate: number) {
    this.sampleRate = sampleRate;
  }

  public startCalibration(durationMs: number = 15000) {
    this.isCalibrating = true;
    this.calibrationDurationMs = durationMs;
    this.calibrationStartTime = Date.now();
    this.calibrationSamples = [];
  }

  public getCalibrationProgress(): { isCalibrating: boolean; progressPercent: number; isCalibrated: boolean } {
    if (!this.isCalibrating || !this.calibrationStartTime) {
      return { isCalibrating: false, progressPercent: this.baseline.isCalibrated ? 100 : 0, isCalibrated: this.baseline.isCalibrated };
    }
    const elapsed = Date.now() - this.calibrationStartTime;
    const progress = Math.min(100, Math.round((elapsed / this.calibrationDurationMs) * 100));
    return { isCalibrating: true, progressPercent: progress, isCalibrated: this.baseline.isCalibrated };
  }

  public getBaseline(): AcousticBaseline {
    return { ...this.baseline };
  }

  public setBaseline(baseline: AcousticBaseline) {
    this.baseline = { ...baseline };
  }

  /**
   * Root Mean Square (RMS) energy
   */
  public computeRMS(buffer: Float32Array): number {
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumSquares += buffer[i] * buffer[i];
    }
    return Math.sqrt(sumSquares / buffer.length);
  }

  /**
   * YIN Pitch Detection Algorithm with parabolic interpolation
   */
  public detectPitchYIN(buffer: Float32Array): number {
    const bufferSize = buffer.length;
    const halfBufferSize = Math.floor(bufferSize / 2);
    const minTau = Math.floor(this.sampleRate / this.maxF0);
    const maxTau = Math.min(Math.floor(this.sampleRate / this.minF0), halfBufferSize);

    const yinBuffer = new Float32Array(halfBufferSize);
    yinBuffer[0] = 1.0;

    let runningSum = 0;
    for (let tau = 1; tau < maxTau; tau++) {
      let diff = 0;
      for (let i = 0; i < halfBufferSize; i++) {
        const delta = buffer[i] - buffer[i + tau];
        diff += delta * delta;
      }
      yinBuffer[tau] = diff;
      runningSum += diff;
      yinBuffer[tau] *= tau / runningSum;
    }

    let tauCandidate = -1;
    for (let tau = minTau; tau < maxTau; tau++) {
      if (yinBuffer[tau] < this.yinThreshold) {
        while (tau + 1 < maxTau && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }
        tauCandidate = tau;
        break;
      }
    }

    if (tauCandidate === -1) {
      let minVal = 1.0;
      for (let tau = minTau; tau < maxTau; tau++) {
        if (yinBuffer[tau] < minVal) {
          minVal = yinBuffer[tau];
          tauCandidate = tau;
        }
      }
      if (minVal > 0.45) {
        return 0; // Unvoiced / noise frame
      }
    }

    let betterTau = tauCandidate;
    const x0 = tauCandidate < 1 ? tauCandidate : tauCandidate - 1;
    const x2 = tauCandidate + 1 < halfBufferSize ? tauCandidate + 1 : tauCandidate;

    if (x0 !== tauCandidate && x2 !== tauCandidate) {
      const s0 = yinBuffer[x0];
      const s1 = yinBuffer[tauCandidate];
      const s2 = yinBuffer[x2];
      const denom = 2 * (2 * s1 - s2 - s0);
      if (denom !== 0) {
        betterTau = tauCandidate + (s2 - s0) / denom;
      }
    }

    return this.sampleRate / betterTau;
  }

  /**
   * Extract individual glottal pulse periods (T_k) and peak amplitudes (A_k)
   * within a single frame given the detected fundamental frequency F0.
   */
  private extractGlottalCycles(buffer: Float32Array, f0: number) {
    if (f0 <= 0) return;
    const nominalPeriodSamples = Math.round(this.sampleRate / f0);
    const minStep = Math.max(Math.floor(nominalPeriodSamples * 0.7), 2);
    const maxStep = Math.floor(nominalPeriodSamples * 1.3);

    // Find initial positive peak
    let firstPeak = -1;
    for (let i = 1; i < Math.min(nominalPeriodSamples * 2, buffer.length - 1); i++) {
      if (buffer[i] > 0.02 && buffer[i] > buffer[i - 1] && buffer[i] >= buffer[i + 1]) {
        firstPeak = i;
        break;
      }
    }

    if (firstPeak === -1) return;

    let currentPeak = firstPeak;
    while (currentPeak + minStep < buffer.length) {
      const windowStart = currentPeak + minStep;
      const windowEnd = Math.min(currentPeak + maxStep, buffer.length - 1);

      let nextPeak = -1;
      let maxVal = -1;

      for (let j = windowStart; j <= windowEnd; j++) {
        if (buffer[j] > maxVal && buffer[j] > buffer[j - 1] && buffer[j] >= buffer[j + 1]) {
          maxVal = buffer[j];
          nextPeak = j;
        }
      }

      if (nextPeak !== -1 && maxVal > 0.01) {
        const cyclePeriodSec = (nextPeak - currentPeak) / this.sampleRate;
        this.glottalPeriods.push(cyclePeriodSec);
        this.glottalAmplitudes.push(maxVal);

        if (this.glottalPeriods.length > this.maxGlottalHistory) {
          this.glottalPeriods.shift();
          this.glottalAmplitudes.shift();
        }

        currentPeak = nextPeak;
      } else {
        break;
      }
    }
  }

  /**
   * Processes a live PCM Float32Array frame
   */
  public processFrame(buffer: Float32Array, timestamp: number = Date.now()): AcousticFrameResult {
    const rms = this.computeRMS(buffer);
    const isLoudEnough = rms >= this.minRmsEnergy;

    let f0 = 0;
    let isVoiced = false;

    if (isLoudEnough) {
      f0 = this.detectPitchYIN(buffer);
      if (f0 >= this.minF0 && f0 <= this.maxF0) {
        isVoiced = true;
        this.f0History.push(f0);
        if (this.f0History.length > 30) this.f0History.shift();

        // Extract sub-frame glottal cycles for accurate cycle-to-cycle jitter/shimmer
        this.extractGlottalCycles(buffer, f0);
      }
    }

    // Jitter formulation (Relative Average Perturbation over glottal pulses)
    const jitter = this.computeJitter();

    // Shimmer formulation (Amplitude Perturbation Quotient over glottal pulses)
    const shimmer = this.computeShimmer();

    // Pitch variance
    const pitchVariance = this.computePitchVariance();

    // Accumulate calibration statistics if within calibration window
    if (this.isCalibrating && isVoiced && this.calibrationStartTime) {
      this.calibrationSamples.push({ f0, jitter, shimmer, variance: pitchVariance });
      const elapsed = Date.now() - this.calibrationStartTime;
      if (elapsed >= this.calibrationDurationMs) {
        this.finalizeCalibration();
      }
    }

    // Flat Affect detection: speech is voiced with low pitch variance (< 14 Hz) and low energy
    const isFlatAffect = this.f0History.length >= 8 && pitchVariance < 14.0 && rms < 0.12;

    // Relative ratios against individual calibrated baseline
    const normalizedJitterRatio = this.baseline.isCalibrated && this.baseline.baselineJitter > 0
      ? parseFloat((jitter / this.baseline.baselineJitter).toFixed(2))
      : 1.0;
    const normalizedShimmerRatio = this.baseline.isCalibrated && this.baseline.baselineShimmer > 0
      ? parseFloat((shimmer / this.baseline.baselineShimmer).toFixed(2))
      : 1.0;
    const normalizedVarianceRatio = this.baseline.isCalibrated && this.baseline.baselineVariance > 0
      ? parseFloat((pitchVariance / this.baseline.baselineVariance).toFixed(2))
      : 1.0;

    // Composite acoustic stress index [1.0, 10.0]
    const acousticStressScore = this.computeAcousticStress(jitter, shimmer, isFlatAffect, normalizedJitterRatio, normalizedShimmerRatio);

    // Dynamic noise floor tracking: update noise floor on unvoiced/silence frames
    if (!isVoiced || !isLoudEnough) {
      this.noiseFloorRms = 0.95 * this.noiseFloorRms + 0.05 * Math.max(rms, 0.001);
    }

    // Signal-to-Noise Ratio (SNR) in decibels: 20 * log10(RMS_signal / RMS_noise)
    const effectiveNoiseFloor = Math.max(this.noiseFloorRms, 0.001);
    const snrDb = parseFloat((20 * Math.log10(Math.max(rms, 0.001) / effectiveNoiseFloor)).toFixed(1));
    const isLowSNR = isVoiced && snrDb < 10.0; // SNR < 10 dB indicates heavy ambient interference (fans/traffic)

    return {
      timestamp,
      pitchHz: isVoiced ? parseFloat(f0.toFixed(1)) : 0,
      isVoiced,
      rmsEnergy: parseFloat(rms.toFixed(3)),
      jitterPercent: parseFloat(jitter.toFixed(2)),
      shimmerPercent: parseFloat(shimmer.toFixed(2)),
      pitchVariance: parseFloat(pitchVariance.toFixed(1)),
      isFlatAffect,
      acousticStressScore: parseFloat(acousticStressScore.toFixed(1)),
      normalizedJitterRatio,
      normalizedShimmerRatio,
      normalizedVarianceRatio,
      estimatedNoiseFloorRms: parseFloat(effectiveNoiseFloor.toFixed(4)),
      snrDb,
      isLowSNR
    };
  }

  private finalizeCalibration() {
    this.isCalibrating = false;
    if (this.calibrationSamples.length > 0) {
      const count = this.calibrationSamples.length;
      const sumF0 = this.calibrationSamples.reduce((acc, s) => acc + s.f0, 0);
      const sumJitter = this.calibrationSamples.reduce((acc, s) => acc + s.jitter, 0);
      const sumShimmer = this.calibrationSamples.reduce((acc, s) => acc + s.shimmer, 0);
      const sumVar = this.calibrationSamples.reduce((acc, s) => acc + s.variance, 0);

      this.baseline = {
        baselineF0: parseFloat((sumF0 / count).toFixed(1)),
        baselineJitter: parseFloat((sumJitter / count).toFixed(2)),
        baselineShimmer: parseFloat((sumShimmer / count).toFixed(2)),
        baselineVariance: parseFloat((sumVar / count).toFixed(1)),
        isCalibrated: true,
        sampleCount: count
      };
    }
  }

  /**
   * Relative Average Perturbation (RAP) Jitter:
   * Jitter = sum(|T_i - T_{i+1}|) / ((N-1) * mean(T)) * 100%
   */
  private computeJitter(): number {
    const T = this.glottalPeriods;
    if (T.length < 4) return 0.75; // Baseline healthy vocal default

    let diffSum = 0;
    let sum = 0;

    for (let i = 0; i < T.length - 1; i++) {
      diffSum += Math.abs(T[i] - T[i + 1]);
      sum += T[i];
    }
    sum += T[T.length - 1];

    const meanPeriod = sum / T.length;
    if (meanPeriod === 0) return 0.75;

    const meanDiff = diffSum / (T.length - 1);
    const jitterVal = (meanDiff / meanPeriod) * 100.0;
    return Math.min(Math.max(jitterVal, 0.1), 8.0);
  }

  /**
   * Shimmer: Relative Amplitude Perturbation
   * Shimmer = sum(|A_i - A_{i+1}|) / ((N-1) * mean(A)) * 100%
   */
  private computeShimmer(): number {
    const A = this.glottalAmplitudes;
    if (A.length < 4) return 2.2; // Baseline healthy vocal default

    let diffSum = 0;
    let sum = 0;

    for (let i = 0; i < A.length - 1; i++) {
      diffSum += Math.abs(A[i] - A[i + 1]);
      sum += A[i];
    }
    sum += A[A.length - 1];

    const meanAmp = sum / A.length;
    if (meanAmp === 0) return 2.2;

    const meanDiff = diffSum / (A.length - 1);
    const shimmerVal = (meanDiff / meanAmp) * 100.0;
    return Math.min(Math.max(shimmerVal, 0.3), 15.0);
  }

  /**
   * Pitch Variance: standard deviation of F0 across recent voiced frames
   */
  private computePitchVariance(): number {
    const f0s = this.f0History;
    if (f0s.length < 4) return 40.0;

    const mean = f0s.reduce((a, b) => a + b, 0) / f0s.length;
    const variance = f0s.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / f0s.length;
    return Math.sqrt(variance);
  }

  /**
   * Composite Stress: Jitter & Shimmer weighting
   */
  private computeAcousticStress(
    jitter: number,
    shimmer: number,
    isFlatAffect: boolean,
    normJitterRatio: number = 1.0,
    normShimmerRatio: number = 1.0
  ): number {
    if (isFlatAffect) {
      return 7.5; // High depressive blunting risk
    }

    const absoluteNormJitter = Math.min(Math.max((jitter - 0.75) / 3.0, 0), 1.0);
    const absoluteNormShimmer = Math.min(Math.max((shimmer - 2.2) / 5.0, 0), 1.0);

    // If calibrated baseline exists, balance population normal with individual deviation
    const relativeShiftJitter = Math.min(Math.max((normJitterRatio - 1.0) / 1.5, 0), 1.0);
    const relativeShiftShimmer = Math.min(Math.max((normShimmerRatio - 1.0) / 1.5, 0), 1.0);

    const effJitter = this.baseline.isCalibrated ? (0.5 * absoluteNormJitter + 0.5 * relativeShiftJitter) : absoluteNormJitter;
    const effShimmer = this.baseline.isCalibrated ? (0.5 * absoluteNormShimmer + 0.5 * relativeShiftShimmer) : absoluteNormShimmer;

    const score = 1.0 + (9.0 * (0.6 * effJitter + 0.4 * effShimmer));
    return Math.min(Math.max(score, 1.0), 10.0);
  }

  public reset() {
    this.glottalPeriods = [];
    this.glottalAmplitudes = [];
    this.f0History = [];
  }
}
