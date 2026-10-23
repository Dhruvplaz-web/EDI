'use client'

import { useState } from 'react';
import { Pill, AlertCircle, CheckCircle2, BrainCircuit, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PredictiveMedicationNudge() {
  const [isVisible, setIsVisible] = useState(true);
  const [taken, setTaken] = useState(false);

  if (!isVisible) return null;

  return (
    <Card className={`border ${taken ? 'border-teal-200 bg-teal-50/50' : 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50'} shadow-sm transition-all duration-500 overflow-hidden`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-full flex-shrink-0 ${taken ? 'bg-teal-100 text-teal-600' : 'bg-indigo-100 text-indigo-600 animate-pulse'}`}>
              {taken ? <CheckCircle2 className="w-6 h-6" /> : <Pill className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-sm font-bold ${taken ? 'text-teal-900' : 'text-indigo-900'}`}>
                  {taken ? 'Medication Logged' : 'Time for Escitalopram (10mg)'}
                </h3>
                {!taken && (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] uppercase tracking-wider font-bold rounded-full flex items-center">
                    <BrainCircuit className="w-3 h-3 mr-1" /> AI Nudge
                  </span>
                )}
              </div>
              <p className={`text-xs ${taken ? 'text-teal-700' : 'text-indigo-700'}`}>
                {taken 
                  ? "Great job! Adherence strengthens your baseline stability." 
                  : "Based on your routine patterns, you usually take your dose around this time. Consistent timing improves efficacy."}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!taken ? (
              <>
                <Button 
                  onClick={() => setTaken(true)} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md text-xs font-semibold px-4 flex-1 sm:flex-none"
                >
                  Log Dose
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsVisible(false)}
                  className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100/50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsVisible(false)}
                className="text-teal-400 hover:text-teal-600 hover:bg-teal-100/50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
