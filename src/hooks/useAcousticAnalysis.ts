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
}

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

  const analyzerRef = useRef<AcousticSignalAnalyzer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);

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

        const source = audioCtx.createMediaStreamSource(mediaStream);
        sourceNodeRef.current = source;

        // 2048 sample buffer gives ~42.6ms windows at 48kHz (ideal for vocal pitch & cycle resolution)
        const processor = audioCtx.createScriptProcessor(2048, 1, 1);
        processorNodeRef.current = processor;

        let frameThrottle = 0;

        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          if (isCancelled) return;
          const inputChannel = e.inputBuffer.getChannelData(0);
          const result = analyzer.processFrame(inputChannel);

          // Throttle React state updates to ~15-20 updates/sec to protect rendering performance
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
            setLatestResult(result);
          }
        };

        source.connect(processor);
        // Connect to a silent dummy destination to keep processor flowing
        const dummyGain = audioCtx.createGain();
        dummyGain.gain.value = 0;
        processor.connect(dummyGain);
        dummyGain.connect(audioCtx.destination);

        setIsAnalyzing(true);
      } catch (err: unknown) {
        console.warn("[useAcousticAnalysis] Audio initialization fallback:", err instanceof Error ? err.message : String(err));
      }
    };

    startAudioProcessing();

    return () => {
      isCancelled = true;
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch {}
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
    latestResult
  };
}
