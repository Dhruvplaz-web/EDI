import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Shield, Video, FileText, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#09090B] flex flex-col justify-between font-sans">
      {/* Luxury Light Header */}
      <header className="border-b border-[#E4E4E7] bg-white/95 backdrop-blur-md px-6 py-3.5 flex justify-between items-center sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#09090B] flex items-center justify-center text-white">
            <Activity className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="text-left">
            <span className="font-bold text-sm tracking-tight text-[#09090B]">Praxis AI</span>
            <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F4F5] text-[#52525B] border border-[#E4E4E7]">
              Clinical Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/patient/intake">
            <Button variant="outline" className="border-[#E4E4E7] text-[#27272A] hover:bg-[#F4F4F5] text-xs font-medium rounded-lg h-8 px-3">
              Patient Check-In
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="border-[#E4E4E7] text-[#27272A] hover:bg-[#F4F4F5] text-xs font-medium rounded-lg h-8 px-3">
              Sign In
            </Button>
          </Link>
          <Link href="/api/dev-login?role=clinician">
            <Button className="bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-medium rounded-lg h-8 px-3.5 shadow-sm">
              Clinician Portal
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-14 space-y-10 flex-1 text-center">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F0F6FF] text-[#0066FF] rounded-full text-xs font-mono font-medium border border-[#BFDBFE]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
          <span>Clinical Decision Support System</span>
          <span className="text-[#BFDBFE]">•</span>
          <span>Telemedicine Guidelines 2020 (NMC) • DPDP Act 2023</span>
        </div>

        {/* Hero Typography */}
        <div className="space-y-3 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#09090B] leading-tight">
            Objective Tele-Psychiatry & Clinical Decision Support
          </h1>
          <p className="text-sm sm:text-base text-[#52525B] max-w-2xl mx-auto leading-relaxed">
            Real-time acoustic and facial signal analysis to support healthcare providers in identifying clinical stress and mood indicators during telehealth consultations.
          </p>
        </div>

        {/* 4 Interactive Portal Entrypoints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 text-left">
          <Link href="/api/dev-login?role=clinician" className="p-5 bg-white/95 backdrop-blur-sm rounded-xl border border-[#E4E4E7] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] hover:border-[#0066FF] hover:shadow-[0_2px_12px_rgba(0,102,255,0.08)] transition-all group">
            <div className="w-9 h-9 rounded-lg bg-[#F0F6FF] text-[#0066FF] flex items-center justify-center mb-3 border border-[#BFDBFE]">
              <Activity className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h2 className="font-semibold text-sm text-[#09090B] mb-1 flex items-center justify-between">
              Clinician Queue
              <ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#0066FF] transition-colors" />
            </h2>
            <p className="text-xs text-[#71717A] leading-relaxed">Prioritized patient intake, real-time video room, and clinical note drafts.</p>
          </Link>

          <Link href="/patient/intake" className="p-5 bg-white/95 backdrop-blur-sm rounded-xl border border-[#E4E4E7] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] hover:border-[#0066FF] hover:shadow-[0_2px_12px_rgba(0,102,255,0.08)] transition-all group">
            <div className="w-9 h-9 rounded-lg bg-[#F4F4F5] text-[#27272A] flex items-center justify-center mb-3 border border-[#E4E4E7]">
              <Video className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h2 className="font-semibold text-sm text-[#09090B] mb-1 flex items-center justify-between">
              Patient Check-In
              <ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#0066FF] transition-colors" />
            </h2>
            <p className="text-xs text-[#71717A] leading-relaxed">Intake questionnaires, guided breathing exercises, and baseline check-in.</p>
          </Link>

          <Link href="/api/dev-login?role=patient" className="p-5 bg-white/95 backdrop-blur-sm rounded-xl border border-[#E4E4E7] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] hover:border-[#0066FF] hover:shadow-[0_2px_12px_rgba(0,102,255,0.08)] transition-all group">
            <div className="w-9 h-9 rounded-lg bg-[#F4F4F5] text-[#27272A] flex items-center justify-center mb-3 border border-[#E4E4E7]">
              <Shield className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h2 className="font-semibold text-sm text-[#09090B] mb-1 flex items-center justify-between">
              Patient Portal
              <ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#0066FF] transition-colors" />
            </h2>
            <p className="text-xs text-[#71717A] leading-relaxed">Personal health summary, symptom tracking records, and past visits.</p>
          </Link>

          <Link href="/api/dev-login?role=billing_admin" className="p-5 bg-white/95 backdrop-blur-sm rounded-xl border border-[#E4E4E7] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] hover:border-[#0066FF] hover:shadow-[0_2px_12px_rgba(0,102,255,0.08)] transition-all group">
            <div className="w-9 h-9 rounded-lg bg-[#F4F4F5] text-[#27272A] flex items-center justify-center mb-3 border border-[#E4E4E7]">
              <FileText className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h2 className="font-semibold text-sm text-[#09090B] mb-1 flex items-center justify-between">
              Administration
              <ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#0066FF] transition-colors" />
            </h2>
            <p className="text-xs text-[#71717A] leading-relaxed">Clinic compliance audit logs, billing code tracking, and user management.</p>
          </Link>
        </div>

        {/* Technology Architecture Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
          <Card className="rounded-xl border border-[#E4E4E7] bg-white/95 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <CardHeader className="p-5">
              <Video className="h-5 w-5 text-[#0066FF] mb-2" strokeWidth={1.75} />
              <CardTitle className="text-sm font-semibold text-[#09090B]">Local Audio Processing</CardTitle>
              <CardDescription className="text-xs text-[#71717A] leading-relaxed">
                Vocal jitter and pitch variations are computed directly inside the browser with zero external server audio transmission.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-xl border border-[#E4E4E7] bg-white/95 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <CardHeader className="p-5">
              <Activity className="h-5 w-5 text-[#0066FF] mb-2" strokeWidth={1.75} />
              <CardTitle className="text-sm font-semibold text-[#09090B]">Multi-Signal Correlation</CardTitle>
              <CardDescription className="text-xs text-[#71717A] leading-relaxed">
                Correlates facial micro-movement patterns with vocal acoustics to provide objective assistance to the clinician.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-xl border border-[#E4E4E7] bg-white/95 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <CardHeader className="p-5">
              <Shield className="h-5 w-5 text-[#0066FF] mb-2" strokeWidth={1.75} />
              <CardTitle className="text-sm font-semibold text-[#09090B]">Clinical Dataset Validation</CardTitle>
              <CardDescription className="text-xs text-[#71717A] leading-relaxed">
                Validated against clinical psychiatry benchmarks to ensure consistent and reliable decision-support telemetry.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Luxury Light Footer */}
      <footer className="border-t border-[#E4E4E7] bg-white py-6 text-center text-xs text-[#71717A] space-y-2">
        <p className="font-medium text-[#27272A]">© 2026 Praxis AI • Clinical Tele-Psychiatry Platform (India)</p>
        <p className="max-w-3xl mx-auto text-[11px] text-[#A1A1AA] leading-relaxed px-4">
          Statutory Notice: Praxis AI is designed to support registered medical practitioners under the Telemedicine Practice Guidelines 2020 (NMC/MoHFW), DPDP Act 2023, and ICMR AI Ethical Framework. Investigational features are restricted to Research Mode under Institutional Ethics Committee approval. Not for autonomous diagnosis or prescribing. (REQUIRES DOCTOR REVIEW)
        </p>
      </footer>
    </div>
  );
}
