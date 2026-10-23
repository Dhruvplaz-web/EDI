import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Shield, Video } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="border-b bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Activity className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl text-slate-900">XAI-Triage Tele-Psychiatry</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/patient/intake">
            <Button variant="outline" className="text-teal-700 border-teal-200 bg-teal-50 hover:bg-teal-100 font-semibold text-xs">
              Patient Intake
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="text-xs font-semibold">Sign In</Button>
          </Link>
          <Link href="/api/dev-login?role=clinician">
            <Button className="bg-[#1E1B4B] hover:bg-[#2E2A72] text-white text-xs font-bold shadow-md shadow-indigo-950/20">
              Clinician Portal
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 text-center space-y-8 flex-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-mono font-bold border border-teal-200">
          <span>Non-Device Clinical Decision Support (CDS)</span>
          <span>•</span>
          <span>FDA Section 520(o) Compliant</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto">
          Praxis AI: Explainable Multimodal Tele-Psychiatry
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Zero-cloud token deterministic signal processing and scaled dot-product cross-attention. Detects psychiatric symptom masking and emotional incongruence in real-time.
        </p>

        {/* 4 Interactive Portal Entrypoints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <Link href="/api/dev-login?role=clinician" className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all text-left group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Clinician Triage Board</h3>
            <p className="text-xs text-slate-500">Live WebRTC room, cross-attention radar HUD, and automated SOAP scribe.</p>
          </Link>

          <Link href="/patient/intake" className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-400 transition-all text-left group">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Patient Check-In</h3>
            <p className="text-xs text-slate-500">PHQ-9 screening, box breathing bio-feedback, and 15s baseline calibration.</p>
          </Link>

          <Link href="/api/dev-login?role=patient" className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all text-left group">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Patient Portal (PHR)</h3>
            <p className="text-xs text-slate-500">Personal health records, acoustic mood journaling, and telehealth consults.</p>
          </Link>

          <Link href="/api/dev-login?role=billing_admin" className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all text-left group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Operations & Billing</h3>
            <p className="text-xs text-slate-500">Audit trail compliance logs, CPT code billing, and clinic operations.</p>
          </Link>
        </div>

        {/* Technology Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-left">
          <Card className="rounded-2xl border-slate-200">
            <CardHeader>
              <Video className="h-6 w-6 text-indigo-600 mb-1" />
              <CardTitle className="text-sm font-bold">Local AudioWorklet DSP</CardTitle>
              <CardDescription className="text-xs">
                Glottal period perturbation (RAP jitter) and shimmer calculated directly on the client, overcoming Opus codec distortion.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardHeader>
              <Activity className="h-6 w-6 text-teal-600 mb-1" />
              <CardTitle className="text-sm font-bold">Cross-Attention Fusion</CardTitle>
              <CardDescription className="text-xs">
                True scaled dot-product attention Softmax(QKᵀ / √d)V correlating micro-expressions with vocal tremor.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardHeader>
              <Shield className="h-6 w-6 text-amber-600 mb-1" />
              <CardTitle className="text-sm font-bold">DAIC-WOZ Ground Truth</CardTitle>
              <CardDescription className="text-xs">
                Empirical benchmark suite achieving 100% sensitivity on masked incongruence versus 0% for unimodal NLP.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      <footer className="border-t bg-white py-6 text-center text-xs text-slate-500 space-y-2">
        <p className="font-medium text-slate-700">© 2026 Praxis AI (XAI-Triage Tele-Psychiatry Platform).</p>
        <p className="max-w-3xl mx-auto text-[11px] text-slate-400">
          Statutory Notice: Praxis AI operates strictly as a non-device Clinical Decision Support (CDS) platform compliant with FDA Section 520(o)(1)(E) and CDSCO/DISHA telehealth standards. Autonomous medical diagnoses are prohibited; all biomarker analyses and automated SOAP summaries require licensed clinician review.
        </p>
      </footer>
    </div>
  );
}
