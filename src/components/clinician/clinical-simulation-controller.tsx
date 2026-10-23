'use client'

import React from 'react';
import { Play, Sparkles, CheckCircle2, ShieldAlert, Activity, HeartCrack } from 'lucide-react';

export type SimulationScenarioId = 'calm' | 'masked' | 'blunted' | 'crisis';

export interface SimulationTelemetryProfile {
  id: SimulationScenarioId;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  au4BrowDown: number;
  au15MouthFrown: number;
  pitchHz: number;
  jitterPercent: number;
  shimmerPercent: number;
  pitchVariance: number;
  isFlatAffect: boolean;
  isVoiced: boolean;
  speechVelocityWpm: number;
  linguisticSeverity: number;
  sentimentPolarity: number;
  crisisAlert: boolean;
  samplePhrase: string;
  subjectiveScore: number;
  flaggedTokens: string[];
}

export const SIMULATION_SCENARIOS: Record<SimulationScenarioId, SimulationTelemetryProfile> = {
  calm: {
    id: 'calm',
    name: 'Calm Baseline',
    badge: 'Euthymic (F00)',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Relaxed facial geometry, normal vocal jitter (< 1.0%), congruent positive sentiment.',
    au4BrowDown: 0.05,
    au15MouthFrown: 0.08,
    pitchHz: 128.5,
    jitterPercent: 0.65,
    shimmerPercent: 1.85,
    pitchVariance: 38.0,
    isFlatAffect: false,
    isVoiced: true,
    speechVelocityWpm: 135,
    linguisticSeverity: 1.5,
    sentimentPolarity: 0.6,
    crisisAlert: false,
    samplePhrase: "I've been sleeping 7 hours each night and doing the 4-4-4-4 box breathing exercises regularly.",
    subjectiveScore: 2.5,
    flaggedTokens: []
  },
  masked: {
    id: 'masked',
    name: 'Masked Incongruence',
    badge: 'Symptom Masking (High D)',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Smiling verbal self-report masking elevated AU15 lip depressor and vocal micro-tremor.',
    au4BrowDown: 0.68,
    au15MouthFrown: 0.78,
    pitchHz: 192.0,
    jitterPercent: 3.45,
    shimmerPercent: 7.20,
    pitchVariance: 24.5,
    isFlatAffect: false,
    isVoiced: true,
    speechVelocityWpm: 110,
    linguisticSeverity: 2.0,
    sentimentPolarity: 0.45,
    crisisAlert: false,
    samplePhrase: "Everything is totally fine doctor, I'm smiling, really nothing is wrong at work or home.",
    subjectiveScore: 2.0,
    flaggedTokens: ['fine', 'nothing is wrong']
  },
  blunted: {
    id: 'blunted',
    name: 'Psychomotor Blunting',
    badge: 'Flat Affect (F32.2)',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Hypomimia, acoustic pitch variance < 10 Hz, slow monotonic speech velocity (< 70 WPM).',
    au4BrowDown: 0.12,
    au15MouthFrown: 0.22,
    pitchHz: 102.0,
    jitterPercent: 1.15,
    shimmerPercent: 3.10,
    pitchVariance: 7.8,
    isFlatAffect: true,
    isVoiced: true,
    speechVelocityWpm: 62,
    linguisticSeverity: 7.5,
    sentimentPolarity: -0.65,
    crisisAlert: false,
    samplePhrase: "It doesn't... really matter anymore... just exhausted all day... can't feel much of anything.",
    subjectiveScore: 8.5,
    flaggedTokens: ['exhausted', 'matter']
  },
  crisis: {
    id: 'crisis',
    name: 'Acute Crisis',
    badge: 'Emergency Triage',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Sustained AU4 brow furrow, acoustic pitch instability, overt suicidal ideation markers.',
    au4BrowDown: 0.92,
    au15MouthFrown: 0.88,
    pitchHz: 255.0,
    jitterPercent: 4.80,
    shimmerPercent: 9.60,
    pitchVariance: 58.0,
    isFlatAffect: false,
    isVoiced: true,
    speechVelocityWpm: 145,
    linguisticSeverity: 9.5,
    sentimentPolarity: -0.92,
    crisisAlert: true,
    samplePhrase: "I can't take this pain anymore, everyone would genuinely be better off without me here.",
    subjectiveScore: 9.8,
    flaggedTokens: ['cannot take this pain', 'better off without me']
  }
};

interface ClinicalSimulationControllerProps {
  isSimulating: boolean;
  onToggleSimulating: (active: boolean) => void;
  activeScenario: SimulationScenarioId;
  onSelectScenario: (id: SimulationScenarioId) => void;
}

export function ClinicalSimulationController({
  isSimulating,
  onToggleSimulating,
  activeScenario,
  onSelectScenario
}: ClinicalSimulationControllerProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#E4E4E7] rounded-xl p-4 text-[#09090B] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 text-left">
          <div className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
          <div>
            <h4 className="text-xs font-semibold tracking-tight text-[#09090B] flex items-center gap-1.5 uppercase font-mono">
              <Activity className="w-3.5 h-3.5 text-[#0066FF]" strokeWidth={1.75} />
              Clinical Presentation Simulator
            </h4>
            <p className="text-[11px] text-[#71717A]">
              Test signal detection and cross-modal discrepancy across standardized clinical profiles.
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggleSimulating(!isSimulating)}
          className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 shadow-sm shrink-0 ${
            isSimulating
              ? 'bg-[#0066FF] hover:bg-[#0052CC] text-white'
              : 'border border-[#E4E4E7] bg-white text-[#27272A] hover:bg-[#F4F4F5]'
          }`}
        >
          {isSimulating ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> Simulation Running
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" strokeWidth={1.75} /> Start Simulation Test
            </>
          )}
        </button>
      </div>

      {isSimulating && (
        <div className="mt-3 pt-3 border-t border-[#F4F4F5] text-left">
          <div className="text-[11px] text-[#71717A] mb-2 flex items-center justify-between">
            <span>Select a presentation profile to test signal analysis:</span>
            <span className="font-mono text-[#0066FF] text-[10px] font-semibold">Active Model: Multimodal Fusion</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {(Object.keys(SIMULATION_SCENARIOS) as SimulationScenarioId[]).map((scenarioKey) => {
              const sc = SIMULATION_SCENARIOS[scenarioKey];
              const isSelected = activeScenario === scenarioKey;

              return (
                <button
                  key={scenarioKey}
                  onClick={() => onSelectScenario(scenarioKey)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-[#F0F6FF] border-[#0066FF] ring-1 ring-[#0066FF]/30 shadow-sm'
                      : 'bg-[#FAFAFA] border-[#E4E4E7] hover:border-[#A1A1AA] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#09090B] flex items-center gap-1.5">
                      {sc.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-medium border bg-white border-[#E4E4E7] text-[#52525B]">
                      {sc.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#71717A] line-clamp-2 leading-relaxed">
                    {sc.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-3 p-2.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-[#52525B] gap-1">
            <span className="text-[#09090B] font-medium truncate mr-2">
              Patient Utterance: &ldquo;{SIMULATION_SCENARIOS[activeScenario].samplePhrase}&rdquo;
            </span>
            <span className="text-[#71717A] shrink-0 text-[11px]">
              AU4: {SIMULATION_SCENARIOS[activeScenario].au4BrowDown} • Jitter: {SIMULATION_SCENARIOS[activeScenario].jitterPercent}% • {SIMULATION_SCENARIOS[activeScenario].speechVelocityWpm} WPM
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
