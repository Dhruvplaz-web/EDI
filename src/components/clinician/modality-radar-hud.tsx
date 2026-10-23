'use client'

import { AlertTriangle, Activity, Cpu, Mic, Volume2, Sparkles, Brain } from 'lucide-react';

interface ModalityRadarHUDProps {
  rawStress: number;
  emaStress: number;
  discrepancy: number;
  isAlertActive: boolean;
  au4BrowDown: number;
  au15MouthFrown: number;
  speechJitter?: number;
  pitchHz?: number;
  pitchVariance?: number;
  isFlatAffect?: boolean;
  isVoiced?: boolean;
  attentionWeights?: {
    visual: number;
    acoustic: number;
    linguistic: number;
  };
}

export function ModalityRadarHUD({
  rawStress,
  emaStress,
  discrepancy,
  isAlertActive,
  au4BrowDown,
  au15MouthFrown,
  speechJitter = 0.8,
  pitchHz = 0,
  pitchVariance = 42,
  isFlatAffect = false,
  isVoiced = false,
  attentionWeights = { visual: 0.33, acoustic: 0.34, linguistic: 0.33 }
}: ModalityRadarHUDProps) {
  const getStressColor = (score: number) => {
    if (score >= 7.5) return 'text-rose-700 bg-rose-50 border-rose-200 shadow-rose-200/50';
    if (score >= 4.5) return 'text-amber-700 bg-amber-50 border-amber-200 shadow-amber-200/50';
    return 'text-teal-700 bg-teal-50 border-teal-200 shadow-teal-200/50';
  };

  const getJitterColor = (jitter: number) => {
    if (jitter >= 3.0) return 'text-rose-600 font-bold';
    if (jitter >= 1.8) return 'text-amber-600 font-bold';
    return 'text-teal-700 font-semibold';
  };

  return (
    <div className="absolute top-4 right-4 z-30 space-y-2 pointer-events-auto max-w-xs font-sans">
      {/* Live Stress Gauge Overlay - Frosted White Glass */}
      <div className={`p-4 rounded-2xl border backdrop-blur-xl shadow-xl transition-all ${getStressColor(emaStress)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 animate-pulse text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Objective Severity</span>
          </div>
          <span className="font-mono font-extrabold text-xl text-slate-900">{emaStress.toFixed(1)} / 10</span>
        </div>

        {/* Action Unit Metrics (Kinematic Face) */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div>
            <span className="text-slate-500">AU4 BrowDown:</span>
            <span className="ml-1 text-slate-900 font-bold">{(au4BrowDown * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-500">AU15 Frown:</span>
            <span className="ml-1 text-slate-900 font-bold">{(au15MouthFrown * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Vocal Acoustic Metrics (Microphone DSP) */}
        <div className="mt-2.5 pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div>
            <span className="text-slate-500 flex items-center">
              <Mic className="w-3 h-3 mr-1 text-teal-600" /> Jitter:
            </span>
            <span className={`ml-1 ${getJitterColor(speechJitter)}`}>
              {speechJitter.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-slate-500 flex items-center">
              <Volume2 className="w-3 h-3 mr-1 text-teal-600" /> Pitch (F0):
            </span>
            <span className="ml-1 text-slate-900 font-bold">
              {isVoiced && pitchHz > 0 ? `${pitchHz.toFixed(0)} Hz` : 'Silent'}
            </span>
          </div>
        </div>

        {/* Dynamic Multimodal Cross-Attention Distribution */}
        {attentionWeights && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] font-mono space-y-1">
            <div className="flex justify-between text-slate-500 font-medium">
              <span className="flex items-center">
                <Brain className="w-3 h-3 mr-1 text-teal-600" /> Cross-Attention:
              </span>
              <span className="text-teal-700 font-bold">Q·Kᵀ/d Tensor</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center font-bold">
              <div className="bg-slate-100/90 py-1 px-0.5 rounded-lg border border-slate-200/60">
                <span className="text-slate-500 text-[8.5px] block font-normal">Voice</span>
                <span className="text-teal-700 font-extrabold">{(attentionWeights.acoustic * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-slate-100/90 py-1 px-0.5 rounded-lg border border-slate-200/60">
                <span className="text-slate-500 text-[8.5px] block font-normal">Face</span>
                <span className="text-blue-700 font-extrabold">{(attentionWeights.visual * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-slate-100/90 py-1 px-0.5 rounded-lg border border-slate-200/60">
                <span className="text-slate-500 text-[8.5px] block font-normal">Text</span>
                <span className="text-indigo-700 font-extrabold">{(attentionWeights.linguistic * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Flat Affect Warning Badge */}
        {isFlatAffect && (
          <div className="mt-2.5 px-2 py-1 bg-rose-100 border border-rose-300 rounded-lg text-[10px] font-semibold text-rose-800 flex items-center">
            <AlertTriangle className="w-3 h-3 mr-1 text-rose-600 shrink-0" />
            Prosodic Blunting / Flat Affect Detected
          </div>
        )}
      </div>

      {/* Cross-Modal Discrepancy Alert Badge - Royal Amber / Gold Glow */}
      {isAlertActive && (
        <div className="p-3.5 bg-white border-2 border-amber-500 rounded-2xl text-slate-900 backdrop-blur-xl shadow-2xl shadow-amber-500/20 animate-bounce">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-900">Cross-Modal Incongruence Alert!</div>
              <div className="text-[10px] text-slate-600">
                Self-Report vs Involuntary Biomarkers = <span className="font-mono font-bold text-amber-700">{discrepancy.toFixed(1)}</span> (&gt; 3.5 for 10s)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edge Compute Health Badge */}
      <div className="px-3.5 py-2 bg-white/90 border border-slate-200/80 rounded-xl text-[10px] text-slate-600 backdrop-blur-md flex items-center justify-between font-mono shadow-sm">
        <span className="flex items-center">
          <Cpu className="w-3.5 h-3.5 mr-1.5 text-teal-600 inline" /> Edge Attention Engine
        </span>
        <span className="text-teal-700 font-semibold">Zero Cloud Latency</span>
      </div>
    </div>
  );
}
