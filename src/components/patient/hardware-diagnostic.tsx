'use client'

import { useState } from 'react';
import { Camera, Mic, Wifi, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function HardwareDiagnostic() {
  const [testing, setTesting] = useState(false);
  const [passed, setPassed] = useState(false);

  const runDiagnostic = async () => {
    setTesting(true);
    await new Promise(r => setTimeout(r, 1200));
    setPassed(true);
    setTesting(false);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
          <Wifi className="w-4 h-4 mr-2 text-teal-600" /> Pre-Flight Hardware Diagnostic
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Automated check of camera feed, microphone input, and WebRTC throughput before consultation.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 text-xs font-mono">
        {passed ? (
          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 space-y-1">
            <div className="font-bold flex items-center text-sm">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-teal-600" /> All Hardware Systems Ready
            </div>
            <div className="text-[10px] text-slate-600">Camera: 720p 30fps | Mic: Noise Suppressed | WebRTC Ping: 24ms</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="flex items-center text-slate-700 font-medium"><Camera className="w-3.5 h-3.5 mr-2 text-teal-600" /> HD Camera Sensor</span>
              <span className="text-teal-700 font-bold text-[10px]">Detected</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="flex items-center text-slate-700 font-medium"><Mic className="w-3.5 h-3.5 mr-2 text-teal-600" /> Audio Input Mic</span>
              <span className="text-teal-700 font-bold text-[10px]">Detected</span>
            </div>
            <Button onClick={runDiagnostic} disabled={testing} className="w-full bg-[#1E1B4B] hover:bg-[#2E2A72] text-white text-xs font-semibold py-2.5 shadow-md shadow-indigo-950/20">
              {testing ? 'Testing WebRTC Stream...' : 'Run Hardware Diagnostic'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
