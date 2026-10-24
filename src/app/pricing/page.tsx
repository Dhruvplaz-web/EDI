'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SAAS_PLANS, PlanTier, calculateSubscriptionCost } from '@/lib/stripe/plans';
import { Check, Shield, Zap, Sparkles, Building2, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedSeats, setSelectedSeats] = useState<Record<PlanTier, number>>({
    starter: 1,
    professional: 5,
    enterprise: 20,
  });

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 selection:bg-purple-100 selection:text-purple-900">
      {/* Header Navigation */}
      <header className="border-b border-neutral-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-neutral-900">
            <span className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-sm font-black shadow-sm">
              PX
            </span>
            <span>Praxis<span className="text-purple-600">.AI</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="#pricing-cards"
              className="px-4 py-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-700 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparent Per-Clinician B2B SaaS Subscriptions</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 mb-6">
          Predictable Clinical Telemetry Pricing.
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-10">
          Equip your psychiatric practice with edge bio-acoustic jitter extraction, kinematic facial Action Unit monitoring, and ambient SOAP documentation.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center p-1 rounded-xl bg-neutral-200/80 border border-neutral-300/80">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              billingCycle === 'annual'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Save 20%
            </span>
          </button>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section id="pricing-cards" className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(['starter', 'professional', 'enterprise'] as PlanTier[]).map((tierKey) => {
            const plan = SAAS_PLANS[tierKey];
            const isPro = tierKey === 'professional';
            const price = billingCycle === 'annual' ? plan.pricePerSeatAnnual : plan.pricePerSeatMonthly;

            return (
              <div
                key={tierKey}
                className={`relative rounded-2xl bg-white border p-8 flex flex-col justify-between transition-all ${
                  isPro
                    ? 'border-purple-500 shadow-xl shadow-purple-500/10 ring-2 ring-purple-500/20'
                    : 'border-neutral-200 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-600 text-white shadow-sm">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-neutral-900">{plan.name}</h2>
                    {tierKey === 'starter' && <Zap className="w-5 h-5 text-neutral-400" />}
                    {tierKey === 'professional' && <Shield className="w-5 h-5 text-purple-600" />}
                    {tierKey === 'enterprise' && <Building2 className="w-5 h-5 text-neutral-700" />}
                  </div>

                  <p className="text-sm text-neutral-600 min-h-[40px] mb-6">{plan.tagline}</p>

                  <div className="mb-6 pb-6 border-b border-neutral-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tight text-neutral-900">${price}</span>
                      <span className="text-sm font-medium text-neutral-500">/ clinician / mo</span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      {billingCycle === 'annual' ? 'Billed annually' : 'Billed monthly'} &bull; {plan.trialDays}-day free trial
                    </p>
                  </div>

                  {/* Seat Configurator */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center text-xs font-semibold text-neutral-700 mb-2">
                      <span>Seats Needed</span>
                      <span className="tabular-nums font-bold text-neutral-900">{selectedSeats[tierKey]} clinician(s)</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={plan.maxSeats === 9999 ? 100 : plan.maxSeats}
                      value={selectedSeats[tierKey]}
                      onChange={(e) =>
                        setSelectedSeats({
                          ...selectedSeats,
                          [tierKey]: Number(e.target.value),
                        })
                      }
                      className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
                      <span>1</span>
                      <span>Max {plan.maxSeats === 9999 ? 'Unlimited' : plan.maxSeats}</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Included Capabilities</p>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-neutral-700">
                        {feat.included ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center shrink-0 mt-0.5 text-neutral-300 text-[10px]">
                            &times;
                          </span>
                        )}
                        <span className={feat.included ? 'text-neutral-700' : 'text-neutral-400'}>{feat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Link
                    href={`/login?mode=signup&tier=${tierKey}&seats=${selectedSeats[tierKey]}`}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      isPro
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                    }`}
                  >
                    <span>Start {plan.trialDays}-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-center text-[11px] text-neutral-400 mt-2">
                    Est. total: ${(price * selectedSeats[tierKey]).toLocaleString()}/mo
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Compliance & Security Guarantee */}
      <footer className="border-t border-neutral-200 bg-white py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-500">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-neutral-800">Praxis AI Healthcare Platform</span>
            <span>&bull;</span>
            <span>HIPAA 45 CFR § 164 Compliant</span>
            <span>&bull;</span>
            <span>FDA 21 U.S.C. § 360j(o)(1)(E) CDS Grounding</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Praxis AI Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
