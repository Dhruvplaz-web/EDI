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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-white shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
          <h4 className="text-xs font-bold tracking-wide uppercase text-slate-200 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            Examiner Defense Simulator (DAIC-WOZ Benchmark Suite)
          </h4>
          <span className="text-[10px] bg-slate-800 text-teal-300 font-mono px-2 py-0.5 rounded border border-slate-700">
            Zero-Token Local DSP
          </span>
        </div>

        <button
          onClick={() => onToggleSimulating(!isSimulating)}
          className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
            isSimulating
              ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          {isSimulating ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> Simulation Stream Active
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" /> Launch Examiner Defense Simulator
            </>
          )}
        </button>
      </div>

      {isSimulating && (
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
            <span>Select Clinical Presentation Scenario to stream into Cross-Attention Engine:</span>
            <span className="font-mono text-teal-400 text-[10px]">Deterministic DSP Math Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {(Object.keys(SIMULATION_SCENARIOS) as SimulationScenarioId[]).map((scenarioKey) => {
              const sc = SIMULATION_SCENARIOS[scenarioKey];
              const isSelected = activeScenario === scenarioKey;

              return (
                <button
                  key={scenarioKey}
                  onClick={() => onSelectScenario(scenarioKey)}
                  className={`text-left p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-teal-400 shadow-md ring-1 ring-teal-400/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                      {scenarioKey === 'crisis' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                      {scenarioKey === 'masked' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                      {scenarioKey === 'blunted' && <HeartCrack className="w-3.5 h-3.5 text-indigo-400" />}
                      {sc.name}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold border ${sc.badgeColor}`}>
                      {sc.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    {sc.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 p-2 bg-slate-950/80 border border-slate-800/90 rounded-lg flex items-center justify-between text-[11px] font-mono text-slate-300">
            <span className="text-teal-400 font-semibold truncate mr-2">
              Patient Utterance: &ldquo;{SIMULATION_SCENARIOS[activeScenario].samplePhrase}&rdquo;
            </span>
            <span className="text-slate-500 shrink-0 text-[10px]">
              AU4: {SIMULATION_SCENARIOS[activeScenario].au4BrowDown} • Jitter: {SIMULATION_SCENARIOS[activeScenario].jitterPercent}% • {SIMULATION_SCENARIOS[activeScenario].speechVelocityWpm} WPM
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
