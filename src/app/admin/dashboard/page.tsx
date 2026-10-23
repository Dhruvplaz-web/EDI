"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AlertOctagon, Terminal, ShieldAlert, CheckCircle2 } from "lucide-react"

// Mock Audit Logs
const initialLogs = [
  { id: "LOG-001", time: "10:45:12", user: "nurse@test.com", action: "ACCESSED_PATIENT_RECORD", target: "PT-105", status: "SUCCESS" },
  { id: "LOG-002", time: "10:46:05", user: "billing@test.com", action: "GENERATED_INVOICE", target: "INV-992", status: "SUCCESS" },
  { id: "LOG-003", time: "10:47:30", user: "patient@test.com", action: "ATTEMPTED_CLINICAL_ACCESS", target: "/clinical", status: "DENIED" },
]

export default function AdminDashboard() {
  const [logs, setLogs] = useState(initialLogs)

  // Simulate incoming logs
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLog = {
          id: `LOG-00${prev.length + 1}`,
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          user: "system@praxis.ai",
          action: "HEARTBEAT_CHECK",
          target: "ALL_NODES",
          status: "SUCCESS"
        }
        return [newLog, ...prev].slice(0, 50) // Keep last 50
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <header className="mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Terminal className="h-6 w-6" /> System Console
        </h1>
        <p className="text-zinc-500 mt-1">Global monitoring and break-glass override tracking.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Break-Glass Overrides */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border border-red-900/50 bg-red-950/10 p-6">
            <h2 className="text-red-500 font-bold mb-4 flex items-center gap-2 uppercase text-sm tracking-wider">
              <ShieldAlert className="h-4 w-4" /> Active Overrides
            </h2>
            <div className="space-y-4">
              <div className="border-l-2 border-red-500 pl-4 py-1">
                <p className="text-white text-sm font-bold">clinician@test.com</p>
                <p className="text-zinc-400 text-xs mt-1">Requested EMERGENCY_ACCESS to PT-999</p>
                <p className="text-red-400 text-xs mt-1">02:15:33 ago</p>
              </div>
              <div className="border-l-2 border-zinc-700 pl-4 py-1 opacity-50">
                <p className="text-white text-sm font-bold">nurse_ic@test.com</p>
                <p className="text-zinc-400 text-xs mt-1">Requested PHARMACY_OVERRIDE</p>
                <p className="text-zinc-500 text-xs mt-1">Resolved (04:12:00 ago)</p>
              </div>
            </div>
            <button className="mt-6 w-full border border-red-900/50 hover:bg-red-900/20 text-red-400 py-2 text-xs uppercase font-bold transition-colors">
              Force Revoke All
            </button>
          </div>

          <div className="border border-zinc-800 bg-black/50 p-6">
            <h2 className="text-zinc-300 font-bold mb-4 flex items-center gap-2 uppercase text-sm tracking-wider">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Infrastructure Status
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-zinc-800 py-2">
                <span className="text-zinc-500">Firebase Edge Proxy</span>
                <span className="text-emerald-500 font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 py-2">
                <span className="text-zinc-500">Firestore Rules</span>
                <span className="text-emerald-500 font-bold">ENFORCING</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">RBAC Token Cache</span>
                <span className="text-emerald-500 font-bold">SYNCED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Audit Stream */}
        <div className="lg:col-span-2 border border-zinc-800 bg-black/80 flex flex-col h-[600px]">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h2 className="text-zinc-300 font-bold uppercase text-sm tracking-wider">Live Audit Stream</h2>
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-zinc-600 border-b border-zinc-800">
                  <th className="pb-2 font-normal w-24">TIME</th>
                  <th className="pb-2 font-normal">USER</th>
                  <th className="pb-2 font-normal">ACTION</th>
                  <th className="pb-2 font-normal">TARGET</th>
                  <th className="pb-2 font-normal text-right">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={log.id} 
                    className="border-b border-zinc-900/50 hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="py-2 text-zinc-500">{log.time}</td>
                    <td className="py-2 text-zinc-300">{log.user}</td>
                    <td className="py-2 text-blue-400">{log.action}</td>
                    <td className="py-2 text-zinc-400">{log.target}</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded-sm ${
                        log.status === 'SUCCESS' ? 'bg-emerald-950/50 text-emerald-500' : 'bg-red-950/50 text-red-500'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
