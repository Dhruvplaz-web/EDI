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

export default function AdminBillingPage() {
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
          orgId: "org_praxis_flagship",
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
          orgId: "org_praxis_flagship",
          customerId: "cus_mock_demo_customer",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.info("Stripe Customer Portal will open when live Stripe keys are configured.");
      }
    } catch {
      toast.error("Failed to access billing portal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Header & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Clinic Subscription & Licensing</h1>
            <Badge variant="outline" className="border-primary/40 text-primary font-medium text-xs">
              B2B SaaS Portal
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your clinic&apos;s active seats, plan tier, and HIPAA Business Associate Agreement entitlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleManagePortal} 
            disabled={isLoading}
            className="text-xs h-9"
          >
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            Payment Methods & Invoices
          </Button>
          <Button 
            onClick={() => handleCheckout("enterprise")} 
            disabled={isLoading}
            className="text-xs h-9 bg-primary text-primary-foreground shadow-sm hover:opacity-95"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Contact Enterprise Sales
          </Button>
        </div>
      </div>

      {/* Overview Cards: Utilization, Current Plan, Billing Amount */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Active Subscription */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Tier</span>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                ACTIVE
              </Badge>
            </div>
            <CardTitle className="text-xl font-bold mt-1">{plan.name}</CardTitle>
            <CardDescription className="text-xs">{plan.tagline}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            <div className="flex items-baseline gap-1 text-2xl font-bold">
              ${billingCycle === "annual" ? plan.pricePerSeatAnnual : plan.pricePerSeatMonthly}
              <span className="text-xs font-normal text-muted-foreground">/ seat / month</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Current cycle billed {billingCycle}. Renews on November 24, 2026.
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Clinician Seat Utilization */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seat Utilization</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold mt-1">
              {activeClinicians} of {seatCount} Seats Active
            </CardTitle>
            <CardDescription className="text-xs">
              {seatCount - activeClinicians} unassigned clinician licenses available
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {/* Utilization Bar */}
            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${(activeClinicians / seatCount) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round((activeClinicians / seatCount) * 100)}% utilization</span>
              <button 
                onClick={() => setSeatCount(prev => prev + 1)}
                className="text-primary hover:underline font-medium"
              >
                + Add Seat ($319/mo)
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Monthly Run Rate */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Run Rate</span>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-foreground">
              ${monthlyCost.toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground"> / month</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Calculated across {seatCount} clinician seats ({billingCycle} cycle)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>HIPAA BAA Agreement Active & Signed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Switcher / Comparison Grid */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Available Clinic Subscription Tiers</h2>
            <p className="text-xs text-muted-foreground">Select a plan to scale your psychiatric practice or hospital network.</p>
          </div>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center bg-secondary p-1 rounded-lg text-xs font-medium border border-border/50">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1 rounded-md transition-colors ${billingCycle === "monthly" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${billingCycle === "annual" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span>Annual Billing</span>
              <span className="bg-emerald-500/15 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(SAAS_PLANS) as PlanTier[]).map((tierKey) => {
            const p = SAAS_PLANS[tierKey];
            const isCurrent = currentTier === tierKey;
            const price = billingCycle === "annual" ? p.pricePerSeatAnnual : p.pricePerSeatMonthly;

            return (
              <div 
                key={tierKey}
                className={`relative flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm transition-all ${
                  isCurrent 
                    ? "border-primary/80 ring-2 ring-primary/20 shadow-md" 
                    : "border-border/60 hover:border-border"
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3 right-6">
                    <Badge className="bg-primary text-primary-foreground font-semibold text-[10px] tracking-wide uppercase px-2 py-0.5 shadow-xs">
                      {p.badge}
                    </Badge>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-foreground">${price}</span>
                    <span className="text-xs text-muted-foreground">/ seat / month</span>
                  </div>

                  <div className="border-t border-border/40 pt-4 space-y-2.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Included Entitlements
                    </span>
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${feat.included ? "text-primary" : "text-muted-foreground/30"}`} />
                        <span className={feat.included ? "text-foreground" : "text-muted-foreground/50 line-through"}>
                          {feat.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-border/40">
                  {isCurrent ? (
                    <Button disabled variant="outline" className="w-full text-xs font-semibold cursor-default">
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleCheckout(tierKey)} 
                      disabled={isLoading}
                      className="w-full text-xs font-semibold"
                      variant={tierKey === "enterprise" ? "default" : "outline"}
                    >
                      {tierKey === "enterprise" ? "Contact Enterprise Sales" : `Switch to ${p.name}`}
                      <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice History */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Recent Clinic Invoices</CardTitle>
          <CardDescription className="text-xs">
            Download receipts and accounting documentation with tax IDs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-border/50 rounded-lg overflow-hidden text-xs">
            <div className="grid grid-cols-5 bg-secondary/50 font-semibold text-muted-foreground p-3 border-b border-border/50">
              <span>Invoice #</span>
              <span>Billing Date</span>
              <span>Seats</span>
              <span>Amount</span>
              <span className="text-right">Receipt</span>
            </div>
            <div className="divide-y divide-border/30">
              <div className="grid grid-cols-5 items-center p-3">
                <span className="font-mono font-medium">INV-2026-10-01</span>
                <span className="text-muted-foreground">Oct 24, 2026</span>
                <span>8 Seats</span>
                <span className="font-semibold text-foreground">$2,552.00</span>
                <div className="text-right">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary/80">
                    <DownloadCloud className="w-3 h-3 mr-1" /> PDF
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-5 items-center p-3">
                <span className="font-mono font-medium">INV-2026-09-01</span>
                <span className="text-muted-foreground">Sep 24, 2026</span>
                <span>6 Seats</span>
                <span className="font-semibold text-foreground">$1,914.00</span>
                <div className="text-right">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary/80">
                    <DownloadCloud className="w-3 h-3 mr-1" /> PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
