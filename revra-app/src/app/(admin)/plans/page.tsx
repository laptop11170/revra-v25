"use client";

import { PLANS } from '@/lib/db/seed';

export default function AdminPlansPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Plans & Pricing</h1>
        <p className="text-on-surface-variant mt-1">Manage subscription tiers for all workspaces</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl p-6 relative overflow-hidden border ${
              plan.name === 'Growth'
                ? 'bg-primary-container/10 border-primary-container/30 shadow-[0_0_20px_rgba(45,91,255,0.1)]'
                : 'bg-surface-container-low border-outline-variant/10'
            }`}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-on-surface">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-on-surface">${plan.weeklyPrice}</span>
                <span className="text-sm text-on-surface-variant">/week</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">${plan.monthlyPrice}/month</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Weekly Leads</span>
                <span className="font-medium text-on-surface">{plan.weeklyLeadLimit}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">AI Credits</span>
                <span className="font-medium text-on-surface">{plan.monthlyAiCredits.toLocaleString()}/mo</span>
              </div>
            </div>

            <div className="space-y-1.5 mb-6">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[14px]">check</span>
                  {feature}
                </div>
              ))}
            </div>

            <button className="w-full py-2 px-4 rounded-lg text-sm font-medium border border-outline-variant/30 text-on-surface hover:bg-surface-container transition-colors">
              Edit Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
