'use client'

import { useState } from 'react';
import { FileText, Check, Copy, Sparkles, Loader2, Save, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClinicalSignalEngine } from '@/lib/telemetry/signal-engine';
import { logComplianceAudit } from '@/lib/telemetry/audit-trail-logger';

interface SOAPNoteWriterProps {
  patientName: string;
  patientId?: string;
  primaryDiagnosis?: string;
  subjectiveScore: number;
  emaStress: number;
  rFrown: number;
  rBlink: number;
  discrepancyAlert: boolean;
  discrepancyD?: number;
  speechJitter?: number;
  isFlatAffect?: boolean;
  sessionTranscript?: string;
  attentionWeights?: {
    visual: number;
    acoustic: number;
    linguistic: number;
  };
  onSaveSOAP?: (soap: { subjective: string; objective: string; assessment: string; plan: string }) => void;
}

export function SOAPNoteWriter({
  patientName,
  patientId = 'PAT-UNKNOWN',
  primaryDiagnosis = 'Major Depressive Disorder / General Anxiety',
  subjectiveScore,
  emaStress,
  rFrown,
  rBlink,
  discrepancyAlert,
  discrepancyD = 0.0,
  speechJitter = 0.8,
  isFlatAffect = false,
  sessionTranscript = '',
  attentionWeights = { visual: 0.33, acoustic: 0.34, linguistic: 0.33 },
  onSaveSOAP
}: SOAPNoteWriterProps) {
  const signalEngine = new ClinicalSignalEngine();
  const baselineDraft = signalEngine.generateSOAPNote(
    patientName,
    subjectiveScore,
    emaStress,
    rFrown,
    rBlink,
    discrepancyAlert,
    speechJitter,
    isFlatAffect
  );

  if (sessionTranscript && sessionTranscript.trim()) {
    baselineDraft.subjective += `\n\nLive Consultation Dialogue Record:\n${sessionTranscript.trim()}`;
  }

  const [soap, setSoap] = useState(baselineDraft);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [scribeBadge, setScribeBadge] = useState<string | null>(null);

  const handleGenerateAISoap = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/clinical/generate-soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          patientName,
          primaryDiagnosis,
          sessionTranscript,
          subjectiveScore,
          emaStress,
          rFrown,
          rBlink,
          speechJitter,
          isFlatAffect,
          discrepancyAlert,
          discrepancyD,
          attentionWeights
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.soap) {
          setSoap(data.soap);
          setScribeBadge(data.generatedBy || "AI Ambient Scribe");
          logComplianceAudit({
            userId: 'dr_jenkins_84920',
            userRole: 'clinician',
            action: 'GENERATE_AI_SCRIBE',
            patientId,
            details: `Auto-generated multimodal SOAP note via ${data.generatedBy}`
          });
        }
      }
    } catch (err) {
      console.warn("AI scribe generation network error, utilizing local formulation:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const formattedText = `CLINICAL SOAP NOTE - PRAXIS AI TELE-PSYCHIATRY
PATIENT: ${patientName} (${patientId})
PRIMARY DIAGNOSIS: ${primaryDiagnosis}
TIMESTAMP: ${new Date().toISOString()}

SUBJECTIVE (S):
${soap.subjective}

OBJECTIVE (O):
${soap.objective}

ASSESSMENT (A):
${soap.assessment}

PLAN (P):
${soap.plan}

---
Generated with Praxis AI Multimodal Clinical Decision Support.`;

    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAndSign = () => {
    setIsSaved(true);
    logComplianceAudit({
      userId: 'dr_jenkins_84920',
      userRole: 'clinician',
      action: 'SAVE_SOAP_NOTE',
      patientId,
      details: `Digitally signed and archived psychiatric SOAP note for ${patientName}`
    });

    if (onSaveSOAP) {
      onSaveSOAP(soap);
    }

    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <Card className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl shadow-slate-200/50 text-slate-900 font-sans flex flex-col">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-3 shrink-0 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-teal-600" /> Ambient AI Clinical Scribe
            </CardTitle>
            {scribeBadge && (
              <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-mono font-bold rounded-md border border-teal-200">
                {scribeBadge}
              </span>
            )}
          </div>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Auto-synthesizes structured SOAP notes using live WebRTC transcript & multimodal biometric tensors.
          </CardDescription>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button 
            size="sm" 
            onClick={handleGenerateAISoap}
            disabled={isGenerating}
            className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            {isGenerating ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Synthesizing Note...</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5 mr-1.5 text-teal-200" /> Generate AI SOAP Note</>
            )}
          </Button>

          <Button size="sm" variant="outline" onClick={handleCopy} className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs shadow-sm">
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-teal-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>

          <Button 
            size="sm" 
            onClick={handleSaveAndSign} 
            className="bg-[#1E1B4B] hover:bg-[#2E2A72] text-white text-xs font-semibold shadow-sm"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-300" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            {isSaved ? 'Signed & Saved' : 'Sign & Save'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs pt-4 flex-1">
        {discrepancyAlert && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-center justify-between text-xs">
            <span className="flex items-center font-medium">
              <AlertTriangle className="w-4 h-4 mr-2 text-amber-600 shrink-0" />
              Symptom Masking Alert Flagged: Involuntary acoustic and facial biomarkers disagree with verbal self-report.
            </span>
            <span className="font-mono text-[11px] font-bold bg-amber-100 px-2 py-0.5 rounded text-amber-900">
              D(t) = {discrepancyD.toFixed(1)}
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Subjective (S)</label>
            <span className="text-[10px] text-slate-400 font-mono">Patient narrative, chief complaint, dialogue</span>
          </div>
          <textarea
            rows={3}
            value={soap.subjective}
            onChange={(e) => setSoap({ ...soap, subjective: e.target.value })}
            placeholder="Document patient statements, symptoms, and self-reported distress..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 font-mono text-xs shadow-inner resize-y"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Objective (O)</label>
            <span className="text-[10px] text-slate-400 font-mono">Real-time edge biomarkers, acoustics, kinematics</span>
          </div>
          <textarea
            rows={4}
            value={soap.objective}
            onChange={(e) => setSoap({ ...soap, objective: e.target.value })}
            placeholder="Quantify vocal acoustic jitter, speech velocity, facial contraction, and stress indices..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 font-mono text-xs shadow-inner resize-y"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Assessment (A)</label>
            <span className="text-[10px] text-slate-400 font-mono">Clinical formulation, ICD-11, masking risk</span>
          </div>
          <textarea
            rows={3}
            value={soap.assessment}
            onChange={(e) => setSoap({ ...soap, assessment: e.target.value })}
            placeholder="Synthesize diagnostic impression, symptom incongruence, and psychiatric risk..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 font-mono text-xs shadow-inner resize-y"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Plan (P)</label>
            <span className="text-[10px] text-slate-400 font-mono">Interventions, pharmacotherapy, safety protocol</span>
          </div>
          <textarea
            rows={3}
            value={soap.plan}
            onChange={(e) => setSoap({ ...soap, plan: e.target.value })}
            placeholder="Document clinical management steps, therapeutic homework, and follow-up..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 font-mono text-xs shadow-inner resize-y"
          />
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-100">
          <span className="flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
            Immutable HIPAA audit log entry created on digital signature
          </span>
          <span className="text-slate-400">
            NPI: 849201938 • Dr. Sarah Jenkins
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
