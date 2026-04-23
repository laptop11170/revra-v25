"use client";

import { useMemo } from 'react';
import { useAdminAnalytics, useAdminWorkspaces } from '@/hooks/useAdmin';

export default function AdminBillingPage() {
  const { data: analyticsData } = useAdminAnalytics();
  const { data: workspacesData } = useAdminWorkspaces();

  const analytics = (analyticsData as any)?.data;
  const workspaces = (workspacesData as any)?.data || [];

  const mrr = analytics?.mrr ?? 0;
  const activeCount = workspaces.filter((w: any) => w.status === 'active').length;
  const pastDueCount = workspaces.filter((w: any) => w.status === 'past_due').length;

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
          <div className="text-3xl font-bold text-on-surface mt-2">${mrr.toLocaleString()}</div>
          <span className="text-xs text-secondary mt-1">Across {workspaces.length} workspaces</span>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
          <span className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">Active Subscriptions</span>
          <div className="text-3xl font-bold text-on-surface mt-2">{activeCount}</div>
          <span className="text-xs text-on-surface-variant mt-1">{workspaces.length - activeCount} paused, {pastDueCount} past due</span>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
          <span className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">Annual Run Rate</span>
          <div className="text-3xl font-bold text-on-surface mt-2">${(mrr * 12).toLocaleString()}</div>
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
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 text-sm text-on-surface">
              {workspaces.map((ws: any) => {
                const planName = ws.plan ? ws.plan.charAt(0).toUpperCase() + ws.plan.slice(1) : '—';
                const planPrice = ws.plan === 'starter' ? 250 : ws.plan === 'growth' ? 450 : ws.plan === 'scale' ? 799 : 0;
                const isActive = ws.status === 'active';
                return (
                  <tr key={ws.id} className="hover:bg-surface-bright transition-colors">
                    <td className="py-3 px-4 font-medium">{ws.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary-container/20 text-primary border border-primary-container/30">{planName}</span>
                    </td>
                    <td className="py-3 px-4 font-medium">${planPrice}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ws.status === 'past_due' ? 'bg-error/10 text-error border border-error/20' : 'bg-surface-container text-on-surface-variant border border-outline-variant/30'}`}>
                        {ws.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-xs text-primary hover:underline">Manage</button>
                    </td>
                  </tr>
                );
              })}
              {workspaces.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-on-surface-variant">No subscriptions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}