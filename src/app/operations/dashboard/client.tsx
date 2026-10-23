"use client"

import { motion } from "framer-motion"
import { Users, DoorOpen, BedDouble, AlertCircle, TrendingUp, Package } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock Real-Time Room Data
const rooms = [
  { id: "T-1", type: "Telehealth", status: "occupied", user: "Dr. Smith", duration: "12m" },
  { id: "T-2", type: "Telehealth", status: "available", user: null, duration: null },
  { id: "T-3", type: "Telehealth", status: "occupied", user: "Dr. Garcia", duration: "45m" },
  { id: "R-101", type: "Physical", status: "cleaning", user: "Staff", duration: "5m" },
  { id: "R-102", type: "Physical", status: "occupied", user: "Nurse Joy", duration: "20m" },
  { id: "R-103", type: "Physical", status: "available", user: null, duration: null },
]

const revenueData = [
  { time: '08:00', inflow: 12, revenue: 400 },
  { time: '10:00', inflow: 25, revenue: 1200 },
  { time: '12:00', inflow: 45, revenue: 3200 },
  { time: '14:00', inflow: 30, revenue: 2100 },
  { time: '16:00', inflow: 55, revenue: 4500 },
  { time: '18:00', inflow: 15, revenue: 1050 },
];

export function OperationsDashboardClient({ role, canViewBilling }: { role: string | undefined, canViewBilling: boolean }) {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Real-Time Facility Status</h1>
        <p className="text-muted-foreground mt-1">Monitor telehealth bandwidth, revenue flow, and physical room occupancy.</p>
      </header>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {canViewBilling && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">+14%</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Daily Revenue</p>
              <h2 className="text-3xl font-bold tracking-tight">$12,450</h2>
            </div>
          </div>
        )}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Active Consultations</p>
            <h2 className="text-3xl font-bold tracking-tight">14</h2>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Room Utilization</p>
            <h2 className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">78%</h2>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Critical Inventory</p>
            <h2 className="text-3xl font-bold tracking-tight">3 Items</h2>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Chart */}
        {canViewBilling && (
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Patient Inflow vs. Revenue</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area yAxisId="right" type="monotone" dataKey="inflow" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorInflow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Inventory Tracker */}
        <div className={`${canViewBilling ? 'lg:col-span-1' : 'lg:col-span-3'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col`}>
          <h3 className="text-lg font-bold mb-6">Inventory Tracker</h3>
          <div className="flex-1 overflow-auto space-y-4 pr-2">
            {[
              { name: 'N95 Masks', status: 'Optimal', count: '1,240', color: 'bg-emerald-500' },
              { name: 'Surgical Gloves (M)', status: 'Low', count: '150', color: 'bg-amber-500' },
              { name: 'ECG Electrodes', status: 'Critical', count: '24', color: 'bg-red-500' },
              { name: 'Saline IV (500ml)', status: 'Optimal', count: '400', color: 'bg-emerald-500' },
            ].map(item => (
              <div key={item.name} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold text-sm">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.status}</span>
                  </div>
                </div>
                <div className="font-mono text-sm font-bold">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <h3 className="text-lg font-bold mb-4">Live Room Grid</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {rooms.map((room, i) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            key={room.id}
            className={`border rounded-xl p-4 flex flex-col items-center text-center relative overflow-hidden transition-all ${
              room.status === 'available' ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 cursor-pointer' :
              room.status === 'occupied' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900' :
              'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
            }`}
          >
            {room.type === 'Telehealth' ? <DoorOpen className="h-6 w-6 mb-3 text-slate-400" /> : <BedDouble className="h-6 w-6 mb-3 text-slate-400" />}
            <span className="font-bold text-sm tracking-wider">{room.id}</span>
            <span className={`text-[10px] mt-1.5 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              room.status === 'available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
              room.status === 'occupied' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
              'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
            }`}>
              {room.status}
            </span>
            {room.user && (
              <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 w-full flex justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
                <span className="truncate font-medium">{room.user}</span>
                <span className="font-mono">{room.duration}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
