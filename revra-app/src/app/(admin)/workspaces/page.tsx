"use client";

import { useState } from 'react';
import { useAdminWorkspaces } from '@/hooks/useAdmin';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminWorkspacesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wsName, setWsName] = useState("");
  const [wsPlan, setWsPlan] = useState<"starter" | "growth" | "scale">("growth");
  const qc = useQueryClient();

  const { data: workspacesData, isLoading } = useAdminWorkspaces();
  const workspaces = (workspacesData as any)?.data || [];

  const handleCreate = async () => {
    if (!wsName.trim()) return;
    try {
      const res = await fetch('/api/admin/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: wsName.trim(), plan: wsPlan }),
      });
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
        setShowCreateModal(false);
        setWsName("");
      }
    } catch {}
  };

  const handleSuspend = async (workspaceId: string) => {
    if (!confirm("Suspend this workspace? All users will lose access immediately.")) return;
    try {
      await fetch(`/api/admin/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'suspended' }),
      });
      qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
    } catch {}
  };

  const handleReactivate = async (workspaceId: string) => {
    try {
      await fetch(`/api/admin/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'active' }),
      });
      qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
    } catch {}
  };

  const handleView = (workspaceId: string) => {
    window.location.href = `/?workspace=${workspaceId}`;
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Workspaces</h1>
          <p className="text-on-surface-variant mt-1">{workspaces.length} workspaces on the platform</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-medium hover:bg-primary-container/90 transition-colors shadow-[0_4px_14px_rgba(45,91,255,0.25)]"
        >
          + Create Workspace
        </button>
      </div>

      <div className="bg-surface-container-low rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr className="text-[10px] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                <th className="py-3 px-4">Workspace</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">AI Credits</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 text-sm text-on-surface">
              {isLoading && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-on-surface-variant">Loading...</td></tr>
              )}
              {!isLoading && workspaces.map((ws: any) => {
                const isSuspended = ws.status === 'suspended';
                return (
                <tr key={ws.id} className={`hover:bg-surface-bright transition-colors ${isSuspended ? 'opacity-50' : ''}`}>
                  <td className="py-3 px-4 font-medium">{ws.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase ${isSuspended ? 'bg-error/10 text-error border border-error/20' : 'bg-primary-container/20 text-primary border border-primary-container/30'}`}>{isSuspended ? 'suspended' : ws.plan}</span>
                  </td>
                  <td className="py-3 px-4">{(ws.ai_credits || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-on-surface-variant">{ws.created_at ? new Date(ws.created_at).toLocaleDateString() : '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-3">
                      <button onClick={() => handleView(ws.id)} className="text-xs text-primary hover:underline">View</button>
                      {isSuspended ? (
                        <button onClick={() => handleReactivate(ws.id)} className="text-xs text-emerald-400 hover:underline">Reactivate</button>
                      ) : (
                        <button onClick={() => handleSuspend(ws.id)} className="text-xs text-error hover:underline">Suspend</button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
              {!isLoading && workspaces.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-on-surface-variant">No workspaces found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setShowCreateModal(false)}>
          <div className="bg-surface-container-highest rounded-2xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface">Create Workspace</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Workspace Name</label>
                <input value={wsName} onChange={(e) => setWsName(e.target.value)} placeholder="e.g. Arizona Medicare Pros" className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Plan</label>
                <select value={wsPlan} onChange={(e) => setWsPlan(e.target.value as "starter" | "growth" | "scale")} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary">
                  <option value="starter">Starter ($250/mo)</option>
                  <option value="growth">Growth ($450/mo)</option>
                  <option value="scale">Scale ($799/mo)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold hover:bg-primary-container/90 transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}