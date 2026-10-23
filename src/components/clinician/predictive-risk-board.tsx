"use client"

import { ShieldAlert, TrendingUp, AlertCircle, ArrowUpRight } from "lucide-react"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const riskData = [
  { name: 'Marcus Vance', phq9: 3, discrepancy: 5.2, risk: 95, fill: '#DC2626' },
  { name: 'Elena Rostova', phq9: 21, discrepancy: 5.7, risk: 92, fill: '#DC2626' },
  { name: 'Dr. Arthur Pendelton', phq9: 23, discrepancy: 1.4, risk: 75, fill: '#0066FF' },
  { name: 'Priya Sharma', phq9: 11, discrepancy: 2.1, risk: 65, fill: '#71717A' },
  { name: 'David K. Miller', phq9: 7, discrepancy: 1.2, risk: 40, fill: '#71717A' },
  { name: 'Sofia Morales', phq9: 6, discrepancy: 0.5, risk: 20, fill: '#71717A' },
]

export function PredictiveRiskBoard() {
  return (
    <Card className="bg-white/95 dark:bg-[#121215]/90 border border-[#E4E4E7] dark:border-[#27272A] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_20px_rgba(0,0,0,0.02)] rounded-2xl mb-6 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#E4E4E7] dark:border-[#27272A] p-6">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold text-[#09090B] dark:text-white flex items-center gap-2">
            Clinical Risk Overview
          </CardTitle>
          <CardDescription className="text-xs text-[#71717A]">
            Comparing patient questionnaire answers with objective vocal and facial indicators.
          </CardDescription>
        </div>
        <div className="px-3 py-1 bg-[#F4F4F5] dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] text-[#52525B] dark:text-[#A1A1AA] text-xs font-medium rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
          <span>2 Patients Need Review</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Precise Geometric Scatter Plot */}
        <div className="md:col-span-2 h-64 border border-[#E4E4E7] dark:border-[#27272A] rounded-xl bg-[#FAFAFA] dark:bg-[#18181B]/50 p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[11px] font-medium text-[#71717A] uppercase tracking-wider">
              Self-Report Score vs Observed Difference
            </h4>
            <span className="text-[10px] text-[#A1A1AA]">Hover dot for patient profile</span>
          </div>
          <ResponsiveContainer width="100%" height="85%" minWidth={0} minHeight={0}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
              <XAxis 
                type="number" 
                dataKey="phq9" 
                name="Questionnaire Score" 
                domain={[0, 27]} 
                tick={{fontSize: 10, fill: '#71717A'}} 
                label={{ value: 'Questionnaire Score (0 - 27)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#71717A' }} 
              />
              <YAxis 
                type="number" 
                dataKey="discrepancy" 
                name="Difference Index" 
                domain={[0, 6]} 
                tick={{fontSize: 10, fill: '#71717A'}} 
                label={{ value: 'Observed Difference', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#71717A' }} 
              />
              <ZAxis type="number" dataKey="risk" range={[40, 260]} name="Urgency %" />
              <Tooltip 
                cursor={{ strokeDasharray: '2 2' }} 
                contentStyle={{ 
                  borderRadius: '10px', 
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E4E4E7', 
                  fontSize: '11px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  color: '#09090B'
                }}
              />
              <Scatter name="Patients" data={riskData}>
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={1} stroke="#FFFFFF" />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Clear Natural Language Insights */}
        <div className="space-y-3">
          <div className="p-4 bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#09090B] dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" /> Immediate Review
              </span>
              <span className="text-[10px] text-[#DC2626] font-medium bg-[#FEF2F2] px-2 py-0.5 rounded-full">High Divergence</span>
            </div>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed pt-1">
              <strong>Marcus Vance</strong> reported low symptoms (score 3), but acoustic micro-tremors and facial tension indicate acute distress.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#09090B] dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" /> Speech Slowing
              </span>
              <span className="text-[10px] text-[#0066FF] font-medium bg-[#F0F6FF] px-2 py-0.5 rounded-full">Monotone Pitch</span>
            </div>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed pt-1">
              <strong>Arthur Pendelton</strong> shows reduced vocal variation over the past two weeks, consistent with psychomotor slowing.
            </p>
          </div>
          
          <div className="p-3.5 bg-[#FAFAFA] dark:bg-[#18181B]/50 border border-[#E4E4E7] dark:border-[#27272A] rounded-xl flex items-center justify-between text-xs text-[#52525B] dark:text-[#A1A1AA]">
            <span>Stable Cohort (4 Patients)</span>
            <span className="font-medium text-[#09090B] dark:text-white">Normal Range</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
