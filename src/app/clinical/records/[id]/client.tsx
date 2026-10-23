"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FileText, Save, Stethoscope, Pill, Beaker, CheckCircle2, ChevronLeft, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ClinicalRecordClient({ 
  patientId, 
  canWriteNotes, 
  canPrescribe, 
  canOrderLabs 
}: { 
  patientId: string, 
  canWriteNotes: boolean, 
  canPrescribe: boolean, 
  canOrderLabs: boolean 
}) {
  const [activeTab, setActiveTab] = useState("notes")
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1000)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sticky Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/clinical/queue" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">Jane Doe <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 ml-2">{patientId}</span></h1>
            <p className="text-sm text-slate-500">34y • F • DOB: 05/12/1992</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/clinical/consult/${patientId}`} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 text-sm">
            <Stethoscope className="w-4 h-4" /> Start Telehealth
          </Link>
          {canWriteNotes && (
            <button 
              onClick={handleSave}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 text-sm ${saving ? 'opacity-70 pointer-events-none' : ''}`}
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Record'}
            </button>
          )}
        </div>
      </header>

      {/* Main EHR Body */}
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Vitals Summary Strip */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap gap-6 mb-8 shadow-sm">
            <div><p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Blood Pressure</p><p className="font-bold text-lg">128/82 <span className="text-xs font-normal text-emerald-500 ml-1">Normal</span></p></div>
            <div className="w-px bg-slate-200 dark:bg-slate-800" />
            <div><p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Heart Rate</p><p className="font-bold text-lg">72 <span className="text-xs font-normal text-slate-400 ml-1">bpm</span></p></div>
            <div className="w-px bg-slate-200 dark:bg-slate-800" />
            <div><p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Temp</p><p className="font-bold text-lg text-amber-600 dark:text-amber-500">99.1° <span className="text-xs font-normal text-amber-500/70 ml-1">F</span></p></div>
            <div className="w-px bg-slate-200 dark:bg-slate-800" />
            <div><p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">SpO2</p><p className="font-bold text-lg">98% <span className="text-xs font-normal text-slate-400 ml-1">Room Air</span></p></div>
          </div>

          {/* Clinical Workspace Tabs */}
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
              <TabsTrigger value="notes" className="flex items-center gap-2"><FileText className="w-4 h-4" /> Clinical Notes</TabsTrigger>
              <TabsTrigger value="rx" className="flex items-center gap-2"><Pill className="w-4 h-4" /> Prescriptions</TabsTrigger>
              <TabsTrigger value="labs" className="flex items-center gap-2"><Beaker className="w-4 h-4" /> Labs & Imaging</TabsTrigger>
            </TabsList>
            
            <TabsContent value="notes" className="focus-visible:outline-none">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2">Chief Complaint & HPI</h3>
                    <textarea 
                      disabled={!canWriteNotes}
                      className="w-full min-h-[200px] p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 resize-y"
                      placeholder={canWriteNotes ? "Enter History of Present Illness..." : "Read-only mode."}
                      defaultValue="Patient reports a mild headache persisting for 3 days. No visual changes. Mild photophobia noted."
                    />
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2">Assessment & Plan</h3>
                    <textarea 
                      disabled={!canWriteNotes}
                      className="w-full min-h-[150px] p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 resize-y"
                      placeholder={canWriteNotes ? "Enter diagnosis and treatment plan..." : "Read-only mode."}
                    />
                  </div>
                </div>
                <div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl p-6 shadow-sm sticky top-6">
                    <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-4">ICD-10 Diagnostic Codes</h3>
                    {canWriteNotes ? (
                      <div className="space-y-4">
                        <input type="text" placeholder="Search ICD-10..." className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <div className="space-y-2">
                          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-blue-100 dark:border-blue-800 text-sm">
                            <span className="font-medium text-blue-700 dark:text-blue-400">R51.9 - Headache, unspecified</span>
                            <button className="text-slate-400 hover:text-red-500 transition-colors">&times;</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-400 italic">No codes assigned yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rx" className="focus-visible:outline-none">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-6">Active Prescriptions</h3>
                {!canPrescribe && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 rounded-lg mb-6 text-sm text-amber-800 dark:text-amber-400 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p>Your security clearance does not permit authoring new prescriptions. You may only view active records.</p>
                  </div>
                )}
                
                <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Medication</th>
                        <th className="px-4 py-3">Sig (Instructions)</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-medium">Ibuprofen 400mg</td>
                        <td className="px-4 py-3 text-slate-500">Take 1 tablet PO Q6H PRN pain</td>
                        <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</span></td>
                        <td className="px-4 py-3 text-right text-slate-400">View</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {canPrescribe && (
                  <button className="mt-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg w-full py-4 font-medium flex items-center justify-center gap-2">
                    <Pill className="w-4 h-4" /> e-Prescribe New Medication
                  </button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="labs" className="focus-visible:outline-none">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
                <Beaker className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="font-bold text-lg mb-2">No Recent Labs</h3>
                <p className="text-slate-500 max-w-sm mb-6">There are no diagnostic results on file for the past 6 months.</p>
                {canOrderLabs && (
                  <button className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm">
                    Order Diagnostics
                  </button>
                )}
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  )
}
// Temporary import for the component above
import { AlertTriangle } from "lucide-react"
