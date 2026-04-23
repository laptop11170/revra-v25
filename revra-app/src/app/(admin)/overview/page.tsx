"use client";

import { useAuthStore } from '@/lib/stores';
import { useAdminAnalytics, useAdminWorkspaces } from '@/hooks/useAdmin';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminOverviewPage() {
  const logout = useAuthStore((s) => s.logout);
  const session = useAuthStore((s) => s.session);

  const { data: analyticsData } = useAdminAnalytics();
  const { data: workspacesData } = useAdminWorkspaces();

  const analytics = (analyticsData as any)?.data;
  const workspaces = (workspacesData as any)?.data || [];

  const mrr = analytics?.mrr ?? 0;
  const workspaceCount = analytics?.workspaceCount ?? 0;
  const leadCount = analytics?.leadCount ?? 0;
  const funnel = analytics?.funnel || {};
  const revenueBars = analytics?.revenueBars || Array(12).fill(40);
  const lastRevenue = revenueBars[11];

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Platform Overview</h1>
        <p className="text-on-surface-variant mt-1">Welcome back, {session?.name}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">Monthly Revenue</span>
            <span className="material-symbols-outlined text-primary-container text-lg">monetization_on</span>
          </div>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">${mrr.toLocaleString()}</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 relative z-10">
            <span className="text-xs text-secondary flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[10px]">trending_up</span>
              +{workspaceCount} workspaces
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">Active Workspaces</span>
            <span className="material-symbols-outlined text-primary-container text-lg">business</span>
          </div>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">{workspaceCount}</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 relative z-10">
            <span className="text-xs text-primary flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[10px]">trending_up</span>
              All active
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">Total Leads</span>
            <span className="material-symbols-outlined text-primary-container text-lg">groups</span>
          </div>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">{leadCount.toLocaleString()}</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 relative z-10">
            <span className="text-xs text-secondary flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[10px]">trending_up</span>
              {funnel.converted || 0} converted
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">Calls (24h)</span>
            <span className="material-symbols-outlined text-primary-container text-lg">call</span>
          </div>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">{analytics?.callCount || 0}</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 relative z-10">
            <span className="text-xs text-primary flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[10px]">radio_button_checked</span>
              Across all workspaces
            </span>
          </div>
        </div>
      </div>

      {/* Revenue + Activity */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 bg-surface-container-low rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide">Revenue Trend</h3>
            <button className="text-xs text-on-surface-variant hover:text-primary transition-colors">Last 12 Months</button>
          </div>
          <div className="flex items-end gap-2 h-40">
            {revenueBars.map((h: number, i: number) => (
              <div key={i} className="flex-1 bg-primary-container/20 hover:bg-primary-container/40 transition-colors rounded-t-sm relative" style={{ height: `${h}%` }}>
                {i === 11 && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-high px-2 py-1 rounded text-xs font-bold text-on-surface">${lastRevenue * 185}</div>}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-on-surface-variant">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </div>

        <div className="col-span-4 bg-surface-container-low rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-primary text-[16px]">person_add</span>
              </div>
              <div>
                <p className="text-sm text-on-surface">New workspace "{workspaces[1]?.name || 'New Workspace'}" created</p>
                <span className="text-xs text-on-surface-variant">2m ago</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-secondary text-[16px]">credit_card</span>
              </div>
              <div>
                <p className="text-sm text-on-surface">Subscription upgraded: Growth → Scale</p>
                <span className="text-xs text-on-surface-variant">15m ago</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-tertiary text-[16px]">check_circle</span>
              </div>
              <div>
                <p className="text-sm text-on-surface">Emma AI campaign completed for {workspaces[0]?.name || 'Workspace'}</p>
                <span className="text-xs text-on-surface-variant">1h ago</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-error text-[16px]">warning</span>
              </div>
              <div>
                <p className="text-sm text-on-surface">Database latency spike (resolved)</p>
                <span className="text-xs text-on-surface-variant">3h ago</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-tertiary text-[16px]">bolt</span>
              </div>
              <div>
                <p className="text-sm text-on-surface">AI Gateway response time improved 40%</p>
                <span className="text-xs text-on-surface-variant">5h ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Table */}
      <div className="mt-6 bg-surface-container-low rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant/15 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide">Active Workspaces</h3>
          <button
            onClick={logout}
            className="text-xs text-on-surface-variant hover:text-error transition-colors"
          >
            Sign out
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr className="text-[10px] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                <th className="py-3 px-4">Workspace</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Agents</th>
                <th className="py-3 px-4">Leads</th>
                <th className="py-3 px-4">MRR</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 text-sm text-on-surface">
              {(workspaces as any[]).map((ws: any) => {
                const planPrice = ws.plan === 'starter' ? 250 : ws.plan === 'growth' ? 450 : ws.plan === 'scale' ? 799 : 0;
                return (
                  <tr key={ws.id} className="hover:bg-surface-bright transition-colors">
                    <td className="py-3 px-4 font-medium">{ws.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary-container/20 text-primary border border-primary-container/30 uppercase">{ws.plan}</span>
                    </td>
                    <td className="py-3 px-4">{ws.agentCount ?? 0}</td>
                    <td className="py-3 px-4">{(ws.leadCount ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4 font-medium">${planPrice}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">active</span>
                    </td>
                  </tr>
                );
              })}
              {workspaces.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-on-surface-variant">No workspaces found. Run the seed script to create test data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
