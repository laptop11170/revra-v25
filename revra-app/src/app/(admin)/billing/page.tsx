"use client";

import { WORKSPACES, SUBSCRIPTIONS } from '@/lib/db/seed';

export default function AdminBillingPage() {
  const totalMRR = SUBSCRIPTIONS.reduce((acc, sub) => {
    const plan = sub.planId === 'plan-starter' ? 250 : sub.planId === 'plan-growth' ? 450 : 799;
    return acc + plan;
  }, 0);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Billing & Subscriptions</h1>
        <p className="text-on-surface-variant mt-1">All active subscriptions across workspaces</p>
      </div>

      {/* MRR Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
          <span className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">Monthly Recurring Revenue</span>
          <div className="text-3xl font-bold text-on-surface mt-2">${totalMRR.toLocaleString()}</div>
          <span className="text-xs text-secondary mt-1">Across 12 workspaces</span>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
          <span className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">Active Subscriptions</span>
          <div className="text-3xl font-bold text-on-surface mt-2">12</div>
          <span className="text-xs text-on-surface-variant mt-1">0 trials, 0 past due</span>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
          <span className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">Annual Run Rate</span>
          <div className="text-3xl font-bold text-on-surface mt-2">${(totalMRR * 12).toLocaleString()}</div>
          <span className="text-xs text-secondary mt-1">Projected annual revenue</span>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant/15">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide">All Subscriptions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr className="text-[10px] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                <th className="py-3 px-4">Workspace</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">MRR</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Renews</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 text-sm text-on-surface">
              {SUBSCRIPTIONS.map((sub) => {
                const ws = WORKSPACES.find((w) => w.id === sub.workspaceId);
                const plan = sub.planId === 'plan-starter' ? { name: 'Starter', price: 250 } : { name: 'Growth', price: 450 };
                const daysUntilRenewal = Math.ceil((sub.currentPeriodEnd - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={sub.id} className="hover:bg-surface-bright transition-colors">
                    <td className="py-3 px-4 font-medium">{ws?.name || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary-container/20 text-primary border border-primary-container/30">{plan.name}</span>
                    </td>
                    <td className="py-3 px-4 font-medium">${plan.price}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">in {daysUntilRenewal} days</td>
                    <td className="py-3 px-4">
                      <button className="text-xs text-primary hover:underline">Manage</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
