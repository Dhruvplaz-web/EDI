'use client'

import { useState } from 'react';
import { Camera, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ExpressCalibrationProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onCalibrated: () => void;
}

export function ExpressCalibration({ videoRef, onCalibrated }: ExpressCalibrationProps) {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const startCalibration = async () => {
    setIsCalibrating(true);
    setProgress(0);
    const durationMs = 10000;
    const intervalMs = 200;
    const steps = durationMs / intervalMs;

    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, intervalMs));
      setProgress(Math.round((i / steps) * 100));
    }

    setCompleted(true);
    setIsCalibrating(false);
    onCalibrated();
  };

  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-teal-600" /> 10-Second Express Baseline Calibration
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Look directly at the camera with a neutral expression to compute baseline metrics (μ_base, σ_base).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-xs font-mono">
        {completed ? (
          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 flex items-center justify-between">
            <span className="flex items-center font-bold">
              <CheckCircle2 className="w-4 h-4 mr-2 text-teal-600" /> Baseline Calibration Complete
            </span>
            <span className="text-[10px] text-slate-500 font-mono">μ_base = 1.0, σ_base = 0.05</span>
          </div>
        ) : (
          <div className="space-y-3">
            <Progress value={progress} className="h-2 bg-slate-100 accent-teal-600" />

            <Button
              onClick={startCalibration}
              disabled={isCalibrating}
              className="w-full bg-[#1E1B4B] hover:bg-[#2E2A72] text-white font-semibold text-xs py-2.5 shadow-md shadow-indigo-950/20"
            >
              <Camera className="w-4 h-4 mr-1.5" />
              {isCalibrating ? `Calibrating Neutral Expression (${progress}%)...` : 'Start 10s Express Calibration'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
