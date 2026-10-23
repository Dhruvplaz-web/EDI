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
  const isHighSeverity = emaStress >= 7.5;
  const isHighJitter = speechJitter >= 2.5;

  return (
    <div className="absolute top-4 right-4 z-30 space-y-2.5 pointer-events-auto max-w-xs font-sans text-left">
      {/* Live Stress Gauge Overlay - Luxury Frosted White Glass */}
      <div className="p-4 rounded-xl border border-[#E4E4E7] bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_20px_rgba(0,0,0,0.02)] transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider font-mono text-[#09090B]">Clinical Severity</span>
          </div>
          <span className={`font-mono font-bold text-lg tabular-nums ${isHighSeverity ? 'text-rose-600' : 'text-[#09090B]'}`}>
            {emaStress.toFixed(1)} <span className="text-xs font-normal text-[#71717A]">/ 10</span>
          </span>
        </div>

        {/* Action Unit Metrics (Kinematic Face) */}
        <div className="mt-3 pt-2.5 border-t border-[#F4F4F5] grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <span className="text-[#71717A]">Brow furrow:</span>
            <span className="ml-1 text-[#09090B] font-semibold">{(au4BrowDown * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-[#71717A]">Lip depressor:</span>
            <span className="ml-1 text-[#09090B] font-semibold">{(au15MouthFrown * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Vocal Acoustic Metrics (Microphone DSP) */}
        <div className="mt-2.5 pt-2 border-t border-[#F4F4F5] grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <span className="text-[#71717A] flex items-center">
              <Mic className="w-3 h-3 mr-1 text-[#0066FF]" strokeWidth={1.75} /> Jitter:
            </span>
            <span className={`ml-1 font-semibold ${isHighJitter ? 'text-rose-600' : 'text-[#09090B]'}`}>
              {speechJitter.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-[#71717A] flex items-center">
              <Volume2 className="w-3 h-3 mr-1 text-[#0066FF]" strokeWidth={1.75} /> Pitch:
            </span>
            <span className="ml-1 text-[#09090B] font-semibold">
              {isVoiced && pitchHz > 0 ? `${pitchHz.toFixed(0)} Hz` : 'Quiet'}
            </span>
          </div>
        </div>

        {/* Dynamic Multimodal Cross-Attention Distribution */}
        {attentionWeights && (
          <div className="mt-2.5 pt-2 border-t border-[#F4F4F5] text-[11px] font-mono space-y-1.5">
            <div className="flex justify-between text-[#71717A]">
              <span className="flex items-center">
                <Brain className="w-3 h-3 mr-1 text-[#0066FF]" strokeWidth={1.75} /> Signal Influence:
              </span>
              <span className="text-[#0066FF] font-semibold">Active</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center font-medium">
              <div className="bg-[#F8F9FA] py-1.5 px-1 rounded border border-[#E4E4E7]">
                <span className="text-[#71717A] text-[9px] block">Voice</span>
                <span className="text-[#09090B] font-semibold">{(attentionWeights.acoustic * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-[#F8F9FA] py-1.5 px-1 rounded border border-[#E4E4E7]">
                <span className="text-[#71717A] text-[9px] block">Face</span>
                <span className="text-[#0066FF] font-semibold">{(attentionWeights.visual * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-[#F8F9FA] py-1.5 px-1 rounded border border-[#E4E4E7]">
                <span className="text-[#71717A] text-[9px] block">Words</span>
                <span className="text-[#09090B] font-semibold">{(attentionWeights.linguistic * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Flat Affect Warning Badge */}
        {isFlatAffect && (
          <div className="mt-2.5 px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700 flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-rose-600 shrink-0" strokeWidth={1.75} />
            Flat emotional expression detected
          </div>
        )}
      </div>

      {/* Cross-Modal Discrepancy Alert Badge - Crisp Minimal Alert */}
      {isAlertActive && (
        <div className="p-3 bg-white border border-rose-300 rounded-xl text-[#09090B] backdrop-blur-md shadow-[0_2px_8px_rgba(244,63,94,0.08)]">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div>
              <div className="text-xs font-semibold text-rose-700">Observed Discrepancy Alert</div>
              <div className="text-[11px] text-[#52525B] mt-0.5">
                Verbal response contrasts with physical indicators (Gap: <span className="font-mono font-bold text-[#09090B]">{discrepancy.toFixed(1)}</span>)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edge Compute Health Badge */}
      <div className="px-3 py-1.5 bg-white/95 border border-[#E4E4E7] rounded-lg text-[11px] text-[#71717A] backdrop-blur-md flex items-center justify-between font-mono shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <span className="flex items-center">
          <Cpu className="w-3 h-3 mr-1 text-[#0066FF] inline" strokeWidth={1.75} /> Local Signal Engine
        </span>
        <span className="text-[#0066FF] font-semibold">Live</span>
      </div>
    </div>
  );
}
