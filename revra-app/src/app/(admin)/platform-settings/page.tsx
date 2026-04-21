"use client";

import { WORKSPACES } from '@/lib/db/seed';
import { WORKFLOWS } from '@/lib/db/seed';
import { useDataStore } from '@/lib/stores';

export default function AdminSettingsPage() {
  const emmaCampaigns = useDataStore((s) => s.emmaCampaigns);
  const emmaQueue = useDataStore((s) => s.emmaQueue);

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
                <input defaultValue="RevRa" className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded px-3 py-2 text-sm text-on-surface" />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Default Plan for New Workspaces</label>
                <select defaultValue="plan-growth" className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded px-3 py-2 text-sm text-on-surface">
                  <option value="plan-starter">Starter</option>
                  <option value="plan-growth">Growth</option>
                  <option value="plan-scale">Scale</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Active Workspaces */}
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide mb-4">Active Workspaces</h3>
          <div className="space-y-3">
            {WORKSPACES.map((ws) => (
              <div key={ws.id} className="flex items-center justify-between bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/10">
                <div>
                  <p className="font-medium text-on-surface">{ws.name}</p>
                  <p className="text-xs text-on-surface-variant">{ws.plan} plan • {ws.aiCredits.toLocaleString()} AI credits</p>
                </div>
                <button className="text-xs text-primary hover:underline">Manage</button>
              </div>
            ))}
          </div>
        </div>

        {/* Active Workflows */}
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide mb-4">Active Workflows</h3>
          <div className="space-y-3">
            {WORKFLOWS.map((wf) => (
              <div key={wf.id} className="flex items-center justify-between bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/10">
                <div>
                  <p className="font-medium text-on-surface">{wf.name}</p>
                  <p className="text-xs text-on-surface-variant">{wf.nodes.length} nodes • Effectiveness: {Math.round((wf.effectivenessScore || 0) * 100)}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs text-on-surface-variant">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emma AI Status */}
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide mb-4">Emma AI Queue</h3>
          <div className="space-y-3">
            {emmaQueue.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/10">
                <div>
                  <p className="font-medium text-on-surface">Lead: {item.leadId}</p>
                  <p className="text-xs text-on-surface-variant">Campaign: {item.campaignId} • Status: {item.status}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  item.status === 'queued' ? 'bg-primary-container/10 text-primary border border-primary-container/30' :
                  item.status === 'voicemail' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-surface-container text-on-surface-variant border-outline-variant/30'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-sm font-medium hover:bg-primary-container/90 transition-colors shadow-[0_0_15px_rgba(45,91,255,0.2)]">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
