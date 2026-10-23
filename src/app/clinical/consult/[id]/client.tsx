"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, FileText, ShieldAlert, 
  Sliders, UserPlus, Activity, Download, Settings, Users, TrendingUp, Pill, Home, PlayCircle,
  MessageSquare, Stethoscope
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SidebarLayout, NavItem } from "@/components/layout/sidebar-layout"
import { useWebRTC } from "@/hooks/useWebRTC"
import { useFacialAnalysis } from "@/hooks/useFacialAnalysis"
import { useAcousticAnalysis } from "@/hooks/useAcousticAnalysis"
import { useLiveTranscription } from "@/hooks/useLiveTranscription"
import { CrossAttentionFusionEngine, CrossAttentionResult } from "@/lib/telemetry/cross-attention-fusion"
import { ModalityRadarHUD } from "@/components/clinician/modality-radar-hud"
import { SOAPNoteWriter } from "@/components/clinician/soap-note-writer"
import { StressWeightAdjuster } from "@/components/clinician/stress-weight-adjuster"
import { BiomarkerAnalytics } from "@/components/clinician/biomarker-analytics"
import { EPrescriptionWriter } from "@/components/clinician/eprescription-writer"
import { EmergencyEscalationModal } from "@/components/clinician/emergency-escalation-modal"
import { PeerConsultInvite } from "@/components/clinician/peer-consult-invite"
import { TelemetryExport } from "@/components/clinician/telemetry-export"
import { SessionReplayHeatmap } from "@/components/clinician/session-replay-heatmap"
import { LiveTranscriptFeed } from "@/components/clinician/live-transcript-feed"
import { UserProfileSettings } from "@/components/profile/user-profile-settings"
import { logComplianceAudit } from "@/lib/telemetry/audit-trail-logger"
import { Card } from "@/components/ui/card"

import { patientService, BENCHMARK_PATIENTS } from "@/lib/firebase/patient-service"
import { PatientProfile } from "@/lib/firebase/schema"
import { ClinicalSimulationController, SIMULATION_SCENARIOS, SimulationScenarioId } from "@/components/clinician/clinical-simulation-controller"

export function ClinicalConsultClient({ patientId, canWriteNotes }: { patientId: string, canWriteNotes: boolean }) {
  const [micOn, setMicOn] = useState(true)
  const [videoOn, setVideoOn] = useState(true)
  const [showEmsModal, setShowEmsModal] = useState(false)
  const [activeTab, setActiveTab] = useState('consult')
  const [viewMode, setViewMode] = useState<'ambient' | 'diagnostic'>('ambient')

  // 1-Click Examiner Defense Simulation Controller State
  const [isSimulating, setIsSimulating] = useState(false)
  const [activeScenario, setActiveScenario] = useState<SimulationScenarioId>('masked')

  const fallbackPatient = BENCHMARK_PATIENTS.find(p => p.id === patientId) || BENCHMARK_PATIENTS[0]
  const [patient, setPatient] = useState<PatientProfile>(fallbackPatient)

  useEffect(() => {
    const unsub = patientService.subscribePatient(patientId, (liveData) => {
      if (liveData) {
        setPatient(liveData)
      }
    })
    return () => unsub()
  }, [patientId])

  const { localStream, remoteStream, toggleAudio, toggleVideo } = useWebRTC(patientId, 'clinician')
  const { 
    isLoaded, rawStressScore, emaStressScore, au4BrowDown, au15MouthFrown,
    discrepancyAlert, discrepancyValue, isPoseCentered, headPose, startAnalysis, stopAnalysis, setStressWeights 
  } = useFacialAnalysis()
  const {
    pitchHz,
    jitterPercent,
    shimmerPercent,
    pitchVariance,
    isFlatAffect,
    isVoiced,
    acousticStressScore,
    snrDb,
    isLowSNR
  } = useAcousticAnalysis(remoteStream)
  const {
    isListening: isTranscribing,
    transcriptHistory,
    interimText,
    fullTranscriptText,
    speechVelocityWpm,
    linguisticSeverity,
    crisisAlert,
    latestAnalysis,
    clearTranscript
  } = useLiveTranscription(true)

  const fusionEngineRef = useRef(new CrossAttentionFusionEngine())
  const [fusionResult, setFusionResult] = useState<CrossAttentionResult | null>(null)

  // Multimodal Ground Truth Routing: WebRTC Hardware vs Deterministic Defense Simulator
  const scenarioProfile = SIMULATION_SCENARIOS[activeScenario]
  const effectiveAU4 = isSimulating ? scenarioProfile.au4BrowDown : au4BrowDown
  const effectiveAU15 = isSimulating ? scenarioProfile.au15MouthFrown : au15MouthFrown
  const effectivePitch = isSimulating ? scenarioProfile.pitchHz : pitchHz
  const effectiveJitter = isSimulating ? scenarioProfile.jitterPercent : jitterPercent
  const effectiveShimmer = isSimulating ? scenarioProfile.shimmerPercent : shimmerPercent
  const effectiveVariance = isSimulating ? scenarioProfile.pitchVariance : pitchVariance
  const effectiveFlatAffect = isSimulating ? scenarioProfile.isFlatAffect : isFlatAffect
  const effectiveVoiced = isSimulating ? scenarioProfile.isVoiced : isVoiced
  const effectiveWpm = isSimulating ? scenarioProfile.speechVelocityWpm : speechVelocityWpm
  const effectiveLinguisticSeverity = isSimulating ? scenarioProfile.linguisticSeverity : linguisticSeverity
  const effectiveCrisisAlert = isSimulating ? scenarioProfile.crisisAlert : crisisAlert
  const effectiveSentiment = isSimulating ? scenarioProfile.sentimentPolarity : (latestAnalysis?.sentimentPolarity || 0)
  const effectiveSubjective = isSimulating 
    ? scenarioProfile.subjectiveScore 
    : (patient.baselinePHQ9 > 0 ? (patient.baselinePHQ9 / 2.7) : 5.0)

  useEffect(() => {
    const res = fusionEngineRef.current.fuse(
      {
        au4BrowDown: effectiveAU4,
        au15MouthFrown: effectiveAU15,
        blinkRate: 0.15,
        sustainedFrownRate: effectiveAU4 > 0.4 ? 0.6 : 0.1
      },
      {
        pitchHz: effectivePitch,
        jitterPercent: effectiveJitter,
        shimmerPercent: effectiveShimmer,
        pitchVariance: effectiveVariance,
        isFlatAffect: effectiveFlatAffect,
        isVoiced: effectiveVoiced
      },
      {
        linguisticSeverity: effectiveLinguisticSeverity,
        sentimentPolarity: effectiveSentiment,
        speechVelocityWpm: effectiveWpm,
        isCrisisAlert: effectiveCrisisAlert,
        flaggedTokenCount: isSimulating ? scenarioProfile.flaggedTokens.length : (latestAnalysis?.flaggedTokens?.length || 0)
      },
      effectiveSubjective
    )
    setFusionResult(res)
  }, [
    effectiveAU4, effectiveAU15, effectivePitch, effectiveJitter, effectiveShimmer,
    effectiveVariance, effectiveFlatAffect, effectiveVoiced, effectiveLinguisticSeverity,
    effectiveSentiment, effectiveWpm, effectiveCrisisAlert, isSimulating, scenarioProfile,
    latestAnalysis, effectiveSubjective
  ])

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
      startAnalysis(remoteVideoRef.current)
    }
  }, [remoteStream, startAnalysis])

  useEffect(() => {
    toggleAudio(micOn)
  }, [micOn, toggleAudio])

  useEffect(() => {
    toggleVideo(videoOn)
  }, [videoOn, toggleVideo])

  useEffect(() => {
    logComplianceAudit({
      userId: 'clinician_current',
      userRole: 'clinician',
      action: 'VIEW_RECORD',
      patientId,
      details: `Accessed active tele-consultation video room for ${patient.fullName}`
    })
  }, [patientId, patient.fullName])

  const clinicianNavItems: NavItem[] = [
    { id: 'queue', label: 'Triage Queue Board', icon: Users },
    { id: 'consult', label: 'Active Consultation', icon: Video, badge: 'Live' },
    { id: 'transcript', label: 'Live NLP Transcript', icon: MessageSquare },
    { id: 'replay', label: 'Session Replays', icon: PlayCircle },
    { id: 'soap', label: 'SOAP Clinical Notes', icon: FileText },
    { id: 'eprescribe', label: 'E-Prescriptions', icon: Pill },
    { id: 'analytics', label: 'Biomarker Trends', icon: TrendingUp },
    { id: 'weights', label: 'Weight Calibration', icon: Sliders },
    { id: 'export', label: 'Telemetry Export', icon: Download },
  ];

  const handleTabChange = (tabId: string) => {
    if (tabId === 'queue') {
      window.location.href = '/clinical/queue';
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <SidebarLayout
      role="clinician"
      userName="Dr. Sarah Jenkins"
      userSubtitle="NPI-84920 • Adult Psychiatry"
      navItems={clinicianNavItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {/* Patient Cohort Context Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-slate-900">{patient.fullName}</h3>
            <span className="text-xs text-slate-500 font-mono">({patient.age}y • Patient ID: {patientId})</span>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-900 text-[10px] font-mono font-bold rounded-md border border-blue-200">
              {patient.icd11Code}
            </span>
          </div>
          <p className="text-xs font-semibold text-teal-800 mt-0.5">{patient.primaryDiagnosis}</p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono bg-teal-50 text-teal-800 px-3 py-1 rounded-full border border-teal-200">
            Encrypted WebRTC Connected
          </span>
        </div>
      </div>

      {/* Tab: Active Consultation Stream View */}
      {activeTab === 'consult' && (
        <div className="space-y-6 font-sans">
          {/* Defense Simulator Controller Bar */}
          <ClinicalSimulationController
            isSimulating={isSimulating}
            onToggleSimulating={setIsSimulating}
            activeScenario={activeScenario}
            onSelectScenario={setActiveScenario}
          />

          {/* Main Video Viewport (Uncramped Layout) */}
          <div className="relative w-full h-[520px] bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-200 shadow-2xl flex items-center justify-center">
            
            {/* Ambient Scribing Mode vs Diagnostic HUD View Mode */}
            {viewMode === 'diagnostic' ? (
              <ModalityRadarHUD
                rawStress={fusionResult?.fusedSeverityScore ?? (isSimulating ? scenarioProfile.linguisticSeverity : rawStressScore)}
                emaStress={fusionResult?.fusedSeverityScore ?? (isSimulating ? scenarioProfile.linguisticSeverity : emaStressScore)}
                discrepancy={fusionResult?.discrepancyD ?? (isSimulating ? 3.8 : discrepancyValue)}
                isAlertActive={fusionResult?.isMaskingAlertActive ?? (isSimulating && activeScenario === 'masked')}
                au4BrowDown={effectiveAU4}
                au15MouthFrown={effectiveAU15}
                speechJitter={effectiveJitter}
                pitchHz={effectivePitch}
                pitchVariance={effectiveVariance}
                isFlatAffect={effectiveFlatAffect}
                isVoiced={effectiveVoiced}
                attentionWeights={fusionResult?.attentionWeights}
              />
            ) : (
              /* Ambient Scribing Mode Floating Status Capsule (Clean, Rapport-Preserving) */
              <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-2 max-w-sm pointer-events-auto">
                <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-lg text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-200 font-medium">Ambient Scribe Active</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-teal-400 font-semibold">
                    Sev: {(fusionResult?.fusedSeverityScore ?? (isSimulating ? scenarioProfile.linguisticSeverity : emaStressScore)).toFixed(1)}/10
                  </span>
                  <button
                    onClick={() => setViewMode('diagnostic')}
                    className="ml-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-teal-300 px-2 py-0.5 rounded border border-slate-700 transition-colors"
                  >
                    View HUD
                  </button>
                </div>

                {/* Subtle Discrepancy Alert Capsule if active */}
                {(fusionResult?.isMaskingAlertActive ?? (isSimulating && activeScenario === 'masked')) && (
                  <div className="flex items-center gap-1.5 bg-rose-950/90 backdrop-blur-md text-rose-300 border border-rose-800/80 px-3 py-1 rounded-full text-[11px] font-mono shadow-md animate-fade-in">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Discrepancy Alert D={(fusionResult?.discrepancyD ?? (isSimulating ? 3.8 : discrepancyValue)).toFixed(1)}</span>
                  </div>
                )}

                {/* Ambient Acoustic Noise Interference Capsule if low SNR */}
                {isLowSNR && (
                  <div className="flex items-center gap-1.5 bg-amber-950/90 backdrop-blur-md text-amber-300 border border-amber-800/80 px-3 py-1 rounded-full text-[11px] font-mono shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Acoustic SNR Low ({snrDb.toFixed(1)} dB) • Filtered</span>
                  </div>
                )}

                {/* Off-axis Head Pose Compensated Capsule */}
                {!isPoseCentered && (
                  <div className="flex items-center gap-1.5 bg-indigo-950/90 backdrop-blur-md text-indigo-300 border border-indigo-800/80 px-3 py-1 rounded-full text-[11px] font-mono shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>Pose Compensated (Pitch: {headPose.pitchDeg.toFixed(0)}°)</span>
                  </div>
                )}
              </div>
            )}

            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />

            {!remoteStream && isSimulating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 text-slate-300">
                <div className="relative w-44 h-44 border border-teal-500/40 rounded-full flex items-center justify-center mb-4 bg-teal-950/30 shadow-2xl ring-4 ring-teal-500/10">
                  {/* Eye landmark points */}
                  <div className="absolute top-12 left-10 w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                  <div className="absolute top-12 right-10 w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                  
                  {/* Eyebrows AU4 Brow Lowerer */}
                  <div 
                    className="absolute top-14 w-28 h-1 bg-amber-400 rounded transition-all duration-300"
                    style={{ transform: `scaleY(${1 + effectiveAU4 * 3}) translateY(${effectiveAU4 * 6}px)` }}
                  />

                  {/* Mouth Depressor Anguli Oris AU15 */}
                  <div 
                    className="absolute bottom-12 w-20 h-1.5 bg-rose-400 rounded-full transition-all duration-300"
                    style={{ transform: `scaleX(${1.2 - effectiveAU15 * 0.4}) translateY(${effectiveAU15 * 8}px)` }}
                  />

                  <div className="text-[10px] font-mono text-teal-300 font-bold uppercase tracking-wider text-center mt-28">
                    {scenarioProfile.badge}
                  </div>
                </div>

                <div className="text-center max-w-lg">
                  <p className="text-xs font-mono text-teal-300 mb-1.5 font-bold bg-slate-950/80 px-3 py-1.5 rounded-lg border border-teal-500/30">
                    &ldquo;{scenarioProfile.samplePhrase}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Multimodal Attention Vector: F0={effectivePitch} Hz • Jitter={effectiveJitter}% • Shimmer={effectiveShimmer}%
                  </p>
                </div>
              </div>
            )}

            {!remoteStream && !isSimulating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900 space-y-3">
                <Activity className="w-12 h-12 animate-pulse text-teal-500" />
                <p className="text-sm font-semibold text-slate-200">Connecting WebRTC Stream for {patient.fullName}...</p>
                <p className="text-xs text-slate-400">Click &ldquo;Launch Examiner Defense Simulator&rdquo; above for 1-click test with zero webcam required.</p>
              </div>
            )}

            {/* Clinician Self-View */}
            <div className="absolute top-6 left-6 w-56 aspect-video bg-slate-900 rounded-2xl overflow-hidden border-2 border-white shadow-2xl z-20">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Control Bar & Quick Actions */}
          <Card className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmsModal(true)}
                className="bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold shadow-sm"
              >
                <ShieldAlert className="w-4 h-4 mr-1.5 text-rose-600" /> 1-Click Crisis EMS Escalation
              </Button>

              {/* View Mode Switcher: Ambient Scribe vs Diagnostic HUD */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('ambient')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'ambient' 
                      ? 'bg-white text-blue-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Therapeutic Ambient Scribing Mode (zero visual distraction for rapport)"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  Ambient
                </button>
                <button
                  onClick={() => setViewMode('diagnostic')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'diagnostic' 
                      ? 'bg-blue-900 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Diagnostic HUD Mode (full multimodal biomarker telemetry overlay)"
                >
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  Diagnostic HUD
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setMicOn(!micOn)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${micOn ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' : 'bg-rose-600 text-white shadow-md'}`}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button 
                onClick={() => setVideoOn(!videoOn)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${videoOn ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' : 'bg-rose-600 text-white shadow-md'}`}
              >
                {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              
              <div className="w-px h-8 bg-slate-200 mx-2" />
              
              <Link href="/clinical/queue" className="w-14 h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all shadow-lg shadow-rose-600/30">
                <PhoneOff className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href={`/clinical/records/${patientId}`}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-sm flex items-center"
              >
                <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" /> Patient Chart
              </Link>
              <Button size="sm" onClick={() => setActiveTab('soap')} className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold">
                Open SOAP Editor
              </Button>
            </div>
          </Card>

          {/* Live Clinical Transcript & Psychiatric NLP Stream */}
          <div className="w-full">
            <LiveTranscriptFeed
              transcriptHistory={transcriptHistory}
              interimText={interimText}
              isListening={isTranscribing}
              speechVelocityWpm={speechVelocityWpm}
              linguisticSeverity={linguisticSeverity}
              crisisAlert={crisisAlert}
              onClear={clearTranscript}
              onSendToSOAP={() => setActiveTab('soap')}
            />
          </div>

          {/* Statutory FDA Section 520(o) CDS Compliance Disclosure */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-xs text-slate-600 flex items-start gap-3 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">
                FDA Section 520(o) Non-Device Clinical Decision Support (CDS) Statutory Notice
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                This software provides acoustic jitter/shimmer DSP telemetry, facial Action Unit (AU4/AU15) kinematic analysis, and psychiatric speech cadence quantification to assist licensed clinicians in reviewing clinical markers. In accordance with the 21st Century Cures Act and FDA Section 520(o)(1)(E), this software is not an autonomous diagnostic device, does not establish psychiatric diagnoses, and does not replace professional clinical judgment. Licensed healthcare providers must independently evaluate patient history and all clinical findings prior to initiating or altering care plans.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Dedicated Live NLP Transcript Feed */}
      {activeTab === 'transcript' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <LiveTranscriptFeed
            transcriptHistory={transcriptHistory}
            interimText={interimText}
            isListening={isTranscribing}
            speechVelocityWpm={speechVelocityWpm}
            linguisticSeverity={linguisticSeverity}
            crisisAlert={crisisAlert}
            onClear={clearTranscript}
            onSendToSOAP={() => setActiveTab('soap')}
          />
        </div>
      )}

      {/* Tab: Session Replays & Heatmaps */}
      {activeTab === 'replay' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <SessionReplayHeatmap />
        </div>
      )}

      {/* Tab: SOAP Clinical Notes */}
      {activeTab === 'soap' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <SOAPNoteWriter
            patientName={patient.fullName}
            subjectiveScore={patient.baselinePHQ9 > 0 ? Number((patient.baselinePHQ9 / 2.7).toFixed(1)) : 5.0}
            emaStress={fusionResult?.fusedSeverityScore ?? emaStressScore}
            rFrown={au4BrowDown}
            rBlink={0.12}
            discrepancyAlert={fusionResult?.isMaskingAlertActive ?? discrepancyAlert}
            speechJitter={jitterPercent}
            isFlatAffect={isFlatAffect}
            sessionTranscript={fullTranscriptText}
            patientId={patientId}
            primaryDiagnosis={patient.primaryDiagnosis}
            attentionWeights={fusionResult?.attentionWeights}
          />
        </div>
      )}

      {/* Tab: E-Prescriptions */}
      {activeTab === 'eprescribe' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <EPrescriptionWriter patientName={patient.fullName} patientId={patientId} />
        </div>
      )}

      {/* Tab: Biomarker Trends & Analytics */}
      {activeTab === 'analytics' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <BiomarkerAnalytics />
        </div>
      )}

      {/* Tab: Kinematic Weight Calibration */}
      {activeTab === 'weights' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <StressWeightAdjuster onWeightsChange={setStressWeights} />
        </div>
      )}

      {/* Tab: Telemetry Export */}
      {activeTab === 'export' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <TelemetryExport
            patientId={patientId}
            patientName={patient.fullName}
            sessionData={{
              peakStress: Math.max(fusionResult?.fusedSeverityScore ?? rawStressScore, 8.2),
              avgStress: fusionResult?.fusedSeverityScore ?? emaStressScore,
              frownRate: au4BrowDown,
              blinkRate: 0.14,
              discrepancyAlertsCount: (fusionResult?.isMaskingAlertActive || discrepancyAlert) ? 1 : 0,
              attentionWeights: fusionResult?.attentionWeights,
              discrepancyD: fusionResult?.discrepancyD,
              speechJitter: jitterPercent,
              speechWpm: speechVelocityWpm
            }}
          />
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <UserProfileSettings role="clinician" />
        </div>
      )}

      {/* Emergency Escalation Modal */}
      {showEmsModal && (
        <EmergencyEscalationModal
          patientName={patient.fullName}
          patientPhone={patient.emergencyContact?.phone || "+1 (555) 000-0000"}
          emergencyContact={{
            name: patient.emergencyContact?.name || "Emergency Contact",
            relation: patient.emergencyContact?.relation || "Family/Guardian",
            phone: patient.emergencyContact?.phone || "+1 (555) 000-0000"
          }}
          locationAddress={patient.emergencyContact?.address || "Unknown Address"}
          onClose={() => setShowEmsModal(false)}
        />
      )}
    </SidebarLayout>
  )
}
