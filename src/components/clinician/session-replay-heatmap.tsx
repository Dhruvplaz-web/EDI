"use client"

import { useState } from "react"
import { Play, Pause, SkipBack, SkipForward, Maximize2, AlertTriangle, Video, Search } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const heatmapData = [
  { time: '00:00', stress: 3, label: 'Baseline' },
  { time: '05:00', stress: 4, label: 'Greeting' },
  { time: '10:00', stress: 3.5, label: 'Small Talk' },
  { time: '15:00', stress: 6, label: 'Mentioned Family' },
  { time: '20:00', stress: 9.2, label: 'Trauma Recall' },
  { time: '22:00', stress: 9.8, label: 'Dissociation Peak' },
  { time: '25:00', stress: 7, label: 'Grounding Exercise' },
  { time: '30:00', stress: 5, label: 'Recovery' },
  { time: '35:00', stress: 4, label: 'Action Plan' },
  { time: '40:00', stress: 3.5, label: 'Closing' },
]

export function SessionReplayHeatmap() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState('00:00')

  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
            <Video className="w-4 h-4 mr-2 text-indigo-600" /> Session Replay & Emotional Heatmap
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Review recorded sessions synchronized with autonomic stress telemetry.
          </CardDescription>
        </div>
        <div className="flex gap-2">
           <Button size="sm" variant="outline" className="h-7 text-[10px] bg-slate-50">
            <Search className="w-3 h-3 mr-1" /> Find Peaks
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {/* Mock Video Player Area */}
        <div className="relative w-full h-64 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner group">
           <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center"></div>
           
           {!isPlaying && (
             <button onClick={() => setIsPlaying(true)} className="relative z-10 w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all">
                <Play className="w-8 h-8 text-white ml-1" />
             </button>
           )}

           {/* Video Controls Overlay */}
           <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-indigo-400">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <div className="text-xs text-white/80 font-mono">22:00 / 45:00</div>
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden relative cursor-pointer">
                <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-indigo-500"></div>
                {/* Peak marker */}
                <div className="absolute left-[48%] top-0 bottom-0 w-1 bg-rose-500"></div>
              </div>
              <button className="text-white hover:text-indigo-400">
                <Maximize2 className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Heatmap Timeline */}
        <div className="h-32 border border-slate-100 rounded-xl bg-slate-50/50 p-2 pt-4 relative">
          <div className="absolute top-2 left-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            Autonomic Stress Heatmap (Session Timeline)
          </div>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={heatmapData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="time" tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} hide />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
              />
              <ReferenceLine x="22:00" stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Critical Peak', fill: '#ef4444', fontSize: 9, fontWeight: 'bold' }} />
              <Line 
                type="monotone" 
                dataKey="stress" 
                stroke="#6366f1" 
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.stress > 8) {
                    return (
                      <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} />
                    );
                  }
                  return <circle cx={cx} cy={cy} r={3} fill="#6366f1" stroke="#fff" strokeWidth={1} />;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Event Log */}
        <div className="flex gap-2 p-2 bg-rose-50 border border-rose-100 rounded-lg items-center">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <p className="text-[11px] text-rose-700 font-medium">
            <strong>AI Auto-Flag:</strong> At 22:00, patient exhibited signs of acute dissociation (AU15 peak, eye contact loss). Click timeline to jump to this moment.
          </p>
        </div>

      </CardContent>
    </Card>
  )
}
