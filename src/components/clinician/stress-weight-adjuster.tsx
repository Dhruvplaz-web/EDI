'use client'

import { useState } from 'react';
import { Sliders, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StressWeightAdjusterProps {
  onWeightsChange: (weights: { alpha: number; beta: number }) => void;
}

export function StressWeightAdjuster({ onWeightsChange }: StressWeightAdjusterProps) {
  const [alpha, setAlpha] = useState(0.6);
  const [beta, setBeta] = useState(0.4);

  const handleAlphaChange = (val: number) => {
    setAlpha(val);
    onWeightsChange({ alpha: val, beta });
  };

  const handleBetaChange = (val: number) => {
    setBeta(val);
    onWeightsChange({ alpha, beta: val });
  };

  const handleReset = () => {
    setAlpha(0.6);
    setBeta(0.4);
    onWeightsChange({ alpha: 0.6, beta: 0.4 });
  };

  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
            <Sliders className="w-4 h-4 mr-2 text-teal-600" /> Dynamic Stress Weight Adjuster
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-slate-500 hover:text-slate-900">
            <RefreshCcw className="w-3 h-3 mr-1" /> Reset Standard
          </Button>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Calibrate blendshape weights for patients with facial paralysis, asymmetry, or tics.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-xs font-mono">
        <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex justify-between text-slate-700 font-bold">
            <span>AU4 Eyebrow Weight (α):</span>
            <span className="text-teal-700">{(alpha * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={alpha}
            onChange={(e) => handleAlphaChange(parseFloat(e.target.value))}
            className="w-full accent-teal-600 bg-slate-200"
          />
        </div>

        <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex justify-between text-slate-700 font-bold">
            <span>AU15 Mouth Tension Weight (β):</span>
            <span className="text-teal-700">{(beta * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={beta}
            onChange={(e) => handleBetaChange(parseFloat(e.target.value))}
            className="w-full accent-teal-600 bg-slate-200"
          />
        </div>
      </CardContent>
    </Card>
  );
}
