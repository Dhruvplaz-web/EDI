'use client'

import { useRef, useEffect } from 'react';
import { 
  FileText, Mic, MicOff, AlertCircle, ShieldAlert, 
  Sparkles, Activity, Clock, Zap, MessageSquare 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TranscriptEntry } from '@/hooks/useLiveTranscription';

interface LiveTranscriptFeedProps {
  transcriptHistory: TranscriptEntry[];
  interimText: string;
  isListening: boolean;
  speechVelocityWpm: number;
  linguisticSeverity: number;
  crisisAlert: boolean;
  onClear?: () => void;
  onSendToSOAP?: () => void;
}

export function LiveTranscriptFeed({
  transcriptHistory,
  interimText,
  isListening,
  speechVelocityWpm,
  linguisticSeverity,
  crisisAlert,
  onClear,
  onSendToSOAP
}: LiveTranscriptFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptHistory, interimText]);

  const getWpmStatus = (wpm: number) => {
    if (wpm > 180) return { label: 'Pressured Speech (Manic)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (wpm < 85) return { label: 'Psychomotor Retardation (Depressive)', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    return { label: 'Normative Cadence', color: 'text-teal-700 bg-teal-50 border-teal-200' };
  };

  const wpmStatus = getWpmStatus(speechVelocityWpm);
  const clinicalScore = (1.0 + 9.0 * linguisticSeverity).toFixed(1);

  return (
    <Card className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl shadow-slate-200/50 font-sans flex flex-col h-full">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2 text-teal-600" /> Live Speech Transcription & NLP
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Real-time psychiatric symptom parsing & speech velocity tracking.
          </CardDescription>
        </div>

        <div className="flex items-center space-x-2">
          {/* Active Listening Status */}
          <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-full border flex items-center ${isListening ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            <span className={`w-2 h-2 rounded-full mr-1.5 ${isListening ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {isListening ? 'Streaming Speech' : 'Muted'}
          </span>

          {/* Speech Cadence Badge */}
          <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-full border ${wpmStatus.color}`}>
            {speechVelocityWpm} WPM • {wpmStatus.label}
          </span>
        </div>
      </CardHeader>

      {/* Real-time Crisis Banner */}
      {crisisAlert && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-rose-800 text-xs font-semibold flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>High-Risk Clinical Tokens Flagged in Patient Utterance</span>
          </div>
          <span className="font-mono text-[11px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-bold">
            Severity: {clinicalScore} / 10
          </span>
        </div>
      )}

      {/* Scrolling Utterance List */}
      <CardContent className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[220px] max-h-[340px]" ref={scrollRef}>
        {transcriptHistory.length === 0 && !interimText && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 space-y-2">
            <Mic className="w-8 h-8 opacity-40 text-teal-600" />
            <p className="text-xs text-slate-500 font-medium">Waiting for patient or clinician spoken dialogue...</p>
            <p className="text-[10px] text-slate-400">Tokens are parsed locally for DSM-5 symptom biomarkers</p>
          </div>
        )}

        {transcriptHistory.map((entry) => {
          const hasTokens = entry.analysis.flaggedTokens.length > 0;
          return (
            <div 
              key={entry.id} 
              className={`p-3 rounded-xl border transition-all ${
                entry.analysis.isCrisisAlert 
                  ? 'bg-rose-50/80 border-rose-200 shadow-sm' 
                  : hasTokens 
                  ? 'bg-amber-50/60 border-amber-200' 
                  : 'bg-slate-50/80 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                <span className="font-bold text-slate-700">
                  {entry.speaker === 'patient' ? 'Patient' : 'Clinician'}
                </span>
                <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
              </div>

              <p className="text-xs text-slate-900 leading-relaxed font-sans">
                {entry.text}
              </p>

              {/* Flagged Tokens Badges */}
              {hasTokens && (
                <div className="mt-2 flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-200/60">
                  {entry.analysis.flaggedTokens.map((token, i) => (
                    <span 
                      key={i}
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        token.category === 'suicide_risk' 
                          ? 'bg-rose-600 text-white' 
                          : token.category === 'depressive_despair'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {token.phrase} ({token.category.replace('_', ' ')})
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Interim In-Progress Utterance */}
        {interimText && (
          <div className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-200/60 text-xs italic text-teal-900 animate-pulse">
            <span className="font-mono text-[10px] font-bold text-teal-700 mr-2">Speaking:</span>
            {interimText}...
          </div>
        )}
      </CardContent>

      {/* Action Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-mono text-slate-500">
          NLP Severity: <strong className="text-slate-900 font-bold">{clinicalScore} / 10</strong>
        </span>

        <div className="flex items-center space-x-2">
          {onClear && (
            <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-slate-500 hover:text-slate-800 h-7 px-2">
              Clear
            </Button>
          )}
          {onSendToSOAP && (
            <Button size="sm" onClick={onSendToSOAP} className="text-xs bg-teal-700 hover:bg-teal-800 text-white h-7 px-3 font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Sync to SOAP Note
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
