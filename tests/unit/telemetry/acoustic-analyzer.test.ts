import { describe, it, expect, beforeEach } from 'vitest';
import { AcousticSignalAnalyzer } from '@/lib/telemetry/acoustic-analyzer';

describe('AcousticSignalAnalyzer (YIN DSP Engine & Prosody Metrics)', () => {
  const sampleRate = 44100;
  let analyzer: AcousticSignalAnalyzer;

  beforeEach(() => {
    analyzer = new AcousticSignalAnalyzer(sampleRate);
  });

  // Helper to generate clean synthetic sine waves
  function generateSineWave(freqHz: number, durationMs: number, amplitude: number = 0.5): Float32Array {
    const numSamples = Math.floor((sampleRate * durationMs) / 1000);
    const buffer = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      buffer[i] = amplitude * Math.sin((2 * Math.PI * freqHz * i) / sampleRate);
    }
    return buffer;
  }

  it('detects fundamental frequency (F0) accurately on pure sinusoidal input (220 Hz)', () => {
    const sine220 = generateSineWave(220, 200, 0.6);
    const result = analyzer.processFrame(sine220);

    expect(result.isVoiced).toBe(true);
    // YIN should resolve 220 Hz within a ±4 Hz tolerance band
    expect(result.pitchHz).toBeGreaterThanOrEqual(216);
    expect(result.pitchHz).toBeLessThanOrEqual(224);
    expect(result.rmsEnergy).toBeGreaterThan(0.3);
  });

  it('detects lower adult vocal pitch (120 Hz) within tolerance', () => {
    const sine120 = generateSineWave(120, 250, 0.5);
    const result = analyzer.processFrame(sine120);

    expect(result.isVoiced).toBe(true);
    expect(result.pitchHz).toBeGreaterThanOrEqual(116);
    expect(result.pitchHz).toBeLessThanOrEqual(124);
  });

  it('gracefully handles complete digital silence without throwing or outputting NaN', () => {
    const silence = new Float32Array(2048); // All zeros
    const result = analyzer.processFrame(silence);

    expect(result.isVoiced).toBe(false);
    expect(result.pitchHz).toBe(0);
    expect(result.rmsEnergy).toBe(0);
    expect(Number.isNaN(result.jitterPercent)).toBe(false);
    expect(Number.isNaN(result.shimmerPercent)).toBe(false);
    expect(Number.isFinite(result.acousticStressScore)).toBe(true);
  });

  it('tolerates extreme signal clipping (+1.0 and -1.0 rail-to-rail) robustly', () => {
    const clipped = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      clipped[i] = i % 2 === 0 ? 1.0 : -1.0;
    }
    const result = analyzer.processFrame(clipped);

    expect(Number.isNaN(result.pitchHz)).toBe(false);
    expect(Number.isFinite(result.rmsEnergy)).toBe(true);
    expect(Number.isFinite(result.acousticStressScore)).toBe(true);
  });

  it('sanitizes NaN and Infinity in input PCM stream without crashing', () => {
    const dirtyBuffer = new Float32Array(2048);
    dirtyBuffer[0] = NaN;
    dirtyBuffer[10] = Infinity;
    dirtyBuffer[50] = -Infinity;

    expect(() => {
      const result = analyzer.processFrame(dirtyBuffer);
      expect(Number.isNaN(result.pitchHz)).toBe(false);
    }).not.toThrow();
  });

  it('tracks SNR noise floor correctly under noisy low-signal conditions', () => {
    // Generate low-amplitude white noise
    const noiseBuffer = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      noiseBuffer[i] = (Math.random() - 0.5) * 0.005; // -46 dB
    }

    const result = analyzer.processFrame(noiseBuffer);
    expect(result.isVoiced).toBe(false);
    expect(result.snrDb).toBeLessThanOrEqual(20);
  });
});
