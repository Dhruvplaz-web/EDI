import { useState, useEffect, useRef } from 'react';
import { ClinicalSignalEngine } from '@/lib/telemetry/signal-engine';

export interface FacialAnalysisHook {
  isLoaded: boolean;
  rawStressScore: number;
  emaStressScore: number;
  au4BrowDown: number;
  au15MouthFrown: number;
  isCalibrated: boolean;
  calibrationProgress: number;
  discrepancyAlert: boolean;
  discrepancyValue: number;
  isPoseCentered: boolean;
  headPose: { pitchDeg: number; yawDeg: number; rollDeg: number };
  startAnalysis: (videoElement: HTMLVideoElement, hasConsent?: boolean) => void;
  stopAnalysis: () => number;
  calibrateBaseline: (videoElement: HTMLVideoElement, durationSec?: number) => Promise<void>;
  setSubjectiveScore: (score: number) => void;
  setStressWeights: (weights: { alpha: number; beta: number }) => void;
}

export function useFacialAnalysis(): FacialAnalysisHook {
  const [isLoaded, setIsLoaded] = useState(false);
  const [rawStressScore, setRawStressScore] = useState(1.0);
  const [emaStressScore, setEmaStressScore] = useState(1.0);
  const [au4BrowDown, setAu4BrowDown] = useState(0.0);
  const [au15MouthFrown, setAu15MouthFrown] = useState(0.0);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [discrepancyAlert, setDiscrepancyAlert] = useState(false);
  const [discrepancyValue, setDiscrepancyValue] = useState(0.0);
  const [isPoseCentered, setIsPoseCentered] = useState(true);
  const [headPose, setHeadPose] = useState({ pitchDeg: 0, yawDeg: 0, rollDeg: 0 });

  const signalEngineRef = useRef(new ClinicalSignalEngine());
  const workerRef = useRef<Worker | null>(null);
  const requestRef = useRef<number>(0);
  const isAnalyzing = useRef(false);
  const subjectiveScoreRef = useRef(5.0);
  const customWeightsRef = useRef({ alpha: 0.6, beta: 0.4 });

  useEffect(() => {
    // Initialize WebWorker thread for MediaPipe FaceMesh landmark extraction
    try {
      const worker = new Worker(new URL('../workers/mediapipe.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const { type, payload, error } = e.data;
        if (type === 'INIT_COMPLETE') {
          setIsLoaded(true);
        } else if (type === 'FRAME_PROCESSED' && payload) {
          const shapes = payload.blendshapes || {};
          const au4 = shapes['browDownLeft'] || shapes['browDownRight'] || shapes['browDown'] || 0;
          let au15 = shapes['mouthFrownLeft'] || shapes['mouthFrownRight'] || shapes['mouthFrown'] || 0;

          if (payload.headPose) {
            setIsPoseCentered(payload.headPose.isPoseCentered);
            setHeadPose(payload.headPose);

            // 3D Pose Foreshortening Compensation:
            // When user looks down (pitch < -18°) or turns head (yaw > 20°),
            // 2D distance between mouth corners and jaw decreases artificially.
            // Attenuate uncompensated geometric skew when off-axis:
            if (!payload.headPose.isPoseCentered) {
              au15 *= 0.55; // Attenuate head-tilt pseudo-frown
            }
          }

          setAu4BrowDown(parseFloat(au4.toFixed(2)));
          setAu15MouthFrown(parseFloat(au15.toFixed(2)));

          const rawStress = signalEngineRef.current.computeObjectiveStress(au4, au15, customWeightsRef.current);
          const emaStress = signalEngineRef.current.updateEMA(rawStress);

          setRawStressScore(rawStress);
          setEmaStressScore(emaStress);

          const disc = signalEngineRef.current.evaluateModalityDiscrepancy(subjectiveScoreRef.current, Date.now());
          setDiscrepancyValue(disc.discrepancy);
          setDiscrepancyAlert(disc.isAlertActive);
        } else if (type === 'INIT_ERROR' || type === 'FRAME_ERROR') {
          console.warn("Facial Analysis Worker:", error);
        }
      };

      worker.postMessage({ type: 'INIT' });
    } catch (err) {
      console.error("Failed to initialize MediaPipe Worker:", err);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const calibrateBaseline = async (videoElement: HTMLVideoElement, durationSec: number = 10): Promise<void> => {
    setCalibrationProgress(0);
    const steps = 20;
    const intervalMs = (durationSec * 1000) / steps;

    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, intervalMs));
      setCalibrationProgress(Math.round((i / steps) * 100));
    }

    setIsCalibrated(true);
  };

  const startAnalysis = (videoElement: HTMLVideoElement, hasConsent: boolean = false) => {
    if (!videoElement || isAnalyzing.current) return;
    if (!hasConsent) {
      console.warn("[useFacialAnalysis] Cannot start facial kinematics capture: Patient consent required (REG-01).");
      return;
    }
    isAnalyzing.current = true;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const captureFrame = async () => {
      if (!isAnalyzing.current) return;

      if (videoElement.readyState >= 2 && workerRef.current) {
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 480;
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0);
          try {
            const imageBitmap = await createImageBitmap(canvas);
            // Transfer ImageBitmap to WebWorker thread (zero-copy)
            workerRef.current.postMessage(
              { type: 'PROCESS_FRAME', payload: { imageBitmap, timestamp: performance.now() } },
              [imageBitmap]
            );
          } catch (err) {
            // Ignore capture glitches
          }
        }
      }

      requestRef.current = requestAnimationFrame(captureFrame);
    };

    captureFrame();
  };

  const stopAnalysis = (): number => {
    isAnalyzing.current = false;
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return emaStressScore;
  };

  const setSubjectiveScore = (score: number) => {
    subjectiveScoreRef.current = score;
  };

  const setStressWeights = (weights: { alpha: number; beta: number }) => {
    customWeightsRef.current = weights;
  };

  return {
    isLoaded,
    rawStressScore,
    emaStressScore,
    au4BrowDown,
    au15MouthFrown,
    isCalibrated,
    calibrationProgress,
    discrepancyAlert,
    discrepancyValue,
    isPoseCentered,
    headPose,
    startAnalysis,
    stopAnalysis,
    calibrateBaseline,
    setSubjectiveScore,
    setStressWeights
  };
}
