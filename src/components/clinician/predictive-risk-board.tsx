"use client"

import { useState } from "react"
import { ShieldAlert, TrendingUp, AlertTriangle, Activity } from "lucide-react"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const riskData = [
  { name: 'Marcus Vance', phq9: 3, discrepancy: 5.2, risk: 95, fill: '#ef4444' }, // Manic, low PHQ9 but high discrepancy
  { name: 'Elena Rostova', phq9: 21, discrepancy: 5.7, risk: 92, fill: '#ef4444' }, // High PHQ9, High discrepancy (PTSD)
  { name: 'Dr. Arthur Pendelton', phq9: 23, discrepancy: 1.4, risk: 75, fill: '#f59e0b' },
  { name: 'Priya Sharma', phq9: 11, discrepancy: 2.1, risk: 65, fill: '#f59e0b' },
  { name: 'David K. Miller', phq9: 7, discrepancy: 1.2, risk: 40, fill: '#0d9488' },
  { name: 'Sofia Morales', phq9: 6, discrepancy: 0.5, risk: 20, fill: '#0d9488' },
]

export function PredictiveRiskBoard() {
  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
            <ShieldAlert className="w-4 h-4 mr-2 text-rose-600" /> Multimodal Predictive Risk Stratification
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            30-day algorithmic deterioration forecasting based on acoustic-kinematic discrepancy D(t).
          </CardDescription>
        </div>
        <div className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-mono font-bold rounded-full flex items-center">
          <Activity className="w-3 h-3 mr-1 animate-pulse" /> 2 Critical Alerts
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scatter Plot */}
        <div className="md:col-span-2 h-64 border border-slate-100 rounded-xl bg-slate-50/50 p-4">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 font-mono text-center">
            Self-Reported Depression (PHQ-9) vs Objective Biomarker Discrepancy D(t)
          </h4>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" dataKey="phq9" name="PHQ-9" domain={[0, 27]} tick={{fontSize: 10}} label={{ value: 'Self-Reported PHQ-9', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }} />
              <YAxis type="number" dataKey="discrepancy" name="D(t)" domain={[0, 6]} tick={{fontSize: 10}} label={{ value: 'Discrepancy Index D(t)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
              <ZAxis type="number" dataKey="risk" range={[50, 400]} name="30-Day Risk %" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Scatter name="Patients" data={riskData}>
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Metrics */}
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <h4 className="text-xs font-bold text-rose-800 flex items-center mb-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Immediate Action Required
            </h4>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              <strong>Marcus Vance</strong> shows a 95% 30-day decompensation risk. Very low PHQ-9 (3) but extremely high objective discrepancy (5.2). <br/><em>Indicates severe lack of manic insight.</em>
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <h4 className="text-xs font-bold text-amber-800 flex items-center mb-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Rising Trajectory
            </h4>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              <strong>Dr. Arthur Pendelton</strong> trajectory worsening. Speech jitter collapsed to 0.8%, indicating severe psychomotor retardation over the last 14 days.
            </p>
          </div>
          
           <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl">
            <h4 className="text-xs font-bold text-teal-800 flex items-center mb-1">
              <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Stable Cohort
            </h4>
            <p className="text-[11px] text-teal-700 leading-relaxed">
              2 patients in standard baseline. D(t) indices below 1.5 threshold. 
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
