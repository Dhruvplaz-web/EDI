'use client'

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SensoryGrounding() {
  const [step, setStep] = useState(0);

  const steps = [
    { count: 5, prompt: "Tap 5 blue shapes on your screen to ground visual awareness.", items: ["Blue Circle", "Teal Square", "Navy Triangle", "Indigo Star", "Cyan Hexagon"] },
    { count: 4, prompt: "Identify 4 physical textures you can feel right now.", items: ["Chair Cushion", "Desk Surface", "Fabric Sleeve", "Floor Surface"] },
    { count: 3, prompt: "Listen closely for 3 ambient sounds around you.", items: ["Fan Hum", "Breathing Rhythm", "Distant Traffic"] },
    { count: 2, prompt: "Acknowledge 2 comforting scents or deep breaths.", items: ["Fresh Air", "Calming Aroma"] },
    { count: 1, prompt: "Recite 1 positive self-affirmation.", items: ["'I am safe and supported in this care session.'"] }
  ];

  const current = steps[step];

  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-teal-600" /> 5-4-3-2-1 Sensory Grounding Task
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Interactive cognitive task to disrupt acute anxiety and panic loops in the waiting room.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
          <div className="text-teal-700 font-bold text-sm">Step {step + 1} of 5: {current.count} Things</div>
          <p className="text-slate-700 font-medium leading-relaxed">{current.prompt}</p>

          <div className="flex flex-wrap gap-2 pt-2">
            {current.items.map((item, idx) => (
              <button
                key={idx}
                className="px-3 py-1.5 bg-white border border-teal-200 text-teal-800 rounded-lg font-mono text-[11px] shadow-sm hover:border-teal-400 active:scale-95 transition-all"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStep((step + 1) % steps.length)}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
          >
            {step === 4 ? 'Restart Grounding Loop' : 'Next Grounding Step →'}
          </Button>

          <span className="text-[10px] text-slate-500 font-mono">Cognitive Bio-Feedback</span>
        </div>
      </CardContent>
    </Card>
  );
}
