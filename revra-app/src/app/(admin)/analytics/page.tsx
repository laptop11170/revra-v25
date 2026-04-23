"use client";

import { useAdminAnalytics } from '@/hooks/useAdmin';

export default function AdminAnalyticsPage() {
  const { data: analyticsData } = useAdminAnalytics();
  const analytics = (analyticsData as any)?.data;

  const funnel = analytics?.funnel || {};
  const stages = [
    { key: 'captured', label: 'Captured', color: 'bg-primary-container' },
    { key: 'qualified', label: 'Qualified', color: 'bg-blue-400' },
    { key: 'contacted', label: 'Contacted', color: 'bg-secondary-container' },
    { key: 'converted', label: 'Converted', color: 'bg-emerald-500' },
    { key: 'lapsed', label: 'Lapsed', color: 'bg-error' },
  ];

  const funnelData = stages.map(s => ({ label: s.label, count: funnel[s.key] || 0, color: s.color }));
  const maxCount = Math.max(...funnelData.map(d => d.count), 1);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Analytics</h1>
        <p className="text-on-surface-variant mt-1">Platform-wide performance metrics</p>
      </div>

      {/* Lead Funnel */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 mb-6">
        <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide mb-6">Lead Funnel</h3>
        <div className="space-y-4">
          {funnelData.map((item) => (
            <div key={item.label} className="flex items-center gap-4">
              <div className="w-36 text-sm text-on-surface-variant">{item.label}</div>
              <div className="flex-1 bg-surface-container-highest rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full flex items-center justify-end pr-3`}
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                >
                  <span className="text-xs font-bold text-on-surface">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Agents */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-outline-variant/15">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide">Top Performing Agents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr className="text-[10px] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Workspace</th>
                <th className="py-3 px-4">Total Leads</th>
                <th className="py-3 px-4">Policies Closed</th>
                <th className="py-3 px-4">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 text-sm text-on-surface">
              {(analytics?.topAgents || []).map((agent: any, i: number) => (
                <tr key={i} className="hover:bg-surface-bright transition-colors">
                  <td className="py-3 px-4 font-medium">{agent.name || '—'}</td>
                  <td className="py-3 px-4 text-on-surface-variant">{agent.workspace || '—'}</td>
                  <td className="py-3 px-4">{agent.leads ?? 0}</td>
                  <td className="py-3 px-4">{agent.closed ?? 0}</td>
                  <td className="py-3 px-4 font-medium text-emerald-400">${(agent.revenue ?? 0).toLocaleString()}</td>
                </tr>
              ))}
              {!(analytics?.topAgents?.length) && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-on-surface-variant">No agent data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Mix */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide mb-4">Subscription Mix</h3>
        <div className="flex items-end gap-3 h-32">
          {(analytics?.planMix || []).map((plan: any) => (
            <div key={plan.label} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full rounded-t-lg ${plan.percent >= 50 ? 'bg-primary-container' : 'bg-surface-container-high'}`}
                style={{ height: `${Math.max(plan.percent, 10)}%` }}
              >
                <span className="text-xs font-bold text-on-surface flex justify-center mt-2">{plan.count}</span>
              </div>
              <span className="text-xs text-on-surface-variant">{plan.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}