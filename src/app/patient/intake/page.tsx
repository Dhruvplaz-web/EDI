"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Clipboard, CheckCircle2, ChevronRight, ChevronLeft, Mic, Video, Loader2 } from "lucide-react"
import { submitIntake } from "@/app/actions/intake"
import { useRouter } from "next/navigation"
import { useFacialAnalysis } from "@/hooks/useFacialAnalysis"

export default function PatientIntakePage() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Form State
  const [formData, setFormData] = useState({
    symptoms: '',
    severity: 5,
    medicationChanges: 'no',
    bloodPressure: '',
    weight: '',
    baselineSeverityScore: null as number | null
  })

  const [isRecording, setIsRecording] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)

  // MediaPipe Hook
  const { isLoaded, emaStressScore: stressScore, startAnalysis, stopAnalysis } = useFacialAnalysis()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const nextStep = () => setStep(s => Math.min(s + 1, 5))
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const handleRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream

      setIsRecording(true)

      let progress = 0
      const interval = setInterval(() => {
        progress += (100 / 15) // 15 seconds mock recording length
        setRecordingProgress(progress)

        if (progress >= 100) {
          clearInterval(interval)
          setIsRecording(false)

          const finalScore = stopAnalysis()

          setFormData(prev => ({
            ...prev,
            baselineSeverityScore: finalScore || 8
          }))

          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
          }
        }
      }, 1000)
    } catch (err) {
      console.error("Camera access denied or error:", err)
      alert("Camera access is required for the AI Wellness Check-in.")
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const result = await submitIntake(formData)
    setIsSubmitting(false)
    if (result.success) {
      // THE FIX: Move to Step 5 instead of routing immediately
      setStep(5)
    } else {
      alert(result.error)
    }
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      stopAnalysis()
    }
  }, [])

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-10 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Pre-Consultation Intake</h1>
          <p className="text-slate-500 mt-2">Please provide some preliminary details to help your doctor prepare.</p>
        </header>

        {/* Progress Bar - Hidden on Step 5 */}
        {step < 5 && (
          <div className="flex justify-between items-center mb-12 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 -z-10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-600 dark:bg-blue-500"
                initial={{ width: '0%' }}
                animate={{ width: `${((step - 1) / 3) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-colors duration-300 ${step >= num ? 'bg-blue-600 border-blue-100 dark:border-blue-900/50 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}>
                {num}
              </div>
            ))}
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[400px] relative">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 absolute inset-0 overflow-auto">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Activity className="text-blue-500" /> Current Symptoms</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">What is the primary reason for your visit today?</label>
                    <textarea
                      value={formData.symptoms}
                      onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px]"
                      placeholder="E.g., I've been experiencing persistent anxiety..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Severity (1-10)</label>
                    <input
                      type="range" min="1" max="10"
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1"><span>Mild (1)</span><span>Severe (10)</span></div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 absolute inset-0 overflow-auto">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Clipboard className="text-blue-500" /> Medical Updates</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Have there been any changes to your medications?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex-1 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <input type="radio" name="meds" value="yes" checked={formData.medicationChanges === 'yes'} onChange={(e) => setFormData({ ...formData, medicationChanges: e.target.value })} className="accent-blue-600" /> Yes
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex-1 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <input type="radio" name="meds" value="no" checked={formData.medicationChanges === 'no'} onChange={(e) => setFormData({ ...formData, medicationChanges: e.target.value })} className="accent-blue-600" /> No
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recent vitals (if known)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" value={formData.bloodPressure} onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })} placeholder="Blood Pressure (e.g. 120/80 mmHg)" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                      <input type="text" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="Weight (lbs/kg)" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 absolute inset-0 overflow-auto">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Video className="text-blue-500" /> AI Wellness Check-in</h2>
                <p className="text-sm text-slate-500 mb-6">Please record a short 15-second response to help our AI establish a secure baseline before you meet your doctor.</p>

                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">

                  {isRecording && (
                    <video
                      ref={(el) => {
                        if (el) {
                          // @ts-ignore
                          videoRef.current = el;
                          if (streamRef.current && el.srcObject !== streamRef.current) {
                            el.srcObject = streamRef.current;
                          }
                        }
                      }}
                      onLoadedData={() => {
                        if (videoRef.current) {
                          startAnalysis(videoRef.current);
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover opacity-30 z-0"
                    />
                  )}

                  <div className="relative z-10 w-full flex flex-col items-center">
                    <p className="font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">"How have you been feeling over the past 48 hours?"</p>

                    {!formData.baselineSeverityScore ? (
                      <div className="w-full max-w-xs space-y-4">
                        <button
                          onClick={handleRecord}
                          disabled={isRecording || !isLoaded}
                          className={`w-full py-3 rounded-full flex items-center justify-center gap-2 font-medium transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50'}`}
                        >
                          {!isLoaded ? <Loader2 className="w-4 h-4 animate-spin" /> : isRecording ? <div className="w-2 h-2 rounded-full bg-white" /> : <Mic className="w-4 h-4" />}
                          {!isLoaded ? 'Loading AI Model...' : isRecording ? 'Recording & Analyzing...' : 'Start Recording'}
                        </button>

                        {isRecording && (
                          <div className="w-full">
                            <div className="flex justify-between text-xs mb-1 font-medium text-slate-500">
                              <span>Analyzing Kinematics</span>
                              <span>{Math.round(recordingProgress)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-red-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${recordingProgress}%` }}
                              />
                            </div>
                            <div className="mt-2 text-center text-xs text-slate-400 font-mono">Live Stress Index: {stressScore}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-emerald-600 dark:text-emerald-400 font-medium flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8" />
                        Baseline established successfully (Score: {formData.baselineSeverityScore}/10).
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 absolute inset-0 overflow-auto flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ready for Consultation</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">Your intake and AI baseline analysis have been securely transmitted. Your doctor will review this before your session begins.</p>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium shadow-sm transition-colors w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit to Doctor Queue
                </button>
              </motion.div>
            )}

            {/* THE NEW STEP 5: The Choice Menu */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 absolute inset-0 overflow-auto flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 z-50">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                  <Activity className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Analysis Complete</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                  Based on your severity score ({formData.baselineSeverityScore}/10), our AI recommends speaking with a clinician. How would you like to proceed?
                </p>

                <div className="w-full max-w-sm space-y-4">
                  {/* Option A: Immediate Connect */}
                  <button
                    onClick={() => router.push(`/patient/consult/PT-${Math.floor(Math.random() * 90000)}`)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl font-medium shadow-sm transition-all flex flex-col items-center justify-center border border-transparent"
                  >
                    <span className="flex items-center gap-2 text-lg"><Video className="w-5 h-5" /> See a Doctor Now</span>
                    <span className="text-emerald-100 text-sm mt-1 font-normal">Est. wait: ~2 minutes</span>
                  </button>

                  {/* Option B: Schedule for Later */}
                  <button
                    onClick={() => router.push('/patient/dashboard')}
                    className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 p-4 rounded-xl font-medium shadow-sm transition-all flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700"
                  >
                    <span className="flex items-center gap-2 text-lg">Schedule for Later</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-normal">Browse available times</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Actions */}
          {step < 5 && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-between z-20">
              <button
                onClick={prevStep}
                disabled={step === 1 || step === 4}
                className={`px-6 py-2 rounded-lg font-medium flex items-center transition-colors ${step === 1 || step === 4 ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </button>

              {step < 4 && (
                <button
                  onClick={nextStep}
                  disabled={step === 3 && !formData.baselineSeverityScore}
                  className={`px-6 py-2 rounded-lg font-medium flex items-center shadow-sm transition-colors ${step === 3 && !formData.baselineSeverityScore ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}