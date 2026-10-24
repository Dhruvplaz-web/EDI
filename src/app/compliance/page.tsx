import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, CheckCircle2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Compliance & Regulatory Architecture (India) | Praxis AI',
  description: 'Designed to support DPDP Act 2023, Telemedicine Practice Guidelines 2020 (NMC/MoHFW), CDSCO SaMD guidelines, and ICMR AI ethical framework.',
};

export default function ComplianceOverviewPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-border/40 pb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-xs">
              <ArrowLeft className="w-4 h-4" /> Return to Platform
            </Button>
          </Link>
          <Badge variant="outline" className="text-primary border-primary/30 text-xs font-mono">
            Indian Statutory Architecture
          </Badge>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Compliance & Regulatory Architecture (India)</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            How Praxis AI is designed to support the Digital Personal Data Protection Act 2023, Telemedicine Practice Guidelines 2020 (NMC), and CDSCO SaMD Framework. <span className="text-amber-600 font-semibold">(REQUIRES LAWYER & CDSCO CONSULTANT REVIEW)</span>
          </p>
        </div>

        <div className="space-y-6">
          {/* Section 1: CDSCO SaMD & Telemedicine Practice Guidelines */}
          <div className="p-6 rounded-xl border border-border/60 bg-card space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-foreground">Telemedicine Practice Guidelines 2020 & CDSCO SaMD Gating</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Praxis AI separates core telepsychiatry clinical workflows (consultations, intake, e-prescribing) from experimental signal telemetry. In accordance with the CDSCO Guidance on Medical Device Software (CDSCO/MD/GD/MDSW/01/2026) and ICMR AI Ethical Guidelines (2023):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>RMP identity & registration verification gate</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Schedule X & NDPS drug prescription block</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Research Mode (RUO) gated by Ethics Approval</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Clinical psychologists blocked from prescribing</span>
              </div>
            </div>
          </div>

          {/* Section 2: DPDP Act 2023 */}
          <div className="p-6 rounded-xl border border-border/60 bg-card space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Digital Personal Data Protection (DPDP) Act 2023 Safeguards</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Technical, physical, and administrative safeguards implemented to support Data Fiduciaries (clinics) and Data Principals (patients):
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• <strong>Itemized & Unbundled Consent:</strong> Clear consents in English, Hindi, and Marathi with immediate revocability.</p>
              <p>• <strong>Sovereign Data Residency:</strong> All health data, databases, and logs reside in Indian cloud regions (asia-south1 Mumbai / asia-south2 Delhi).</p>
              <p>• <strong>Data Principal Rights (SRR):</strong> Automated workflows for access, correction, erasure requests, and Nominated Representative registration.</p>
              <p>• <strong>Dual-Clock Incident Response:</strong> 6-hour CERT-In cybersecurity reporting alongside 72-hour Data Protection Board of India detailed breach notifications.</p>
              <p>• <strong>Data Minimization:</strong> Absolute ban on Aadhaar collection, zero server-side consult media recording in standard mode.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            For detailed statutory citations, source URLs, and legal verification dates, review the full matrix.
          </p>
          <Link href="/docs/INDIA_COMPLIANCE_MATRIX.md" target="_blank">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" /> View INDIA_COMPLIANCE_MATRIX.md
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
