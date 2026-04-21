"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

export default function AdminOverviewPage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const session = useAuthStore((s) => s.session);
  const platformStats = useAuthStore((s) => s.session);

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Platform Overview</h1>
        <p className="text-on-surface-variant mt-1">Welcome back, {session?.name}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Monthly Revenue', value: '$48,320', trend: '+12.4%', trendUp: true, icon: 'monetization_on' },
          { label: 'Active Workspaces', value: '12', trend: '+3 this month', icon: 'business' },
          { label: 'Total Leads', value: '4,829', trend: '+347 this month', icon: 'groups' },
          { label: 'Calls (24h)', value: '89', trend: 'Active now', icon: 'call' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">{stat.label}</span>
              <span className="material-symbols-outlined text-primary-container text-lg">{stat.icon}</span>
            </div>
            <div className="flex items-end gap-2 relative z-10">
              <h3 className="text-3xl font-bold text-on-surface tracking-tight">{stat.value}</h3>
            </div>
            <div className="flex items-center gap-1 mt-2 relative z-10">
              {stat.trendUp !== undefined ? (
                <span className="text-xs text-secondary flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[10px]">trending_up</span>
                  {stat.trend}
                </span>
              ) : (
                <span className="text-xs text-primary">{stat.trend}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue + Activity */}
      <div className="grid grid-cols-12 gap-6">
        {/* Revenue Trend */}
        <div className="col-span-8 bg-surface-container-low rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide">Revenue Trend</h3>
            <button className="text-xs text-on-surface-variant hover:text-primary transition-colors">Last 6 Months</button>
          </div>
          <div className="flex items-end gap-2 h-40">
            {[40, 55, 48, 70, 65, 85, 78, 100, 92, 88, 95, 82].map((h, i) => (
              <div key={i} className="flex-1 bg-primary-container/20 hover:bg-primary-container/40 transition-colors rounded-t-sm relative" style={{ height: `${h}%` }}>
                {i === 11 && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-high px-2 py-1 rounded text-xs font-bold text-on-surface">$18.5k</div>}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-on-surface-variant">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="col-span-4 bg-surface-container-low rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { icon: 'person_add', text: 'New workspace "Florida Insurance" created', time: '2m ago', color: 'primary' },
              { icon: 'credit_card', text: 'Subscription upgraded: Growth → Scale', time: '15m ago', color: 'secondary' },
              { icon: 'check_circle', text: 'Emma AI campaign completed for San Diego', time: '1h ago', color: 'tertiary' },
              { icon: 'warning', text: 'Database latency spike (resolved)', time: '3h ago', color: 'error' },
              { icon: 'bolt', text: 'AI Gateway response time improved 40%', time: '5h ago', color: 'tertiary' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full bg-${item.color}/10 flex items-center justify-center shrink-0 mt-0.5`}>
                  <span className={`material-symbols-outlined text-${item.color} text-[16px]`}>{item.icon}</span>
                </div>
                <div>
                  <p className="text-sm text-on-surface">{item.text}</p>
                  <span className="text-xs text-on-surface-variant">{item.time}</span>
                </div>
              </div>
            ))}
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
              {[
                { name: 'San Diego Health Agents', plan: 'Growth', agents: 4, leads: 1429, mrr: 450, status: 'active' },
                { name: 'Texas Insurance Group', plan: 'Starter', agents: 3, leads: 892, mrr: 250, status: 'active' },
                { name: 'Florida Medicare Experts', plan: 'Growth', agents: 5, leads: 1102, mrr: 450, status: 'active' },
                { name: 'Midwest Life & Health', plan: 'Scale', agents: 8, leads: 2340, mrr: 799, status: 'active' },
                { name: 'Arizona Final Expense', plan: 'Starter', agents: 2, leads: 445, mrr: 250, status: 'trial' },
              ].map((ws, i) => (
                <tr key={i} className="hover:bg-surface-bright transition-colors">
                  <td className="py-3 px-4 font-medium">{ws.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary-container/20 text-primary border border-primary-container/30">{ws.plan}</span>
                  </td>
                  <td className="py-3 px-4">{ws.agents}</td>
                  <td className="py-3 px-4">{ws.leads.toLocaleString()}</td>
                  <td className="py-3 px-4 font-medium">${ws.mrr}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${ws.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {ws.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
