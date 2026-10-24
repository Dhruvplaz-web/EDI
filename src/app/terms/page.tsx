import React from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Terms of Service | Praxis AI (EDI)',
  description: 'Enterprise B2B SaaS terms of service and clinical decision support disclaimers.',
};

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service & Clinical Agreement</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Terms governing licensed psychiatric clinician and clinic organization use of Praxis AI.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>STATUTORY CLINICAL DECISION SUPPORT DISCLAIMER (INDIA)</span>
          </div>
          <p className="text-xs leading-relaxed">
            Praxis AI is an assistive Clinical Decision Support (CDS) software platform designed to support Registered Medical Practitioners (RMPs) under the Telemedicine Practice Guidelines 2020 (NMC/MoHFW) and ICMR Ethical Guidelines for AI in Healthcare. It does NOT provide autonomous medical diagnosis, emergency medical dispatch, or therapeutic prescriptions. All clinical diagnoses, treatment plans, and e-prescriptions remain the sole responsibility of the attending registered clinician. Tag: REQUIRES LAWYER REVIEW.
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-6">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-foreground">1. Clinician Licensure & Authorization</h3>
            <p>
              Access to the Clinical Consultation Suite and Triage Queue is strictly restricted to Registered Medical Practitioners (RMPs) registered with State Medical Councils (SMC) or the National Medical Commission (NMC) in India, and licensed Clinical Psychologists registered with the Rehabilitation Council of India (RCI).
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-foreground">2. Subscription Licensing & Seat Allocations</h3>
            <p>
              Clinic subscriptions are licensed on a per-clinician seat basis. Seats may not be shared simultaneously between multiple providers. Organization administrators can add or remove seats via the Admin Billing Console.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-foreground">3. Emergency Situations</h3>
            <p>
              In the event of an imminent acute psychiatric crisis, suicidal ideation with intent, or medical emergency, providers and patients must immediately contact localized emergency medical services in India: National Emergency (112), National Tele-Mental Health Helpline Tele-MANAS (14416 / 1800-891-4416), or KIRAN Mental Health Helpline (1800-599-0019) rather than relying on automated software notifications.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
