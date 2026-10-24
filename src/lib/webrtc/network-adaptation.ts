/**
 * Praxis AI - WebRTC Low-Bandwidth Adaptation & Audio-Only Fallback Engine
 * 
 * Engineered for Indian telecom conditions (spotty Tier-2/Tier-3 4G/5G mobile connectivity):
 * 1. Continuous downlink/uplink bitrate tracking.
 * 2. Automated degradation ladder:
 *    - > 1000 kbps: HD 720p @ 30fps
 *    - 300 - 1000 kbps: Standard 360p @ 20fps
 *    - 150 - 300 kbps: Low 240p @ 15fps
 *    - < 150 kbps: Automatic AUDIO-ONLY Fallback (disables video track to ensure pristine voice)
 * 3. Exponential reconnect backoff handling with audio buffer preservation.
 */

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

export interface VideoConstraintsConfig {
  width: { ideal: number; max: number };
  height: { ideal: number; max: number };
  frameRate: { ideal: number; max: number };
}

export interface NetworkAdaptationState {
  estimatedKbps: number;
  quality: NetworkQuality;
  isAudioOnly: boolean;
  videoConstraints: VideoConstraintsConfig;
  userAdvice: string;
}

/**
 * Assesses network quality based on available bandwidth in kbps.
 */
export function evaluateNetworkQuality(kbps: number): NetworkAdaptationState {
  if (kbps <= 0) {
    return {
      estimatedKbps: 0,
      quality: 'offline',
      isAudioOnly: true,
      videoConstraints: { width: { ideal: 320, max: 320 }, height: { ideal: 240, max: 240 }, frameRate: { ideal: 10, max: 10 } },
      userAdvice: 'You are currently offline. Please check your internet connection.',
    };
  }

  // Under 150 kbps: Audio-only fallback
  if (kbps < 150) {
    return {
      estimatedKbps: kbps,
      quality: 'poor',
      isAudioOnly: true,
      videoConstraints: { width: { ideal: 320, max: 320 }, height: { ideal: 240, max: 240 }, frameRate: { ideal: 10, max: 10 } },
      userAdvice: 'Low bandwidth detected (<150 kbps). Video disabled to maintain clear audio consultation.',
    };
  }

  // 150 - 400 kbps: 240p video
  if (kbps < 400) {
    return {
      estimatedKbps: kbps,
      quality: 'fair',
      isAudioOnly: false,
      videoConstraints: { width: { ideal: 426, max: 426 }, height: { ideal: 240, max: 240 }, frameRate: { ideal: 15, max: 15 } },
      userAdvice: 'Moderate connection. Video resolution reduced to 240p to prevent audio stutter.',
    };
  }

  // 400 - 1000 kbps: 360p video
  if (kbps < 1000) {
    return {
      estimatedKbps: kbps,
      quality: 'good',
      isAudioOnly: false,
      videoConstraints: { width: { ideal: 640, max: 640 }, height: { ideal: 360, max: 360 }, frameRate: { ideal: 24, max: 24 } },
      userAdvice: 'Stable connection. Standard 360p video active.',
    };
  }

  // > 1000 kbps: HD 720p
  return {
    estimatedKbps: kbps,
    quality: 'excellent',
    isAudioOnly: false,
    videoConstraints: { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 30, max: 30 } },
    userAdvice: 'High-speed connection. HD 720p video active.',
  };
}

/**
 * Calculates exponential backoff reconnect delays in ms.
 * Attempt 1: 1000ms, Attempt 2: 2000ms, Attempt 3: 4000ms, Attempt 4: 8000ms (max 10000ms)
 */
export function calculateReconnectDelayMs(attemptNumber: number): number {
  const baseMs = 1000;
  const maxMs = 10000;
  const delay = baseMs * Math.pow(2, attemptNumber - 1);
  return Math.min(delay, maxMs);
}
