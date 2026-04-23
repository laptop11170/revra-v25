"use client";

import { useState } from 'react';
import { useAdminWorkspaces } from '@/hooks/useAdmin';
import { useAdminAnalytics } from '@/hooks/useAdmin';

const PLAN_PRICES: Record<string, number> = { starter: 250, growth: 450, scale: 799 };

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState("RevRa");
  const [defaultPlan, setDefaultPlan] = useState("growth");
  const [saved, setSaved] = useState(false);

  const { data: workspacesData } = useAdminWorkspaces();
  const { data: analyticsData } = useAdminAnalytics();

  const workspaces = (workspacesData as any)?.data || [];
  const topAgents = (analyticsData as any)?.data?.topAgents || [];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Platform Settings</h1>
        <p className="text-on-surface-variant mt-1">Configure global platform behavior and defaults</p>
      </div>

      <div className="space-y-6">
        {/* Platform Branding */}
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide mb-4">Platform Branding</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Platform Name</label>
                <input
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Default Plan for New Workspaces</label>
                <select
                  value={defaultPlan}
                  onChange={(e) => setDefaultPlan(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="scale">Scale</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Active Workspaces */}
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide mb-4">Active Workspaces</h3>
          <div className="space-y-3">
            {workspaces.length === 0 && (
              <p className="text-sm text-on-surface-variant">No workspaces.</p>
            )}
            {workspaces.map((ws: any) => (
              <div key={ws.id} className="flex items-center justify-between bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/10">
                <div>
                  <p className="font-medium text-on-surface">{ws.name}</p>
                  <p className="text-xs text-on-surface-variant">{ws.plan || 'no plan'} plan &bull; {(ws.ai_credits || 0).toLocaleString()} AI credits</p>
                </div>
                <button className="text-xs text-primary hover:underline">Manage</button>
              </div>
            ))}
          </div>
        </div>

        {/* Active Agents */}
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide mb-4">Active Agents</h3>
          <div className="space-y-3">
            {topAgents.length === 0 && (
              <p className="text-sm text-on-surface-variant">No active agents.</p>
            )}
            {topAgents.slice(0, 10).map((agent: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/10">
                <div>
                  <p className="font-medium text-on-surface">{agent.name || '—'}</p>
                  <p className="text-xs text-on-surface-variant">{agent.workspace || 'No workspace'} &bull; {agent.leads ?? 0} leads</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs text-on-surface-variant">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end items-center gap-3">
          {saved && <span className="text-sm text-emerald-400">Saved!</span>}
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-sm font-medium hover:bg-primary-container/90 transition-colors shadow-[0_0_15px_rgba(45,91,255,0.2)]"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}