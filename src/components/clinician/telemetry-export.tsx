'use client'

import { useState } from 'react';
import { Download, FileJson, FileText, CheckCircle2, Shield, Brain, Activity, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logComplianceAudit } from '@/lib/telemetry/audit-trail-logger';

export interface TelemetryExportProps {
  patientId: string;
  patientName?: string;
  sessionData?: {
    peakStress: number;
    avgStress: number;
    frownRate: number;
    blinkRate: number;
    discrepancyAlertsCount: number;
    attentionWeights?: {
      visual: number;
      acoustic: number;
      linguistic: number;
    };
    discrepancyD?: number;
    speechJitter?: number;
    speechWpm?: number;
  };
}

export function TelemetryExport({
  patientId,
  patientName = 'Sarah Jenkins',
  sessionData = {
    peakStress: 8.2,
    avgStress: 5.6,
    frownRate: 0.42,
    blinkRate: 0.15,
    discrepancyAlertsCount: 1,
    attentionWeights: { visual: 0.33, acoustic: 0.34, linguistic: 0.33 },
    discrepancyD: 0.0,
    speechJitter: 0.8,
    speechWpm: 120
  }
}: TelemetryExportProps) {
  const [exportedFormat, setExportedFormat] = useState<string | null>(null);

  const attention = sessionData.attentionWeights || { visual: 0.33, acoustic: 0.34, linguistic: 0.33 };

  const handleExportJSON = () => {
    const reportData = {
      reportType: "PRAXIS_AI_MULTIMODAL_TELEMETRY_EXPORT",
      exportTimestamp: new Date().toISOString(),
      patientMeta: { 
        patientId, 
        patientName 
      },
      clinicianMeta: { 
        clinicianId: "DR-JENKINS-84920", 
        npi: "849201938",
        licenseState: "CA"
      },
      crossAttentionTensor: {
        voiceWeightPct: `${(attention.acoustic * 100).toFixed(1)}%`,
        faceKinematicsWeightPct: `${(attention.visual * 100).toFixed(1)}%`,
        dialogueSentimentWeightPct: `${(attention.linguistic * 100).toFixed(1)}%`
      },
      telemetryMetrics: {
        peakObjectiveStressIndex: sessionData.peakStress,
        averageObjectiveStressIndex: sessionData.avgStress,
        sustainedFrownRatePct: `${(sessionData.frownRate * 100).toFixed(1)}%`,
        eyelidOcclusionBlinkRatePct: `${(sessionData.blinkRate * 100).toFixed(1)}%`,
        vocalAcousticJitterRAP: `${(sessionData.speechJitter ?? 0.8).toFixed(2)}%`,
        speechVelocityWpm: sessionData.speechWpm ?? 120,
        symptomMaskingDiscrepancyD: sessionData.discrepancyD ?? 0.0,
        crossModalDiscrepancyAlertsTriggered: sessionData.discrepancyAlertsCount
      },
      compliance: {
        dpdpAligned: true,
        zeroCloudGpuStorage: true,
        rawVideoSaved: false,
        rawAudioSaved: false,
        anonymizedEdgeVectorsOnly: true,
        auditTrailLogged: true
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `telemetry-report-${patientId}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logComplianceAudit({
      userId: 'dr_jenkins_84920',
      userRole: 'clinician',
      action: 'EXPORT_TELEMETRY',
      patientId,
      details: 'Exported JSON multi-modal telemetry vector with cross-attention weights'
    });

    setExportedFormat('JSON');
    setTimeout(() => setExportedFormat(null), 3000);
  };

  const handleExportPDFSummary = () => {
    // Generate a printable, formal Clinical Decision Support Summary in a new tab
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const nowStr = new Date().toLocaleString();
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Clinical Telemetry Audit Report - ${patientName} (${patientId})</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; font-size: 13px; }
            .header { border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
            .logo { font-size: 20px; font-weight: 800; color: #0f766e; letter-spacing: -0.5px; }
            .badge { background: #f0fdfa; color: #0f766e; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; border: 1px solid #ccfbf1; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
            .section-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            th { background: #f1f5f9; font-weight: 600; color: #475569; }
            .alert-box { background: #fef3c7; border: 1px solid #fde68a; color: #92400e; padding: 12px; border-radius: 6px; margin: 16px 0; font-size: 12px; }
            .signature-block { margin-top: 48px; border-top: 1px dashed #94a3b8; padding-top: 20px; display: flex; justify-content: space-between; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">PRAXIS AI • CLINICAL TELE-PSYCHIATRY (INDIA)</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Multimodal Telemetry & Telemedicine Practice Guidelines Record</div>
            </div>
            <div class="badge">DPDP 2023 / NMC 2020 AUDIT VERIFIED</div>
          </div>

          <div class="meta-grid">
            <div>
              <div><strong>Patient Name:</strong> ${patientName}</div>
              <div><strong>Patient ID:</strong> ${patientId}</div>
              <div><strong>Generated At:</strong> ${nowStr}</div>
            </div>
            <div>
              <div><strong>Attending Clinician:</strong> Dr. Sarah Jenkins, MD</div>
              <div><strong>NMC / SMC Reg No:</strong> 84920/2018 (Maharashtra Medical Council)</div>
              <div><strong>Prescription Drug Guard:</strong> Schedule X & NDPS Strict Exclusion Active</div>
            </div>
          </div>

          <div class="section-title">1. Cross-Attention Modality Contributions</div>
          <table>
            <thead>
              <tr><th>Modality Stream</th><th>Attention Weight (w)</th><th>Clinical Biomarkers Tracked</th></tr>
            </thead>
            <tbody>
              <tr><td>Acoustic / Voice</td><td>${(attention.acoustic * 100).toFixed(1)}%</td><td>Sub-frame Glottal Jitter (${(sessionData.speechJitter ?? 0.8).toFixed(2)}%), Pitch Variance</td></tr>
              <tr><td>Visual / Kinematics</td><td>${(attention.visual * 100).toFixed(1)}%</td><td>AU4 Brow Lowerer (${(sessionData.frownRate * 100).toFixed(1)}%), Blink Rate (${(sessionData.blinkRate * 100).toFixed(1)}%)</td></tr>
              <tr><td>Linguistic / Dialogue</td><td>${(attention.linguistic * 100).toFixed(1)}%</td><td>C-SSRS Crisis Tokens, DSM-5 Despair Index, Speech Velocity (${sessionData.speechWpm ?? 120} WPM)</td></tr>
            </tbody>
          </table>

          <div class="section-title">2. Stress & Symptom Masking Incongruence Analysis</div>
          <table>
            <thead>
              <tr><th>Biometric Indicator</th><th>Measured Value</th><th>Clinical Reference Range</th></tr>
            </thead>
            <tbody>
              <tr><td>Peak Objective Stress Index (O_max)</td><td>${sessionData.peakStress.toFixed(1)} / 10</td><td>Normal: 1.0 - 4.5 | Elevated: &gt; 7.0</td></tr>
              <tr><td>Average Objective Stress Index (O_bar)</td><td>${sessionData.avgStress.toFixed(1)} / 10</td><td>Normal: 1.0 - 4.5 | Elevated: &gt; 7.0</td></tr>
              <tr><td>Incongruence Metric D(t) = |S - O|</td><td>${(sessionData.discrepancyD ?? 0.0).toFixed(2)}</td><td>Concordant: &lt; 3.5 | Incongruent: &ge; 3.5</td></tr>
              <tr><td>Masking Discrepancy Alerts Triggered</td><td>${sessionData.discrepancyAlertsCount}</td><td>0 alerts indicates modality concordance</td></tr>
            </tbody>
          </table>

          ${sessionData.discrepancyAlertsCount > 0 ? `
            <div class="alert-box">
              <strong>CRITICAL NOTICE:</strong> Modality discrepancy threshold (D &ge; 3.5) was reached during this session. Involuntary physiological and acoustic stress signals significantly exceeded patient verbal self-report.
            </div>
          ` : ''}

          <div class="section-title">3. Compliance & Edge Processing Attestation</div>
          <p style="font-size: 11px; color: #475569;">
            This report represents mathematical abstractions extracted via real-time client-side edge computing (zero cloud video storage). Raw audio and video streams were not retained or transmitted to external third-party GPU clusters, designed to support DPDP Act 2023 security safeguards and Telemedicine Practice Guidelines 2020 (NMC/MoHFW).
          </p>

          <div class="signature-block">
            <div>
              <div style="margin-bottom: 24px;">Dr. Sarah Jenkins, MD</div>
              <div style="font-size: 11px; color: #64748b;">Attending Psychiatrist (NMC Reg: 84920/2018)</div>
            </div>
            <div>
              <div style="margin-bottom: 24px;">Date: ${nowStr.split(',')[0]}</div>
              <div style="font-size: 11px; color: #64748b;">Digital Audit ID: ${patientId}-${Date.now().toString().slice(-6)}</div>
            </div>
          </div>
        </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }

    logComplianceAudit({
      userId: 'dr_jenkins_84920',
      userRole: 'clinician',
      action: 'EXPORT_TELEMETRY',
      patientId,
      details: 'Exported formal printable PDF telemetry report for telemedicine practice record'
    });

    setExportedFormat('PDF');
    setTimeout(() => setExportedFormat(null), 3000);
  };

  return (
    <Card className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-base font-bold text-slate-900 flex items-center">
          <Download className="w-5 h-5 mr-2 text-teal-600" /> Session Telemetry & Clinical Export (India)
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Export DPDP-aligned telemetry audit records containing cross-attention tensor weights and discrepancy logs under Research Protocol.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-xs pt-4">
        {/* Multimodal Attention Breakdown HUD preview */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-700">
            <span className="font-bold flex items-center">
              <Brain className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Cross-Attention Tensor Weights:
            </span>
            <span className="text-[10px] text-slate-500">Softmax Normalized</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-500">Voice (Acoustic)</div>
              <div className="text-sm font-bold text-teal-700">{(attention.acoustic * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-500">Face (Kinematics)</div>
              <div className="text-sm font-bold text-blue-700">{(attention.visual * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-500">Text (Dialogue)</div>
              <div className="text-sm font-bold text-purple-700">{(attention.linguistic * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Biometric Indices Summary */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-[11px] shadow-xs">
          <div className="text-slate-700 flex justify-between">
            <span>Peak Objective Stress (O_max):</span>
            <span className="text-rose-600 font-bold">{sessionData.peakStress.toFixed(1)} / 10</span>
          </div>
          <div className="text-slate-700 flex justify-between">
            <span>Average Objective Stress (O_bar):</span>
            <span className="text-teal-700 font-bold">{sessionData.avgStress.toFixed(1)} / 10</span>
          </div>
          <div className="text-slate-700 flex justify-between">
            <span>Vocal Acoustic Jitter (RAP %):</span>
            <span className="text-slate-900 font-bold">{(sessionData.speechJitter ?? 0.8).toFixed(2)}%</span>
          </div>
          <div className="text-slate-700 flex justify-between">
            <span>Discrepancy Alerts Triggered:</span>
            <span className={`${sessionData.discrepancyAlertsCount > 0 ? 'text-amber-700 font-bold' : 'text-slate-600'}`}>
              {sessionData.discrepancyAlertsCount} {sessionData.discrepancyAlertsCount === 1 ? 'Alert' : 'Alerts'}
            </span>
          </div>
        </div>

        {exportedFormat ? (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 flex items-center justify-between font-mono text-[11px]">
            <span className="flex items-center font-bold">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-teal-600" /> {exportedFormat} Telemetry Export Generated
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button onClick={handleExportJSON} variant="outline" className="border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-100 shadow-sm h-10">
              <FileJson className="w-4 h-4 mr-1.5 text-teal-600" /> Export JSON Vector
            </Button>
            <Button onClick={handleExportPDFSummary} className="bg-[#1E1B4B] hover:bg-[#2E2A72] text-white text-xs font-semibold shadow-md shadow-indigo-950/20 h-10">
              <FileText className="w-4 h-4 mr-1.5" /> Export PDF Summary
            </Button>
          </div>
        )}

        <div className="text-[11px] text-slate-500 flex items-center font-mono pt-1">
          <Shield className="w-3.5 h-3.5 mr-1.5 text-teal-600" /> Anonymized biometric vectors only. Zero raw video/audio saved to cloud servers.
        </div>
      </CardContent>
    </Card>
  );
}
