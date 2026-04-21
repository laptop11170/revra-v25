"use client";

import { useState } from 'react';
import { USERS } from '@/lib/db/seed';
import { WORKSPACES } from '@/lib/db/seed';

export default function AdminAgentsPage() {
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('all');

  const agents = USERS.filter((u) => u.role === 'agent' || u.role === 'admin');
  const filtered = selectedWorkspace === 'all'
    ? agents
    : agents.filter((a) => a.workspaceId === selectedWorkspace);

  return (
    <div className="max-w-7xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Agent Management</h1>
          <p className="text-on-surface-variant mt-1">{agents.length} total agents across all workspaces</p>
        </div>
        <select
          value={selectedWorkspace}
          onChange={(e) => setSelectedWorkspace(e.target.value)}
          className="bg-surface-container border border-outline-variant/30 text-on-surface text-sm rounded px-3 py-2"
        >
          <option value="all">All Workspaces</option>
          {WORKSPACES.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface-container-low rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr className="text-[10px] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Workspace</th>
                <th className="py-3 px-4">Leads</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 text-sm text-on-surface">
              {filtered.map((agent) => {
                const workspace = WORKSPACES.find((w) => w.id === agent.workspaceId);
                const daysAgo = Math.floor(Math.random() * 14);
                return (
                  <tr key={agent.id} className="hover:bg-surface-bright transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold text-xs">
                          {agent.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-xs text-on-surface-variant">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${agent.role === 'admin' ? 'bg-secondary-container/20 text-secondary border-secondary-container/30' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}`}>
                        {agent.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">{workspace?.name || '—'}</td>
                    <td className="py-3 px-4">{Math.floor(Math.random() * 200) + 50}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
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
