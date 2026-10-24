"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SAAS_PLANS, PlanTier, calculateSubscriptionCost } from "@/lib/stripe/plans";
import { 
  CreditCard, Users, ShieldCheck, CheckCircle2, 
  ArrowUpRight, AlertCircle, Building2, DownloadCloud, Sparkles
} from "lucide-react";
import { toast } from "sonner";

export default function OperationsBillingPage() {
  const [currentTier, setCurrentTier] = useState<PlanTier>("professional");
  const [seatCount, setSeatCount] = useState<number>(8);
  const [activeClinicians] = useState<number>(6);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const plan = SAAS_PLANS[currentTier];
  const monthlyCost = calculateSubscriptionCost(currentTier, seatCount, billingCycle);

  const handleCheckout = async (targetTier: PlanTier) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: targetTier,
          seats: seatCount,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.success(`Plan updated to ${SAAS_PLANS[targetTier].name} in sandbox mode`);
        setCurrentTier(targetTier);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error initiating checkout";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManagePortal = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Portal access failed");

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.info(data.message || "Customer portal redirect simulated in sandbox mode");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error accessing billing portal";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinic Subscription & Seats</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs py-0.5">
              Active Subscription
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage your clinic subscription tier, clinician seats, and billing information.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleManagePortal}
            disabled={isLoading}
            className="flex items-center gap-2 border-slate-300 hover:bg-slate-50"
          >
            <CreditCard className="w-4 h-4 text-slate-600" />
            <span>Manage Payment Methods</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-xl">
          <p className="text-xs uppercase font-mono text-slate-500 tracking-wider">Current Plan</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
            <span className="text-sm font-semibold text-blue-600">${monthlyCost}/mo</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{plan.tagline}</p>
        </Card>

        <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-xl">
          <p className="text-xs uppercase font-mono text-slate-500 tracking-wider">Clinician Seats</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-slate-900">{activeClinicians} / {seatCount} Active</h2>
            <span className="text-xs text-emerald-600 font-medium">{seatCount - activeClinicians} Available</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Seats provisioned for your organization.</p>
        </Card>

        <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-xl">
          <p className="text-xs uppercase font-mono text-slate-500 tracking-wider">Billing Status</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-emerald-600">Good Standing</h2>
            <span className="text-xs text-slate-500 font-mono">Auto-renews</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Next invoice scheduled on regular billing cycle.</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Available Practice Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['starter', 'professional', 'enterprise'] as PlanTier[]).map((tierKey) => {
            const p = SAAS_PLANS[tierKey];
            const isCurrent = currentTier === tierKey;
            return (
              <Card key={tierKey} className={`p-6 bg-white rounded-xl border ${isCurrent ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'} shadow-sm flex flex-col justify-between`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">{p.name}</h4>
                    {isCurrent && <Badge className="bg-blue-600 text-white text-xs">Current</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 min-h-[36px]">{p.tagline}</p>
                  <div className="text-2xl font-bold text-slate-900">
                    ${billingCycle === 'annual' ? p.pricePerSeatAnnual : p.pricePerSeatMonthly}
                    <span className="text-xs font-normal text-slate-500"> /seat/month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    {p.features.slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{f.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-6">
                  <Button 
                    className="w-full text-xs font-semibold" 
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || isLoading}
                    onClick={() => handleCheckout(tierKey)}
                  >
                    {isCurrent ? "Active Plan" : `Upgrade to ${p.name}`}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
