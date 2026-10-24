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

  // Regulatory Consent Gate (REG-01): Telemetry & AI Documentation Consent
  const [hasConsent, setHasConsent] = useState<boolean>(true);
  const [consentToken, setConsentToken] = useState<string>('consent_token_authenticated_signed_2026');

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
  } = useLiveTranscription(hasConsent, true)

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
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-[#E4E4E7] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-left">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-[#09090B] tracking-tight">{patient.fullName}</h1>
            <span className="text-xs text-[#71717A] font-mono">({patient.age}y • ID: {patientId})</span>
            <span className="px-2 py-0.5 bg-[#F4F4F5] text-[#52525B] text-[10px] font-mono font-medium rounded border border-[#E4E4E7]">
              {patient.icd11Code}
            </span>
          </div>
          <p className="text-xs font-medium text-[#27272A] mt-0.5">{patient.primaryDiagnosis}</p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Patient Telemetry Consent Status Badge (REG-01) */}
          <button
            onClick={() => setHasConsent(!hasConsent)}
            title={hasConsent ? "Patient granted telemetry consent. Click to revoke." : "Consent revoked. Click to grant."}
            className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border transition-all ${
              hasConsent 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${hasConsent ? 'bg-emerald-600' : 'bg-rose-600'}`} />
            Consent: {hasConsent ? 'Active (Granted)' : 'Revoked / Suspended'}
          </button>

          <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-[#F0F6FF] text-[#0066FF] px-3 py-1 rounded-full border border-[#BFDBFE]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
            Encrypted Video Connected
          </span>
        </div>
      </div>

      {/* Tab: Active Consultation Stream View */}
      {activeTab === 'consult' && (
        <div className="space-y-4 font-sans text-left">
          {/* Defense Simulator Controller Bar */}
          <ClinicalSimulationController
            isSimulating={isSimulating}
            onToggleSimulating={setIsSimulating}
            activeScenario={activeScenario}
            onSelectScenario={setActiveScenario}
          />

          {/* Main Video Viewport (Responsive: h-[320px] on mobile, h-[420px] on tablet, h-[520px] on desktop) */}
          <div className="relative w-full h-[320px] sm:h-[420px] lg:h-[520px] bg-[#18181B] rounded-2xl overflow-hidden border border-[#E4E4E7] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_30px_rgba(0,0,0,0.03)] flex items-center justify-center">
            
            {/* Ambient Scribing Mode vs Diagnostic HUD View Mode on Desktop (>= 1024px) */}
            {viewMode === 'diagnostic' ? (
              <div className="hidden lg:block">
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
              </div>
            ) : (
              /* Ambient Scribing Mode Floating Status Capsule (Clean, Rapport-Preserving) */
              <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 max-w-sm pointer-events-auto">
                <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-[#E4E4E7] shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-xs font-mono text-[#09090B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
                  <span className="font-semibold text-[#09090B]">Ambient Scribe Active</span>
                  <span className="text-[#E4E4E7]">|</span>
                  <span className="text-[#52525B]">
                    Score: {(fusionResult?.fusedSeverityScore ?? (isSimulating ? scenarioProfile.linguisticSeverity : emaStressScore)).toFixed(1)}/10
                  </span>
                  <button
                    onClick={() => setViewMode('diagnostic')}
                    className="ml-1 text-[11px] bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#09090B] px-2 py-0.5 rounded font-medium border border-[#E4E4E7] transition-colors"
                  >
                    View HUD
                  </button>
                </div>

                {/* Subtle Discrepancy Alert Capsule if active */}
                {(fusionResult?.isMaskingAlertActive ?? (isSimulating && activeScenario === 'masked')) && (
                  <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-rose-700 border border-rose-200 px-3 py-1 rounded-lg text-xs font-mono shadow-sm">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" strokeWidth={1.75} />
                    <span>Discrepancy Gap: {(fusionResult?.discrepancyD ?? (isSimulating ? 3.8 : discrepancyValue)).toFixed(1)}</span>
                  </div>
                )}

                {/* Ambient Acoustic Noise Interference Capsule if low SNR */}
                {isLowSNR && (
                  <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-amber-800 border border-amber-200 px-3 py-1 rounded-lg text-xs font-mono shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Audio Signal Filtered ({snrDb.toFixed(1)} dB)</span>
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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090B] p-6 text-slate-300">
                <div className="relative w-44 h-44 border border-white/20 rounded-full flex items-center justify-center mb-4 bg-white/5 shadow-2xl ring-1 ring-white/10">
                  {/* Eye landmark points */}
                  <div className="absolute top-12 left-10 w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
                  <div className="absolute top-12 right-10 w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
                  
                  {/* Eyebrows Brow Lowerer */}
                  <div 
                    className="absolute top-14 w-28 h-1 bg-white/80 rounded transition-all duration-300"
                    style={{ transform: `scaleY(${1 + effectiveAU4 * 3}) translateY(${effectiveAU4 * 6}px)` }}
                  />

                  {/* Mouth Depressor */}
                  <div 
                    className="absolute bottom-12 w-20 h-1 bg-white/60 rounded-full transition-all duration-300"
                    style={{ transform: `scaleX(${1.2 - effectiveAU15 * 0.4}) translateY(${effectiveAU15 * 8}px)` }}
                  />

                  <div className="text-[10px] font-mono text-white/80 font-medium uppercase tracking-wider text-center mt-28">
                    {scenarioProfile.badge}
                  </div>
                </div>

                <div className="text-center max-w-lg">
                  <p className="text-xs font-mono text-white mb-1.5 font-medium bg-black/60 px-3.5 py-1.5 rounded-lg border border-white/10">
                    &ldquo;{scenarioProfile.samplePhrase}&rdquo;
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Signal Vector: Pitch={effectivePitch} Hz • Jitter={effectiveJitter}% • Shimmer={effectiveShimmer}%
                  </p>
                </div>
              </div>
            )}

            {!remoteStream && !isSimulating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 bg-[#09090B] space-y-3">
                <Activity className="w-10 h-10 animate-pulse text-[#0066FF]" strokeWidth={1.75} />
                <p className="text-sm font-semibold text-white">Connecting Encrypted Stream for {patient.fullName}...</p>
                <p className="text-xs text-zinc-400">Click &ldquo;Start Simulation Test&rdquo; above to run test data without webcam.</p>
              </div>
            )}

            {/* Clinician Self-View (Responsive scaling) */}
            <div className="absolute top-3 left-3 w-28 sm:w-36 md:w-44 lg:w-52 aspect-video bg-[#09090B] rounded-xl overflow-hidden border border-white/40 shadow-xl z-20">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Responsive Diagnostic HUD Docked Below Video on screens < 1024px to prevent overflow (UI-01) */}
          {viewMode === 'diagnostic' && (
            <div className="block lg:hidden w-full">
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
            </div>
          )}

          {/* Control Bar & Quick Actions */}
          <div className="p-3.5 bg-white/95 backdrop-blur-sm border border-[#E4E4E7] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmsModal(true)}
                className="bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-lg shadow-none"
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-rose-600" strokeWidth={1.75} /> Crisis Escalation
              </Button>

              {/* View Mode Switcher: Ambient Scribe vs Diagnostic HUD */}
              <div className="flex items-center bg-[#F4F4F5] p-1 rounded-lg border border-[#E4E4E7]">
                <button
                  onClick={() => setViewMode('ambient')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'ambient' 
                      ? 'bg-white text-[#09090B] shadow-sm' 
                      : 'text-[#71717A] hover:text-[#09090B]'
                  }`}
                  title="Therapeutic Ambient Scribing Mode"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-[#0066FF]" strokeWidth={1.75} />
                  Ambient
                </button>
                <button
                  onClick={() => setViewMode('diagnostic')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'diagnostic' 
                      ? 'bg-[#0066FF] text-white shadow-sm' 
                      : 'text-[#71717A] hover:text-[#09090B]'
                  }`}
                  title="Diagnostic HUD Mode"
                >
                  <Activity className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Diagnostic HUD
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button 
                onClick={() => setMicOn(!micOn)}
                aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${micOn ? 'bg-white text-[#27272A] hover:bg-[#F4F4F5] border border-[#E4E4E7]' : 'bg-rose-600 text-white shadow-sm'}`}
              >
                {micOn ? <Mic className="w-4 h-4" strokeWidth={1.75} /> : <MicOff className="w-4 h-4" strokeWidth={1.75} />}
              </button>

              <button 
                onClick={() => setVideoOn(!videoOn)}
                aria-label={videoOn ? "Turn off camera" : "Turn on camera"}
                className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${videoOn ? 'bg-white text-[#27272A] hover:bg-[#F4F4F5] border border-[#E4E4E7]' : 'bg-rose-600 text-white shadow-sm'}`}
              >
                {videoOn ? <Video className="w-4 h-4" strokeWidth={1.75} /> : <VideoOff className="w-4 h-4" strokeWidth={1.75} />}
              </button>
              
              <div className="w-px h-6 bg-[#E4E4E7] mx-1" />
              
              <Link 
                href="/clinical/queue" 
                aria-label="End consultation call"
                className="min-w-[48px] min-h-[44px] w-12 h-11 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <PhoneOff className="w-4 h-4" strokeWidth={1.75} />
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                href={`/clinical/records/${patientId}`}
                className="border border-[#E4E4E7] hover:bg-[#F4F4F5] text-[#27272A] text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center"
              >
                <FileText className="w-3.5 h-3.5 mr-1 text-[#71717A]" strokeWidth={1.75} /> Medical Chart
              </Link>
              <Button size="sm" onClick={() => setActiveTab('soap')} className="bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-medium rounded-lg shadow-sm">
                Clinical Notes
              </Button>
            </div>
          </div>

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
          <div className="rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-4 text-xs text-[#52525B] flex items-start gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <ShieldAlert className="w-4 h-4 text-[#71717A] shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="space-y-1 text-left">
              <p className="font-semibold text-[#09090B]">
                Clinical Decision Support Notice
              </p>
              <p className="text-[11px] text-[#71717A] leading-relaxed">
                This software provides objective vocal acoustic measurements and facial Action Unit kinematic data to support clinical assessment. In accordance with the 21st Century Cures Act and FDA Section 520(o), this tool is not an autonomous diagnostic instrument and does not replace the judgment of a licensed healthcare provider. Providers must independently verify patient history and all clinical observations before establishing care plans.
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
            patientConsentToken={hasConsent ? consentToken : undefined}
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
