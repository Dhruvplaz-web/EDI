'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface BiomarkerAnalyticsProps {
  historicalData?: Array<{
    date: string;
    objectiveStress: number;
    subjectiveReport: number;
    blinkRate: number;
  }>;
}

const defaultData = [
  { date: 'Visit 1 (May 10)', objectiveStress: 7.8, subjectiveReport: 8.0, blinkRate: 18 },
  { date: 'Visit 2 (May 24)', objectiveStress: 6.5, subjectiveReport: 7.0, blinkRate: 15 },
  { date: 'Visit 3 (Jun 07)', objectiveStress: 5.2, subjectiveReport: 6.0, blinkRate: 12 },
  { date: 'Visit 4 (Jun 21)', objectiveStress: 4.8, subjectiveReport: 5.0, blinkRate: 10 },
  { date: 'Today (Aug 07)', objectiveStress: 3.6, subjectiveReport: 4.0, blinkRate: 8 },
];

export function BiomarkerAnalytics({ historicalData = defaultData }: BiomarkerAnalyticsProps) {
  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2 text-teal-600" /> Longitudinal Biomarker Analytics & Trends
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Historical trendlines comparing objective stress index, self-reports, and blink frequency.
        </CardDescription>
      </CardHeader>

      <CardContent className="h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <LineChart data={historicalData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
            <YAxis stroke="#64748b" fontSize={10} domain={[0, 10]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
            <Line type="monotone" dataKey="objectiveStress" name="Objective Stress (O_bar)" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="subjectiveReport" name="Self-Report (S)" stroke="#1e1b4b" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
