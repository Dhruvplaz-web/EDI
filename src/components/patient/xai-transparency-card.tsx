'use client'

import { ShieldCheck, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function XAITransparencyCard() {
  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
          <ShieldCheck className="w-4 h-4 mr-2 text-teal-600" /> Explainable AI (XAI) Privacy & Transparency Guarantee
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          How your 10-second baseline calibration and live stress readings work during tele-consultation.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 text-xs text-slate-700">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-[11px] shadow-sm">
          <div className="text-teal-700 font-bold flex items-center">
            <Info className="w-3.5 h-3.5 mr-1.5" /> Zero Video File Storage
          </div>
          <p className="text-slate-600 font-sans leading-relaxed">
            Raw video feeds never leave your browser. All 468-landmark computer vision processes run 100% locally inside WebWorker memory.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-[11px] shadow-sm">
          <div className="text-teal-700 font-bold flex items-center">
            <Info className="w-3.5 h-3.5 mr-1.5" /> Baseline Calibration
          </div>
          <p className="text-slate-600 font-sans leading-relaxed">
            Your initial neutral expression calibration sets your personal baseline (μ_base), ensuring stress scores measure relative changes rather than resting facial features.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
