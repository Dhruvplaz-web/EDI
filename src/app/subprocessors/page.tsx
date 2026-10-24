import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, CheckCircle2, AlertTriangle, Building2 } from 'lucide-react';

export const metadata = {
  title: 'Sub-Processors & Data Fiduciary Architecture | Praxis AI',
  description: 'Authorized sub-processors, Indian data residency locations, and DPDP Data Processing Agreement (DPA) structure.',
};

const SUBPROCESSORS = [
  {
    name: 'Google Cloud Platform (GCP) India',
    entity: 'Google Cloud India Pvt. Ltd.',
    location: 'Mumbai (asia-south1) & Delhi (asia-south2), India',
    service: 'Database (Cloud Firestore), Object Storage, Cloud Compute, Session Management',
    dpaStatus: 'Direct DPA Executed (India Data Residency Guaranteed)',
    phiRisk: 'Controlled Health Data & Encrypted Consult Metadata',
  },
  {
    name: 'Razorpay Software Private Limited',
    entity: 'Razorpay Software Pvt. Ltd.',
    location: 'Bengaluru, Karnataka, India',
    service: 'INR Subscription Billing, UPI Autopay, e-NACH Mandates, Credit/Debit Cards',
    dpaStatus: 'Merchant DPA Executed (Zero Health Data Transmitted)',
    phiRisk: 'Commercial SaaS Billing Only — No Clinical Data',
  },
  {
    name: 'TRAI DLT SMS & Notification Gateways',
    entity: 'Telecom Regulatory Authority of India (TRAI) Approved DLT Partners',
    location: 'India (Domestic Telecom Infrastructure)',
    service: 'Transactional OTP Delivery & Consult Reminders (Registered DLT Headers)',
    dpaStatus: 'DLT Enterprise Agreement Executed',
    phiRisk: 'Strictly No Clinical Notes or Diagnostic Details in SMS/WhatsApp Text',
  },
  {
    name: 'Functional Error Telemetry (Sentry)',
    entity: 'Functional Error Monitoring Desk',
    location: 'EU / US (Zero PHI Egress via Client-Side Scrubber)',
    service: 'Application Crash & Unhandled Exception Telemetry',
    dpaStatus: 'DPA with Strict PII/PHI Scrubber Active',
    phiRisk: 'All Names, Phones, Emails, Aadhaar, and SOAP Text Redacted Before Egress',
  },
  {
    name: 'Stripe, Inc.',
    entity: 'Stripe Payments Singapore / US',
    location: 'Singapore / USA',
    service: 'Cross-Border International Customer Billing (Non-INR)',
    dpaStatus: 'Standard DPA Executed',
    phiRisk: 'Financial Billing Only — Zero Indian Patient Health Data',
  },
];

export default function SubprocessorsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-sm tracking-wide">Praxis AI Compliance Desk</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-medium">
            <Building2 className="w-3.5 h-3.5" />
            <span>DPDP Act 2023 § 8 Statutory Transparency</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Authorized Sub-Processors & Data Architecture</h1>
          <p className="text-neutral-400 max-w-3xl leading-relaxed text-sm">
            Under the Digital Personal Data Protection (DPDP) Act 2023, the clinical healthcare provider functions as the 
            <strong> Data Fiduciary</strong>, and Praxis AI acts as the <strong>Data Processor</strong>. This register 
            identifies all authorized third-party sub-processors engaged in delivering our tele-psychiatry platform. 
            (REQUIRES LAWYER REVIEW)
          </p>
        </div>

        {/* Fiduciary / Processor Architecture Notice */}
        <div className="p-5 mb-8 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Fiduciary-Processor Contractual Guarantees (§ 8 DPDP Act)</span>
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Praxis AI executes a binding <strong>Data Processing Agreement (DPA)</strong> with every client clinic. 
            Personal health records are hosted strictly in Google Cloud India regions (Mumbai/Delhi) under server-enforced 
            fail-closed residency gates. Sub-processors are bound by identical confidentiality and security standards.
          </p>
        </div>

        {/* Sub-processor table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Sub-Processor</th>
                <th className="py-3.5 px-4">Entity & Jurisdiction</th>
                <th className="py-3.5 px-4">Service Provided</th>
                <th className="py-3.5 px-4">Data Residency / Safeguard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {SUBPROCESSORS.map((sub, idx) => (
                <tr key={idx} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="py-4 px-4 font-medium text-white">{sub.name}</td>
                  <td className="py-4 px-4 text-neutral-400">{sub.entity}<br/><span className="text-neutral-500">{sub.location}</span></td>
                  <td className="py-4 px-4">{sub.service}</td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/50 mb-1">
                      {sub.dpaStatus}
                    </span>
                    <p className="text-[11px] text-neutral-400">{sub.phiRisk}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-4 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Sub-Processor Modification Notice:</strong> Data Fiduciaries will be notified at least 30 calendar days 
            prior to the engagement of any new sub-processor, with the statutory right to object or withdraw under the DPA. 
            All sub-processors are audited annually for ISO 27001 / SOC 2 standards. (REQUIRES LAWYER REVIEW)
          </p>
        </div>
      </main>
    </div>
  );
}
