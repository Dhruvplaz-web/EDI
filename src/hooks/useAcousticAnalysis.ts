import { useState, useEffect, useRef } from 'react';
import { AcousticSignalAnalyzer, AcousticFrameResult } from '@/lib/telemetry/acoustic-analyzer';

export interface AcousticAnalysisHook {
  isAnalyzing: boolean;
  pitchHz: number;
  isVoiced: boolean;
  rmsEnergy: number;
  jitterPercent: number;
  shimmerPercent: number;
  pitchVariance: number;
  isFlatAffect: boolean;
  acousticStressScore: number;
  latestResult: AcousticFrameResult | null;
  isCalibrating: boolean;
  isCalibrated: boolean;
  calibrationProgress: number;
  baselineF0: number;
  normalizedJitterRatio: number;
  normalizedShimmerRatio: number;
  snrDb: number;
  isLowSNR: boolean;
  startCalibration: (durationMs?: number) => void;
}

// Inline AudioWorklet processor code executed on dedicated audio rendering thread
const AUDIO_WORKLET_CODE = `
class AcousticWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channelData = input[0];
    if (!channelData) return true;

    for (let i = 0; i < channelData.length; i++) {
      this.buffer[this.bufferIndex++] = channelData[i];
      if (this.bufferIndex >= this.bufferSize) {
        this.port.postMessage(this.buffer.slice());
        this.bufferIndex = 0;
      }
    }
    return true;
  }
}

registerProcessor('acoustic-worklet-processor', AcousticWorkletProcessor);
`;

export function useAcousticAnalysis(mediaStream: MediaStream | null): AcousticAnalysisHook {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pitchHz, setPitchHz] = useState(0);
  const [isVoiced, setIsVoiced] = useState(false);
  const [rmsEnergy, setRmsEnergy] = useState(0);
  const [jitterPercent, setJitterPercent] = useState(0.8);
  const [shimmerPercent, setShimmerPercent] = useState(2.2);
  const [pitchVariance, setPitchVariance] = useState(40.0);
  const [isFlatAffect, setIsFlatAffect] = useState(false);
  const [acousticStressScore, setAcousticStressScore] = useState(1.0);
  const [latestResult, setLatestResult] = useState<AcousticFrameResult | null>(null);

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [baselineF0, setBaselineF0] = useState(120.0);
  const [normalizedJitterRatio, setNormalizedJitterRatio] = useState(1.0);
  const [normalizedShimmerRatio, setNormalizedShimmerRatio] = useState(1.0);
  const [snrDb, setSnrDb] = useState(25.0);
  const [isLowSNR, setIsLowSNR] = useState(false);

  const analyzerRef = useRef<AcousticSignalAnalyzer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);

  const startCalibration = (durationMs: number = 15000) => {
    if (analyzerRef.current) {
      analyzerRef.current.startCalibration(durationMs);
      setIsCalibrating(true);
      setCalibrationProgress(0);
    }
  };

  useEffect(() => {
    if (!mediaStream) {
      setTimeout(() => setIsAnalyzing(false), 0);
      return;
    }

    const audioTracks = mediaStream.getAudioTracks();
    if (audioTracks.length === 0) {
      setTimeout(() => setIsAnalyzing(false), 0);
      return;
    }

    let isCancelled = false;
    let workletBlobUrl: string | null = null;

    const startAudioProcessing = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const analyzer = new AcousticSignalAnalyzer(audioCtx.sampleRate);
        analyzerRef.current = analyzer;

        // Auto-start 15-second individual baseline calibration
        analyzer.startCalibration(15000);
        setIsCalibrating(true);

        const source = audioCtx.createMediaStreamSource(mediaStream);
        sourceNodeRef.current = source;

        const dummyGain = audioCtx.createGain();
        dummyGain.gain.value = 0;
        dummyGain.connect(audioCtx.destination);

        let frameThrottle = 0;

        const handleAudioFrame = (channelData: Float32Array) => {
          if (isCancelled) return;
          const result = analyzer.processFrame(channelData);

          // Update calibration status
          const calStatus = analyzer.getCalibrationProgress();
          setIsCalibrating(calStatus.isCalibrating);
          setCalibrationProgress(calStatus.progressPercent);
          setIsCalibrated(calStatus.isCalibrated);

          if (calStatus.isCalibrated) {
            const base = analyzer.getBaseline();
            setBaselineF0(base.baselineF0);
          }

          // Throttle React state updates to ~15 updates/sec for smooth rendering
          frameThrottle++;
          if (frameThrottle % 2 === 0) {
            setPitchHz(result.pitchHz);
            setIsVoiced(result.isVoiced);
            setRmsEnergy(result.rmsEnergy);
            setJitterPercent(result.jitterPercent);
            setShimmerPercent(result.shimmerPercent);
            setPitchVariance(result.pitchVariance);
            setIsFlatAffect(result.isFlatAffect);
            setAcousticStressScore(result.acousticStressScore);
            setNormalizedJitterRatio(result.normalizedJitterRatio ?? 1.0);
            setNormalizedShimmerRatio(result.normalizedShimmerRatio ?? 1.0);
            setSnrDb(result.snrDb);
            setIsLowSNR(result.isLowSNR);
            setLatestResult(result);
          }
        };

        let workletAttached = false;

        // Attempt modern high-priority AudioWorklet first
        if (audioCtx.audioWorklet) {
          try {
            const blob = new Blob([AUDIO_WORKLET_CODE], { type: 'application/javascript' });
            workletBlobUrl = URL.createObjectURL(blob);
            await audioCtx.audioWorklet.addModule(workletBlobUrl);

            const workletNode = new AudioWorkletNode(audioCtx, 'acoustic-worklet-processor');
            workletNodeRef.current = workletNode;

            workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
              handleAudioFrame(event.data);
            };

            source.connect(workletNode);
            workletNode.connect(dummyGain);
            workletAttached = true;
          } catch (workletError: unknown) {
            console.info("[useAcousticAnalysis] Worklet initialization fallback to ScriptProcessor:", workletError);
          }
        }

        // ScriptProcessorNode fallback for restricted contexts or older browsers
        if (!workletAttached) {
          const processor = audioCtx.createScriptProcessor(2048, 1, 1);
          processorNodeRef.current = processor;

          processor.onaudioprocess = (e: AudioProcessingEvent) => {
            const inputChannel = e.inputBuffer.getChannelData(0);
            handleAudioFrame(inputChannel);
          };

          source.connect(processor);
          processor.connect(dummyGain);
        }

        setIsAnalyzing(true);
      } catch (err: unknown) {
        console.warn("[useAcousticAnalysis] Audio initialization failed:", err instanceof Error ? err.message : String(err));
      }
    };

    startAudioProcessing();

    return () => {
      isCancelled = true;
      if (workletBlobUrl) {
        URL.revokeObjectURL(workletBlobUrl);
      }
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch {}
      }
      if (workletNodeRef.current) {
        try { workletNodeRef.current.disconnect(); } catch {}
      }
      if (processorNodeRef.current) {
        try { processorNodeRef.current.disconnect(); } catch {}
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
      }
      setIsAnalyzing(false);
    };
  }, [mediaStream]);

  return {
    isAnalyzing,
    pitchHz,
    isVoiced,
    rmsEnergy,
    jitterPercent,
    shimmerPercent,
    pitchVariance,
    isFlatAffect,
    acousticStressScore,
    latestResult,
    isCalibrating,
    isCalibrated,
    calibrationProgress,
    baselineF0,
    normalizedJitterRatio,
    normalizedShimmerRatio,
    snrDb,
    isLowSNR,
    startCalibration
  };
}
