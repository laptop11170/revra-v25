"use client";

import { useState } from 'react';
import { useAdminPlans } from '@/hooks/useAdmin';

export default function AdminPlansPage() {
  const { data: plansData } = useAdminPlans();
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', weekly_price: 0, monthly_price: 0, weekly_lead_limit: 0, monthly_ai_credits: 0, features: '' });

  const plans = (plansData as any)?.data || [];

  const handleEditPlan = (plan: any) => {
    setEditForm({
      name: plan.name || '',
      weekly_price: plan.weekly_price || 0,
      monthly_price: plan.monthly_price || 0,
      weekly_lead_limit: plan.weekly_lead_limit || 0,
      monthly_ai_credits: plan.monthly_ai_credits || 0,
      features: (plan.features || []).join(', '),
    });
    setEditingPlan(plan);
  };

  const handleSavePlan = () => {
    alert(`Plan "${editForm.name}" save — integrate with Stripe/billing API for persistence.`);
    setEditingPlan(null);
  };

  const revenue = plans.map((p: any) => {
    const subscriberCount = 0; // real count would come from subscriptions table
    return { ...p, subscriberCount, mrr: subscriberCount * p.monthly_price };
  });

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Plans & Pricing</h1>
        <p className="text-on-surface-variant mt-1">Manage subscription tiers for all workspaces</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {plans.map((plan: any) => {
          const isGrowth = plan.name === 'Growth';
          return (
            <div
              key={plan.id}
              className={`rounded-xl p-6 relative overflow-hidden border ${
                isGrowth
                  ? 'bg-primary-container/10 border-primary-container/30 shadow-[0_0_20px_rgba(45,91,255,0.1)]'
                  : 'bg-surface-container-low border-outline-variant/10'
              }`}
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-on-surface">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-on-surface">${plan.weekly_price}</span>
                  <span className="text-sm text-on-surface-variant">/week</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">${plan.monthly_price}/month</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Weekly Leads</span>
                  <span className="font-medium text-on-surface">{plan.weekly_lead_limit}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">AI Credits</span>
                  <span className="font-medium text-on-surface">{(plan.monthly_ai_credits || 0).toLocaleString()}/mo</span>
                </div>
              </div>

              <div className="space-y-1.5 mb-6 max-h-28 overflow-hidden">
                {(plan.features || []).map((feature: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[14px]">check</span>
                    {feature}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleEditPlan(plan)}
                className="w-full py-2 px-4 rounded-lg text-sm font-medium border border-outline-variant/30 text-on-surface hover:bg-surface-container transition-colors"
              >
                Edit Plan
              </button>
            </div>
          );
        })}
        {plans.length === 0 && (
          <div className="col-span-4 py-12 text-center text-sm text-on-surface-variant">No plans found.</div>
        )}
      </div>

      {/* MRR Breakdown Table */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden mb-8">
        <div className="p-4 border-b border-outline-variant/15">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide">Revenue by Plan</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr className="text-[10px] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Monthly Price</th>
                <th className="py-3 px-4">Subscribers</th>
                <th className="py-3 px-4">MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 text-sm text-on-surface">
              {plans.map((plan: any) => (
                <tr key={plan.id} className="hover:bg-surface-bright transition-colors">
                  <td className="py-3 px-4 font-medium">{plan.name}</td>
                  <td className="py-3 px-4">${plan.monthly_price}</td>
                  <td className="py-3 px-4">—</td>
                  <td className="py-3 px-4 font-medium text-emerald-400">${plan.mrr || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setEditingPlan(null)}>
          <div className="bg-surface-container-highest rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface">Edit Plan</h3>
              <button onClick={() => setEditingPlan(null)} className="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Plan Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Weekly Price ($)</label>
                  <input type="number" value={editForm.weekly_price} onChange={(e) => setEditForm(prev => ({ ...prev, weekly_price: Number(e.target.value) }))} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Monthly Price ($)</label>
                  <input type="number" value={editForm.monthly_price} onChange={(e) => setEditForm(prev => ({ ...prev, monthly_price: Number(e.target.value) }))} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Weekly Lead Limit</label>
                  <input type="number" value={editForm.weekly_lead_limit} onChange={(e) => setEditForm(prev => ({ ...prev, weekly_lead_limit: Number(e.target.value) }))} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Monthly AI Credits</label>
                  <input type="number" value={editForm.monthly_ai_credits} onChange={(e) => setEditForm(prev => ({ ...prev, monthly_ai_credits: Number(e.target.value) }))} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Features (comma-separated)</label>
                <textarea value={editForm.features} onChange={(e) => setEditForm(prev => ({ ...prev, features: e.target.value }))} rows={3} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingPlan(null)} className="flex-1 py-2.5 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleSavePlan} className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold hover:bg-primary-container/90 transition-colors">Save Plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}