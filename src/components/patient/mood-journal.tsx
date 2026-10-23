'use client'

import { useState, useRef, useEffect } from 'react';
import { BookOpen, Calendar, Mic, MicOff, Square, Play, Activity, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AcousticJournalAnalysis {
  pitch: string;
  pitchStatus: string;
  jitter: string;
  jitterStatus: string;
  energy: string;
  detectedMood: string;
  risk: string;
}

export function MoodJournal() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AcousticJournalAnalysis | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    setAudioUrl(null);
    setAnalysisResult(null);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Mock processing and audio URL
    setAudioUrl('mock-audio-url');
    setIsAnalyzing(true);
    
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({
        pitch: '112 Hz',
        pitchStatus: 'Stable',
        jitter: '1.4%',
        jitterStatus: 'Low',
        energy: 'Moderate',
        detectedMood: 'Calm / Grounded',
        risk: 'Low'
      });
    }, 2500);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const entries = [
    { date: 'Aug 07, 2026', mood: 'Calm', score: '3.6/10 Stress', note: 'Completed 4-4-4-4 Box Breathing after tele-consultation.', audio: true },
    { date: 'Jul 24, 2026', mood: 'Anxious', score: '5.2/10 Stress', note: 'Reviewed GAD-7 intake scores with Dr. Sarah.', audio: false },
    { date: 'Jul 10, 2026', mood: 'Elevated', score: '6.8/10 Stress', note: 'Followed care plan prescription directives.', audio: true }
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center"><Mic className="w-4 h-4 mr-2 text-rose-600" /> Real-Time Voice Biomarker Journaling</span>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded-full border border-indigo-200">AI Acoustic Analysis Enabled</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Record your daily journal. Our clinical AI will analyze vocal pitch, jitter, and energy to track your objective mood state.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl space-y-4">
            
            {/* Recording Controls */}
            {!isRecording && !audioUrl && !isAnalyzing && (
              <>
                <button 
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center hover:bg-rose-100 hover:scale-105 transition-all shadow-sm"
                >
                  <Mic className="w-6 h-6" />
                </button>
                <p className="text-xs font-semibold text-slate-600">Tap to start voice journal</p>
              </>
            )}

            {isRecording && (
              <>
                <button 
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-rose-600 text-white border border-rose-700 flex items-center justify-center hover:bg-rose-700 shadow-md shadow-rose-600/30 animate-pulse"
                >
                  <Square className="w-5 h-5" fill="currentColor" />
                </button>
                <div className="flex items-center space-x-2 text-rose-600 font-mono font-bold">
                  <div className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></div>
                  <span>{formatTime(recordingTime)}</span>
                </div>
              </>
            )}

            {/* Analysis State */}
            {isAnalyzing && (
              <div className="flex flex-col items-center space-y-3">
                <Activity className="w-8 h-8 text-teal-600 animate-spin" />
                <p className="text-xs font-semibold text-teal-700">Analyzing acoustic biomarkers...</p>
              </div>
            )}

            {/* Results State */}
            {analysisResult && (
              <div className="w-full space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-3">
                    <button className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100">
                      <Play className="w-4 h-4 ml-1" />
                    </button>
                    <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 w-1/3"></div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">{formatTime(recordingTime)}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">Detected Mood</p>
                    <p className="text-sm font-extrabold text-teal-900 mt-0.5">{analysisResult.detectedMood}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Base Pitch</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">{analysisResult.pitch}</p>
                  </div>
                   <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Speech Jitter</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">{analysisResult.jitter}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">Crisis Risk</p>
                    <p className="text-sm font-extrabold text-indigo-900 mt-0.5">{analysisResult.risk}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="w-full bg-[#1E1B4B] hover:bg-[#2E2A72] text-white text-xs font-semibold shadow-sm">Save Journal Entry</Button>
                  <Button variant="outline" onClick={() => {setAudioUrl(null); setAnalysisResult(null);}} className="text-xs font-semibold">Discard</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
            <BookOpen className="w-4 h-4 mr-2 text-teal-600" /> Past Journal Entries
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {entries.map((item, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-slate-700 border-b border-slate-200 pb-2">
                <span className="flex items-center text-teal-800 font-bold text-xs">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-teal-600" /> {item.date}
                </span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-mono font-bold">{item.score}</span>
              </div>
              <p className="text-slate-700 text-xs font-sans leading-relaxed">{item.note}</p>
              {item.audio && (
                <div className="pt-1">
                   <span className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] rounded-md font-bold">
                     <Activity className="w-3 h-3 mr-1" /> Voice Biomarker Data Saved
                   </span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
