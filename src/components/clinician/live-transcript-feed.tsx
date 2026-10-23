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
    if (wpm > 180) return { label: 'Rapid Speech', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (wpm < 85) return { label: 'Slow Speech', color: 'text-[#52525B] bg-[#F4F4F5] border-[#E4E4E7]' };
    return { label: 'Normal Pace', color: 'text-[#09090B] bg-[#F4F4F5] border-[#E4E4E7]' };
  };

  const wpmStatus = getWpmStatus(speechVelocityWpm);
  const clinicalScore = (1.0 + 9.0 * linguisticSeverity).toFixed(1);

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-[#E4E4E7] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] rounded-xl font-sans flex flex-col h-full text-left">
      <CardHeader className="p-4 border-b border-[#F4F4F5] flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm font-semibold text-[#09090B] flex items-center">
            <MessageSquare className="w-4 h-4 mr-2 text-[#0066FF]" strokeWidth={1.75} /> Live Spoken Dialogue Transcript
          </CardTitle>
          <CardDescription className="text-xs text-[#71717A] mt-0.5">
            Real-time speech transcription and conversational pacing tracking.
          </CardDescription>
        </div>

        <div className="flex items-center space-x-2">
          {/* Active Listening Status */}
          <span className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-full border flex items-center ${isListening ? 'bg-[#F0F6FF] text-[#0066FF] border-[#BFDBFE]' : 'bg-[#F4F4F5] text-[#71717A] border-[#E4E4E7]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isListening ? 'bg-[#0066FF] animate-pulse' : 'bg-[#A1A1AA]'}`} />
            {isListening ? 'Transcribing' : 'Muted'}
          </span>

          {/* Speech Cadence Badge */}
          <span className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-full border ${wpmStatus.color}`}>
            {speechVelocityWpm} WPM • {wpmStatus.label}
          </span>
        </div>
      </CardHeader>

      {/* Real-time Crisis Banner */}
      {crisisAlert && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
            <span>High-risk clinical indicators detected in patient utterance</span>
          </div>
          <span className="font-mono text-xs bg-white text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-bold">
            Severity: {clinicalScore} / 10
          </span>
        </div>
      )}

      {/* Scrolling Utterance List */}
      <CardContent className="p-4 flex-1 overflow-y-auto space-y-2.5 min-h-[220px] max-h-[340px]" ref={scrollRef}>
        {transcriptHistory.length === 0 && !interimText && (
          <div className="h-full flex flex-col items-center justify-center text-[#A1A1AA] py-12 space-y-2">
            <Mic className="w-7 h-7 text-[#0066FF] opacity-60" strokeWidth={1.75} />
            <p className="text-xs text-[#52525B] font-medium">Waiting for spoken audio from patient or clinician...</p>
            <p className="text-[11px] text-[#A1A1AA]">Audio is processed directly on the client for privacy</p>
          </div>
        )}

        {transcriptHistory.map((entry) => {
          const hasTokens = entry.analysis.flaggedTokens.length > 0;
          return (
            <div 
              key={entry.id} 
              className={`p-3 rounded-lg border transition-all text-left ${
                entry.analysis.isCrisisAlert 
                  ? 'bg-rose-50/60 border-rose-200 shadow-sm' 
                  : hasTokens 
                  ? 'bg-amber-50/40 border-amber-200' 
                  : 'bg-[#FAFAFA] border-[#E4E4E7]'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] mb-1">
                <span className="font-semibold text-[#09090B]">
                  {entry.speaker === 'patient' ? 'Patient' : 'Clinician'}
                </span>
                <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>

              <p className="text-xs text-[#09090B] leading-relaxed font-sans">
                {entry.text}
              </p>

              {/* Flagged Tokens Badges */}
              {hasTokens && (
                <div className="mt-2 flex flex-wrap gap-1.5 pt-1.5 border-t border-[#E4E4E7]">
                  {entry.analysis.flaggedTokens.map((token, i) => (
                    <span 
                      key={i}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium border ${
                        token.category === 'suicide_risk' 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : token.category === 'depressive_despair'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
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
          <div className="p-2.5 rounded-lg bg-[#F0F6FF] border border-[#BFDBFE] text-xs italic text-[#0066FF] animate-pulse">
            <span className="font-mono text-[11px] font-semibold text-[#0066FF] mr-2">Speaking:</span>
            {interimText}...
          </div>
        )}
      </CardContent>

      {/* Action Footer */}
      <div className="p-3 bg-[#FAFAFA] border-t border-[#E4E4E7] flex items-center justify-between">
        <span className="text-xs font-mono text-[#71717A]">
          Signal Severity: <strong className="text-[#09090B] font-semibold">{clinicalScore} / 10</strong>
        </span>

        <div className="flex items-center space-x-2">
          {onClear && (
            <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-[#71717A] hover:text-[#09090B] h-7 px-2.5">
              Clear
            </Button>
          )}
          {onSendToSOAP && (
            <Button size="sm" onClick={onSendToSOAP} className="text-xs bg-[#0066FF] hover:bg-[#0052CC] text-white h-7 px-3 font-medium rounded-lg shadow-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} /> Sync to Clinical Notes
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
