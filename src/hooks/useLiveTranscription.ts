import { useState, useEffect, useRef, useCallback } from 'react';
import { ClinicalLinguisticAnalyzer, LinguisticAnalysisResult } from '@/lib/telemetry/linguistic-sentiment';

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

export function useLiveTranscription(autoStart: boolean = true): LiveTranscriptionHook {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([]);
  const [interimText, setInterimText] = useState('');
  const [speechVelocityWpm, setSpeechVelocityWpm] = useState(130);
  const [linguisticSeverity, setLinguisticSeverity] = useState(0.1);
  const [crisisAlert, setCrisisAlert] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<LinguisticAnalysisResult | null>(null);

  const recognitionRef = useRef<any>(null);
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

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
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

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn("[useLiveTranscription] SpeechRecognition notice:", event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically restart if not manually stopped
        if (!isManuallyStopped.current && autoStart) {
          try {
            recognition.start();
          } catch {}
        }
      };

      if (autoStart) {
        try {
          recognition.start();
        } catch {}
      }
    } catch (err: any) {
      console.warn("[useLiveTranscription] Init error:", err.message);
    }

    return () => {
      isManuallyStopped.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [autoStart, processUtterance]);

  const startTranscription = () => {
    isManuallyStopped.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch {}
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
