import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, CheckCircle2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Compliance & Regulatory Standards | Praxis AI (EDI)',
  description: 'FDA Section 520(o) Non-Device CDS criteria, HIPAA safeguards, and BAA requirements.',
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
          <Badge variant="outline" className="text-primary border-primary/30 text-xs">
            Regulatory Architecture
          </Badge>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Compliance & Regulatory Architecture</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            How Praxis AI aligns with FDA Section 520(o) Non-Device CDS criteria and the HIPAA Security Rule.
          </p>
        </div>

        <div className="space-y-6">
          {/* Section 1: FDA CDS */}
          <div className="p-6 rounded-xl border border-border/60 bg-card space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-foreground">FDA Section 520(o) Non-Device CDS Compliance</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Praxis AI is architected under the 21st Century Cures Act exemption (21 U.S.C. § 360j(o)(1)(E)). The software provides objective kinematic and prosodic signal displays to assist qualified clinicians, while ensuring the healthcare professional can independently review the basis of every recommendation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Full formula and weight transparency (XAI)</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>No automated dosing or therapeutic lock-in</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Attending clinician maintains full authority</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Commercial standard webcam/mic hardware only</span>
              </div>
            </div>
          </div>

          {/* Section 2: HIPAA Security Rule */}
          <div className="p-6 rounded-xl border border-border/60 bg-card space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">HIPAA Security Rule Safeguards (45 CFR § 164)</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Technical, physical, and administrative safeguards are implemented across all tiers:
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• <strong>Immutable Audit Trails:</strong> Every record mutation, session creation, and break-glass override is recorded to an append-only, non-deletable log.</p>
              <p>• <strong>Tenant Data Isolation:</strong> Clinician and patient queries are partitioned by organization ID (orgId) with database-enforced security rules.</p>
              <p>• <strong>DTLS-SRTP WebRTC Encryption:</strong> Real-time tele-consultation streams are encrypted peer-to-peer with zero server-side recording retention.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            For technical details and vendor BAA requirements, review the full compliance specification.
          </p>
          <Link href="/docs/COMPLIANCE.md" target="_blank">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" /> View COMPLIANCE.md
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
