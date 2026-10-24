import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, EyeOff, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Privacy Policy | Praxis AI (EDI)',
  description: 'HIPAA-aligned data privacy policy and edge biometric processing disclosure.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-border/40 pb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-xs">
              <ArrowLeft className="w-4 h-4" /> Return to Platform
            </Button>
          </Link>
          <span className="text-xs text-muted-foreground">Effective Date: October 24, 2026</span>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy & Telemetry Disclosure</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            How Praxis AI protects patient information, executes edge biometric processing, and complies with HIPAA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
            <EyeOff className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold">Zero Video Retention</h2>
            <p className="text-xs text-muted-foreground">
              Webcam video feeds are processed in volatile client device memory and discarded frame-by-frame. No raw video recordings are stored on servers.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold">Encrypted in Transit</h2>
            <p className="text-xs text-muted-foreground">
              Peer-to-peer consultations are protected with WebRTC DTLS-SRTP 256-bit encryption. All server requests mandate TLS 1.3.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
            <Server className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold">Multi-Tenant Isolation</h2>
            <p className="text-xs text-muted-foreground">
              Clinical records and telemetry are isolated by clinic organization ID (orgId) with strict database-level security rules.
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-6">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-foreground">1. Protected Health Information (PHI) & HIPAA</h3>
            <p>
              Praxis AI operates in compliance with the Health Insurance Portability and Accountability Act of 1996 (HIPAA). When deployed for healthcare providers (Covered Entities), Praxis AI acts as a Business Associate and executes standard Business Associate Agreements (BAAs).
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-foreground">2. Biometric & Kinematic Telemetry Processing</h3>
            <p>
              During a consultation, client-side algorithms compute numerical indices representing facial action unit kinematics (AU4 brow lowerer, AU15 lip depressor) and vocal acoustic prosody (fundamental frequency F0, jitter %, shimmer %). These numerical summaries are provided exclusively to the treating clinician as clinical decision support.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-foreground">3. Third-Party Data Disclosures</h3>
            <p>
              When speech-to-text or automated SOAP note synthesis is enabled, patient identifiers are pseudonymized prior to processing, and data is transmitted exclusively to BAA-covered enterprise healthcare infrastructure.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-foreground">4. Patient Rights & Data Portability</h3>
            <p>
              Patients have the right to inspect, download, or request deletion of their intake records and longitudinal telemetry logs by contacting their clinic&apos;s privacy officer.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
