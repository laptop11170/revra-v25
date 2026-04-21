"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useAuthStore, useAIStore } from "@/lib/stores";

export default function SettingsPage() {
  const session = useAuthStore((s) => s.session);
  const aiCredits = useAIStore((s) => s.aiCredits);
  const creditTransactions = useAIStore((s) => s.creditTransactions);

  const weeklyBurn = creditTransactions
    .filter((t) => t.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <SubPageLayout>
      <div className="relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-container/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="mb-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Workspace Settings</h1>
            <p className="text-on-surface-variant mt-2 text-sm max-w-xl">Manage your team&apos;s configuration, billing details, and active integrations.</p>
          </div>
        </div>

        <div className="flex gap-6 mb-8 border-b border-outline-variant/15 relative z-10">
          <button className="pb-3 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Profile</button>
          <button className="pb-3 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Team</button>
          <button className="pb-3 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Integrations</button>
          <button className="pb-3 text-sm font-bold text-primary border-b-2 border-primary-container transition-colors">Billing & AI Credits</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br from-primary-container/20 to-transparent rounded-full blur-2xl group-hover:bg-primary-container/30 transition-all duration-500"></div>
              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Current Plan</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container text-on-surface-variant uppercase tracking-wider border border-outline-variant/20">Active</span>
                  </div>
                  <h2 className="text-3xl font-headline font-bold text-on-surface tracking-tight mb-2">{session?.name || "Workspace"}</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-on-surface capitalize">growth</span>
                    <span className="text-sm text-on-surface-variant">plan</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-6 flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Payment Method</h3>
              <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-surface-bright rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface text-xl">credit_card</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-on-surface">Growth Tier</p>
                    <p className="text-xs text-on-surface-variant">Billed weekly</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-primary hover:text-inverse-primary transition-colors">Manage</button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-panel rounded-xl p-6 border border-tertiary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-tertiary-container/5 to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-tertiary">auto_awesome</span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-tertiary">AI Credit Wallet</h3>
                </div>
                <div className="mb-8">
                  <div className="text-4xl font-headline font-bold text-on-surface mb-1 tracking-tight" style={{ textShadow: "0 0 10px rgba(131,66,244,0.5)" }}>
                    {aiCredits.toLocaleString()}
                  </div>
                  <div className="text-sm text-on-surface-variant">Credits Remaining</div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Recent Usage</h4>
                  {creditTransactions.slice(0, 3).map((t, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <span className="text-sm text-on-surface">{t.action}</span>
                      <span className="text-sm font-medium text-on-surface-variant">{Math.abs(t.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-on-surface">Weekly Burn</span>
                    <span className="text-sm font-medium text-error">{weeklyBurn}</span>
                  </div>
                </div>
                <button className="w-full mt-8 py-2.5 rounded-lg bg-tertiary-container text-on-tertiary-container text-sm font-semibold hover:bg-tertiary-container/90 transition-colors shadow-[0_0_15px_rgba(131,66,244,0.2)]">
                  Top Up Credits
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
}
