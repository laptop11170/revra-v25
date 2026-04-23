"use client";

import { useState } from 'react';
import { useAdminAgents, useAdminWorkspaces } from '@/hooks/useAdmin';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminAgentsPage() {
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentRole, setAgentRole] = useState<"agent" | "admin">("agent");
  const [agentWorkspace, setAgentWorkspace] = useState("");
  const [targetAgent, setTargetAgent] = useState<any>(null);
  const qc = useQueryClient();

  const { data: agentsData } = useAdminAgents();
  const { data: workspacesData } = useAdminWorkspaces();

  const allAgents = (agentsData as any)?.data || [];
  const workspaces = (workspacesData as any)?.data || [];

  const agents = allAgents.filter((a: any) => a.role === 'agent' || a.role === 'admin');
  const filtered = selectedWorkspace === 'all'
    ? agents
    : agents.filter((a: any) => a.workspaceId === selectedWorkspace);

  const handleWorkspaceSelect = (wsId: string) => setAgentWorkspace(wsId);

  const handleAddAgent = async () => {
    if (!agentName.trim() || !agentEmail.trim()) return;
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: agentName.trim(), email: agentEmail.trim(), role: agentRole, workspaceId: agentWorkspace }),
      });
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ['admin', 'agents'] });
        setShowAddModal(false);
        setAgentName(""); setAgentEmail(""); setAgentRole("agent");
      }
    } catch {}
  };

  const handleEditAgent = (agent: any) => {
    setEditingAgentId(agent.id);
    setAgentName(agent.name);
    setAgentEmail(agent.email);
    setAgentRole(agent.role || "agent");
    setTargetAgent(agent);
  };

  const handleSaveEdit = async () => {
    if (!editingAgentId || !agentName.trim()) return;
    try {
      const res = await fetch(`/api/admin/agents/${editingAgentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: agentName.trim(), email: agentEmail.trim(), role: agentRole }),
      });
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ['admin', 'agents'] });
        setEditingAgentId(null);
        setAgentName(""); setAgentEmail("");
      }
    } catch {}
  };

  const handleDeactivate = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await fetch(`/api/admin/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: newStatus === 'active', status: newStatus }),
      });
      qc.invalidateQueries({ queryKey: ['admin', 'agents'] });
    } catch {}
  };

  const getDaysAgo = (ts: number | null) => {
    if (!ts) return '—';
    const days = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : `${days}d ago`;
  };

  return (
    <div className="max-w-7xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Agent Management</h1>
          <p className="text-on-surface-variant mt-1">{agents.length} total agents across all workspaces</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="bg-surface-container border border-outline-variant/30 text-on-surface text-sm rounded px-3 py-2"
          >
            <option value="all">All Workspaces</option>
            {workspaces.map((w: any) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <button
            onClick={() => { setShowAddModal(true); setAgentWorkspace(workspaces[0]?.id || ''); }}
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-medium hover:bg-primary-container/90 transition-colors shadow-[0_4px_14px_rgba(45,91,255,0.25)]"
          >
            + Add Agent
          </button>
        </div>
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
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 text-sm text-on-surface">
              {filtered.map((agent: any) => {
                const isActive = agent.status === 'active' || agent.isActive === true;
                return (
                  <tr key={agent.id} className="hover:bg-surface-bright transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold text-xs">
                          {(agent.name || '?').split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium">{agent.name || '—'}</p>
                          <p className="text-xs text-on-surface-variant">{agent.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${agent.role === 'admin' ? 'bg-secondary-container/20 text-secondary border-secondary-container/30' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}`}>
                        {agent.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">{agent.workspaceName || '—'}</td>
                    <td className="py-3 px-4">{agent.leadCount ?? 0}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{getDaysAgo(agent.lastActive)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-surface-variant text-on-surface-variant border border-outline-variant/30'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditAgent(agent)} className="text-xs text-primary hover:underline">Edit</button>
                        <button onClick={() => handleDeactivate(agent.id, agent.status)} className={`text-xs hover:underline ${isActive ? 'text-error' : 'text-emerald-400'}`}>
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-on-surface-variant">No agents found. Seed the database to create test agents.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setShowAddModal(false)}>
          <div className="bg-surface-container-highest rounded-2xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface">Add Agent</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Full Name</label>
                <input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Jane Smith" className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Email</label>
                <input value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} placeholder="agent@company.com" className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Role</label>
                <select value={agentRole} onChange={(e) => setAgentRole(e.target.value as "agent" | "admin")} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary">
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Workspace</label>
                <select value={agentWorkspace} onChange={(e) => handleWorkspaceSelect(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary">
                  <option value="">Select workspace...</option>
                  {workspaces.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleAddAgent} disabled={!agentName.trim() || !agentEmail.trim() || !agentWorkspace} className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold hover:bg-primary-container/90 transition-colors disabled:opacity-40">Add Agent</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {editingAgentId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setEditingAgentId(null)}>
          <div className="bg-surface-container-highest rounded-2xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface">Edit Agent</h3>
              <button onClick={() => setEditingAgentId(null)} className="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Full Name</label>
                <input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Email</label>
                <input value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Role</label>
                <select value={agentRole} onChange={(e) => setAgentRole(e.target.value as "agent" | "admin")} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary">
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingAgentId(null)} className="flex-1 py-2.5 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold hover:bg-primary-container/90 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}