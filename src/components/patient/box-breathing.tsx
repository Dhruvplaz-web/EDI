'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wind, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function BoxBreathing() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Hold (Rest)'>('Inhale');

  useEffect(() => {
    if (!isActive) return;

    const phases: Array<'Inhale' | 'Hold' | 'Exhale' | 'Hold (Rest)'> = ['Inhale', 'Hold', 'Exhale', 'Hold (Rest)'];
    let idx = 0;

    const interval = setInterval(() => {
      idx = (idx + 1) % phases.length;
      setPhase(phases[idx]);
    }, 4000); // 4-4-4-4 bio-feedback rhythm

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
          <Wind className="w-4 h-4 mr-2 text-teal-600" /> Bio-Feedback Box Breathing (4-4-4-4)
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Mindful waiting room exercise designed to reduce pre-consultation autonomic arousal.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center py-6 space-y-6">
        {/* Expanding/Contracting Animated Shape - Royal Indigo-to-Teal Ring */}
        <div className="w-40 h-40 flex items-center justify-center relative bg-slate-50 rounded-full border border-slate-200/60 shadow-inner">
          <motion.div
            animate={{
              scale: phase === 'Inhale' ? 1.35 : phase === 'Exhale' ? 0.75 : 1.1,
              opacity: phase === 'Inhale' ? 1.0 : 0.75
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#1E1B4B] via-[#0D9488] to-teal-400 shadow-xl shadow-teal-500/30 flex items-center justify-center text-white font-mono text-xs font-bold text-center px-2"
          >
            {isActive ? phase : 'Ready'}
          </motion.div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsActive(!isActive)}
          className="bg-[#1E1B4B] hover:bg-[#2E2A72] text-white font-semibold text-xs px-6 py-2.5 shadow-md shadow-indigo-950/20"
        >
          {isActive ? <Pause className="w-3.5 h-3.5 mr-1.5" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
          {isActive ? 'Pause Exercise' : 'Start 4-4-4-4 Box Breathing'}
        </Button>
      </CardContent>
    </Card>
  );
}
