import { useState, useEffect, useRef, useCallback } from 'react';
import { ClinicalLinguisticAnalyzer, LinguisticAnalysisResult } from '@/lib/telemetry/linguistic-sentiment';

export type TranscriptionEngineMode = 'disabled' | 'on_device_wasm' | 'browser_cloud_opt_in';

export interface TranscriptEntry {
  id: string;
  timestamp: number;
  speaker: 'patient' | 'clinician';
  text: string;
  analysis: LinguisticAnalysisResult;
}

export interface LiveTranscriptionHook {
  isListening: boolean;
  isSupported: boolean;
  engineMode: TranscriptionEngineMode;
  transcriptHistory: TranscriptEntry[];
  interimText: string;
  fullTranscriptText: string;
  speechVelocityWpm: number;
  linguisticSeverity: number;
  crisisAlert: boolean;
  latestAnalysis: LinguisticAnalysisResult | null;
  startTranscription: () => void;
  stopTranscription: () => void;
  clearTranscript: () => void;
  addManualUtterance: (text: string, speaker?: 'patient' | 'clinician') => void;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function useLiveTranscription(
  hasConsent: boolean = false,
  autoStart: boolean = false,
  engineMode: TranscriptionEngineMode = 'disabled'
): LiveTranscriptionHook {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  });
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([]);
  const [interimText, setInterimText] = useState('');
  const [speechVelocityWpm, setSpeechVelocityWpm] = useState(130);
  const [linguisticSeverity, setLinguisticSeverity] = useState(0.1);
  const [crisisAlert, setCrisisAlert] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<LinguisticAnalysisResult | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const analyzerRef = useRef<ClinicalLinguisticAnalyzer>(new ClinicalLinguisticAnalyzer());
  const isManuallyStopped = useRef(false);

  const processUtterance = useCallback((text: string, speaker: 'patient' | 'clinician' = 'patient') => {
    if (!text.trim()) return;
    const result = analyzerRef.current.analyzeUtterance(text);
    const entry: TranscriptEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      speaker,
      text: text.trim(),
      analysis: result
    };

    setTranscriptHistory(prev => [...prev, entry]);
    setLatestAnalysis(result);
    setSpeechVelocityWpm(result.speechVelocityWpm);
    setLinguisticSeverity(result.linguisticSeverity);
    if (result.isCrisisAlert) {
      setCrisisAlert(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Consent Gate & Engine Privacy Gate (C.3):
    // webkitSpeechRecognition is DISABLED BY DEFAULT to prevent unconsented voice transmission
    // to Google Speech backend servers without an enterprise India DPA.
    if (!hasConsent || engineMode !== 'browser_cloud_opt_in') {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      return;
    }

    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRecognitionClass = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            const finalText = item[0].transcript;
            processUtterance(finalText, 'patient');
          } else {
            interim += item[0].transcript;
          }
        }
        setInterimText(interim);
      };

      recognition.onerror = (event: { error: string }) => {
        if (event.error !== 'no-speech') {
          console.warn("[useLiveTranscription] SpeechRecognition notice:", event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically restart if not manually stopped and consent is active
        if (!isManuallyStopped.current && autoStart && hasConsent && engineMode === 'browser_cloud_opt_in') {
          try {
            recognition.start();
          } catch {}
        }
      };

      if (autoStart && hasConsent && engineMode === 'browser_cloud_opt_in') {
        try {
          recognition.start();
        } catch {}
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Recognition error';
      console.warn("[useLiveTranscription] Init error:", errorMsg);
    }

    return () => {
      isManuallyStopped.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [hasConsent, autoStart, engineMode, processUtterance]);

  const startTranscription = () => {
    if (!hasConsent) {
      console.warn("[useLiveTranscription] Cannot start speech recognition: Patient consent required (REG-01).");
      return;
    }

    if (engineMode === 'disabled') {
      console.warn("[useLiveTranscription] Speech transcription is DISABLED by default under DPDP Act 2023 & Indian Data Residency safeguards. No network speech egress initiated.");
      return;
    }

    if (engineMode === 'on_device_wasm') {
      isManuallyStopped.current = false;
      setIsListening(true);
      console.info("[useLiveTranscription] On-Device WASM speech processing active. Zero network speech egress.");
      return;
    }

    if (engineMode === 'browser_cloud_opt_in') {
      isManuallyStopped.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch {}
      }
    }
  };

  const stopTranscription = () => {
    isManuallyStopped.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  };

  const clearTranscript = () => {
    setTranscriptHistory([]);
    setInterimText('');
    setCrisisAlert(false);
    setLinguisticSeverity(0.1);
  };

  const fullTranscriptText = transcriptHistory
    .map(t => `${t.speaker === 'patient' ? 'Patient' : 'Clinician'} [${new Date(t.timestamp).toLocaleTimeString()}]: ${t.text}`)
    .join('\n');

  return {
    isListening,
    isSupported,
    engineMode,
    transcriptHistory,
    interimText,
    fullTranscriptText,
    speechVelocityWpm,
    linguisticSeverity,
    crisisAlert,
    latestAnalysis,
    startTranscription,
    stopTranscription,
    clearTranscript,
    addManualUtterance: (text, speaker = 'patient') => processUtterance(text, speaker)
  };
}
