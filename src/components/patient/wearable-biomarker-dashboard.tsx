"use client"

import { useState } from "react"
import { Activity, Heart, Moon, Sun, TrendingUp, Zap } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const healthData = [
  { time: '06:00', hrv: 45, sleep: 0, mood: 6 },
  { time: '09:00', hrv: 52, sleep: 0, mood: 7 },
  { time: '12:00', hrv: 68, sleep: 0, mood: 8 },
  { time: '15:00', hrv: 61, sleep: 0, mood: 7 },
  { time: '18:00', hrv: 42, sleep: 0, mood: 5 },
  { time: '21:00', hrv: 38, sleep: 0, mood: 4 },
  { time: '00:00', hrv: 55, sleep: 1, mood: 5 },
]

export function WearableBiomarkerDashboard() {
  const [activeTab, setActiveTab] = useState<'hrv' | 'mood'>('hrv')

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Biometric Sync
          </h3>
          <p className="text-xs text-slate-500">Apple Watch Series 8 connected</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('hrv')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'hrv' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            HRV & Stress
          </button>
          <button 
            onClick={() => setActiveTab('mood')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'mood' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Mood Correlate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Heart className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Avg HRV</span>
          </div>
          <div className="text-2xl font-bold text-indigo-900">54<span className="text-sm font-normal text-indigo-600 ml-1">ms</span></div>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <Moon className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Deep Sleep</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900">2<span className="text-sm font-normal text-emerald-600 ml-1">h</span> 14<span className="text-sm font-normal text-emerald-600 ml-1">m</span></div>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Stress Peaks</span>
          </div>
          <div className="text-2xl font-bold text-amber-900">3<span className="text-sm font-normal text-amber-600 ml-1">today</span></div>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          {activeTab === 'hrv' ? (
            <AreaChart data={healthData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHrv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                labelStyle={{ fontSize: '10px', color: '#64748b' }}
              />
              <Area type="monotone" dataKey="hrv" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorHrv)" />
            </AreaChart>
          ) : (
             <LineChart data={healthData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 10]} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 600, color: '#0ea5e9' }}
                labelStyle={{ fontSize: '10px', color: '#64748b' }}
              />
              <Line type="monotone" dataKey="mood" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-3">
        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md mt-0.5">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-slate-800">AI Insight</h4>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">Your HRV dropped significantly at 18:00, correlating with a lower reported mood (5/10). We noticed a pattern of evening stress. Consider scheduling a 5-minute Box Breathing session at 17:30.</p>
        </div>
      </div>
    </div>
  )
}
