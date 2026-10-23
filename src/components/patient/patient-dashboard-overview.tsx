'use client'

import { Activity, Video, Calendar, Wind, FileText, TrendingUp, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { AgenticCbtCompanion } from './agentic-cbt-companion';
import { WearableBiomarkerDashboard } from './wearable-biomarker-dashboard';
import { PredictiveMedicationNudge } from './predictive-medication-nudge';

const moodTrends = [
  { day: 'Mon', stress: 7.2, baseline: 5.0 },
  { day: 'Tue', stress: 6.5, baseline: 5.0 },
  { day: 'Wed', stress: 5.8, baseline: 5.0 },
  { day: 'Thu', stress: 4.6, baseline: 5.0 },
  { day: 'Fri', stress: 3.8, baseline: 5.0 },
  { day: 'Sat', stress: 4.2, baseline: 5.0 },
  { day: 'Sun', stress: 3.4, baseline: 5.0 },
];

interface PatientDashboardOverviewProps {
  onNavigateTab: (tabId: string) => void;
}

export function PatientDashboardOverview({ onNavigateTab }: PatientDashboardOverviewProps) {
  return (
    <div className="space-y-8 font-sans">
      
      <PredictiveMedicationNudge />

      {/* 1. Quick Stats Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Current Stress Index</p>
              <h3 className="text-2xl font-extrabold text-teal-700 dark:text-teal-400 mt-1">3.4 / 10</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mild Baseline Range
              </p>
            </div>
            <div className="p-3 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">PHQ-9 Depression Screener</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">8 / 27</h3>
              <p className="text-[11px] text-slate-500 mt-1">Mild Risk Rating</p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">GAD-7 Anxiety Screener</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">9 / 21</h3>
              <p className="text-[11px] text-slate-500 mt-1">Mild-Moderate Rating</p>
            </div>
            <div className="p-3 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-5 rounded-2xl flex flex-col justify-between">
           <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Upcoming Consult</p>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">Dr. Sarah Jenkins</h3>
              <p className="text-[11px] text-teal-700 font-semibold mt-1">Today @ 10:00 AM</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
           <Button
              onClick={() => onNavigateTab('consultation')}
              className="w-full bg-[#1E1B4B] hover:bg-[#2E2A72] text-white font-semibold text-xs py-2 h-auto rounded-lg shadow-sm"
            >
              <Video className="w-3.5 h-3.5 mr-2" /> Launch Room
            </Button>
        </Card>
      </div>

      {/* 2. New Advanced AI Modules: CBT Agent and Wearables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WearableBiomarkerDashboard />
        <AgenticCbtCompanion />
      </div>

      {/* 3. Main Graph Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-teal-600" /> Weekly Telemetry & Stress Index Curve
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Objective stress telemetry recorded during bio-feedback exercises.
              </CardDescription>
            </div>
            <span className="px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold rounded-full">
              Live Calibration Baseline
            </span>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={moodTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="stress" name="Objective Stress" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#stressGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

    </div>
  );
}
