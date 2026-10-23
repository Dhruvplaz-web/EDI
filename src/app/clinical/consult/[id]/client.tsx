"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, FileText, ShieldAlert, 
  Sliders, UserPlus, Activity, Download, Settings, Users, TrendingUp, Pill, Home, PlayCircle,
  MessageSquare
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

export function ClinicalConsultClient({ patientId, canWriteNotes }: { patientId: string, canWriteNotes: boolean }) {
  const [micOn, setMicOn] = useState(true)
  const [videoOn, setVideoOn] = useState(true)
  const [showEmsModal, setShowEmsModal] = useState(false)
  const [activeTab, setActiveTab] = useState('consult')

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
    discrepancyAlert, discrepancyValue, startAnalysis, stopAnalysis, setStressWeights 
  } = useFacialAnalysis()
  const {
    pitchHz,
    jitterPercent,
    shimmerPercent,
    pitchVariance,
    isFlatAffect,
    isVoiced,
    acousticStressScore
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

  useEffect(() => {
    const res = fusionEngineRef.current.fuse(
      {
        au4BrowDown,
        au15MouthFrown,
        blinkRate: 0.15,
        sustainedFrownRate: au4BrowDown > 0.4 ? 0.6 : 0.1
      },
      {
        pitchHz,
        jitterPercent,
        shimmerPercent,
        pitchVariance,
        isFlatAffect,
        isVoiced
      },
      {
        linguisticSeverity,
        sentimentPolarity: latestAnalysis?.sentimentPolarity || 0,
        speechVelocityWpm,
        isCrisisAlert: crisisAlert,
        flaggedTokenCount: latestAnalysis?.flaggedTokens?.length || 0
      },
      patient.baselinePHQ9 > 0 ? (patient.baselinePHQ9 / 2.7) : 5.0
    )
    setFusionResult(res)
  }, [
    au4BrowDown, au15MouthFrown, pitchHz, jitterPercent, shimmerPercent,
    pitchVariance, isFlatAffect, isVoiced, linguisticSeverity, speechVelocityWpm,
    crisisAlert, latestAnalysis, patient.baselinePHQ9
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
          {/* Main Video Viewport (Uncramped Layout) */}
          <div className="relative w-full h-[520px] bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-200 shadow-2xl flex items-center justify-center">
            
            {/* Modality Radar HUD Overlay */}
            <ModalityRadarHUD
              rawStress={fusionResult?.fusedSeverityScore ?? rawStressScore}
              emaStress={fusionResult?.fusedSeverityScore ?? emaStressScore}
              discrepancy={fusionResult?.discrepancyD ?? discrepancyValue}
              isAlertActive={fusionResult?.isMaskingAlertActive ?? discrepancyAlert}
              au4BrowDown={au4BrowDown}
              au15MouthFrown={au15MouthFrown}
              speechJitter={jitterPercent}
              pitchHz={pitchHz}
              pitchVariance={pitchVariance}
              isFlatAffect={isFlatAffect}
              isVoiced={isVoiced}
              attentionWeights={fusionResult?.attentionWeights}
            />

            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900 space-y-3">
                <Activity className="w-12 h-12 animate-pulse text-teal-500" />
                <p className="text-sm font-semibold text-slate-200">Connecting WebRTC Stream for {patient.fullName}...</p>
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
          <Card className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmsModal(true)}
              className="bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold shadow-sm"
            >
              <ShieldAlert className="w-4 h-4 mr-1.5 text-rose-600" /> 1-Click Crisis EMS Escalation
            </Button>

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
