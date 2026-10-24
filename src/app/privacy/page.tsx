import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, EyeOff, Server, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Privacy Policy & DPDP Disclosure (India) | Praxis AI',
  description: 'Digital Personal Data Protection Act 2023 (DPDP) aligned privacy policy, Indian data residency, and Grievance Officer contact details.',
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
          <span className="text-xs text-muted-foreground font-mono">DPDP Act 2023 • Effective Date: Late October 2026</span>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy & Patient Rights (India)</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            How Praxis AI protects personal health data under the Digital Personal Data Protection Act 2023, Telemedicine Practice Guidelines 2020, and Mental Healthcare Act 2017. <span className="text-amber-600 font-semibold">(REQUIRES LAWYER REVIEW)</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
            <EyeOff className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold">Zero Video Retention</h2>
            <p className="text-xs text-muted-foreground">
              Peer-to-peer WebRTC video streams are processed in volatile client device memory and discarded frame-by-frame. No consultation audio/video recordings are stored on servers without explicit unbundled recording consent.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
            <Server className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold">Indian Data Residency</h2>
            <p className="text-xs text-muted-foreground">
              All health databases, patient profiles, e-prescriptions, and audit logs reside strictly in Indian sovereign regions (Google Cloud / Firebase asia-south1 Mumbai and asia-south2 Delhi).
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold">Unbundled & Revocable Consent</h2>
            <p className="text-xs text-muted-foreground">
              Consents for consultation, camera/mic streaming, and research telemetry are presented separately in English, Hindi, and Marathi, and may be withdrawn at any time with immediate cessation.
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-6">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-foreground">1. Fiduciary vs. Processor Allocation under DPDP Act 2023</h3>
            <p>
              In our B2B healthcare model, the subscriber clinic, hospital, or registered medical practice acts as the <strong>Data Fiduciary</strong> (§ 2(i)), determining the purposes and means of patient consultations and clinical care. Praxis AI operates strictly as a <strong>Data Processor</strong> (§ 2(k)), processing personal data on behalf of the clinic under a binding statutory Data Processing Agreement (DPA).
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-foreground">2. Biometric Telemetry & Research Mode Gating</h3>
            <p>
              Under Indian CDSCO Medical Device Software guidance (CDSCO/MD/GD/MDSW/01/2026) and ICMR ethical guidelines, objective vocal acoustic analysis (fundamental frequency F0, jitter, shimmer) and facial kinematics (AU4 corrugator brow lowerer, AU15 depressor) are classified as investigational software. In standard clinical care, all biomarker scores and discrepancy alerts are <strong>OFF by default</strong>. They may only be activated in Research Mode with documented Institutional Ethics Committee (IEC/IRB) approval.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-foreground">3. Protection of Children & Minors (§ 9)</h3>
            <p>
              Praxis AI enforces date of birth validation for all registrations. For individuals under 18 years of age, verifiable guardian consent is mandatory prior to consultation. In strict compliance with Section 9(3) of the DPDP Act 2023, <strong>all behavioral tracking, biomarker profiling, and biometric telemetry are permanently disabled for minors</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-foreground">4. Data Principal Rights & Nominated Representatives</h3>
            <p>
              Data Principals (patients) or their registered Nominated Representatives under the Mental Healthcare Act 2017 (§ 14) and DPDP Act 2023 (§ 14) may exercise the following rights through the in-app portal or by contacting the clinic:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Right to Access:</strong> View and export personal consultation history and clinical summaries.</li>
              <li><strong>Right to Correction:</strong> Update inaccurate demographic, contact, or guardian records.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of non-mandatory telemetry data (subject to mandatory 3-year medical record retention under Telemedicine Practice Guidelines 2020).</li>
              <li><strong>Right of Grievance Redressal:</strong> Submit complaints regarding data processing directly to our Grievance Officer.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-foreground">5. Sub-Processor Registry (India Resident)</h3>
            <p>
              Praxis AI engages the following vetted sub-processors under strict data protection terms:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google Cloud Platform / Firebase:</strong> Database and encrypted file storage (Region: asia-south1 Mumbai / asia-south2 Delhi).</li>
              <li><strong>Razorpay Software Private Limited:</strong> Regulated Indian payment aggregator for domestic INR subscriptions (Mumbai, India).</li>
              <li><strong>TRAI-Registered SMS & WhatsApp Gateway:</strong> Transactional alerts and OTP authentication with DLT principal registration (India).</li>
            </ul>
          </section>

          {/* Section 6: Grievance Officer Details */}
          <section className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">6. Grievance Officer & Redressal Mechanism (§ 32 DPDP Act 2023)</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If you have any questions, concerns, or grievances regarding the processing of your personal data or if you wish to exercise your statutory rights as a Data Principal, please contact our designated Grievance Officer:
            </p>
            <div className="space-y-1 text-xs text-foreground font-mono">
              <p><strong>Designation:</strong> Data Protection & Grievance Redressal Officer</p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span><strong>Email:</strong> grievance@praxis-ai.in</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span><strong>Address:</strong> Level 5, Platina, Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051, India</span>
              </p>
              <p><strong>Resolution SLA:</strong> Acknowledgment within 24 hours; resolution within 7 working days.</p>
              <p className="text-[11px] text-muted-foreground pt-1">
                If unresolved within 30 days, Data Principals have the statutory right to escalate complaints to the <strong>Data Protection Board of India (DPBI)</strong>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
