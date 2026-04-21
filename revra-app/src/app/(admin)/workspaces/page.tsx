"use client";

import { WORKSPACES } from '@/lib/db/seed';

export default function AdminWorkspacesPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Workspaces</h1>
          <p className="text-on-surface-variant mt-1">{WORKSPACES.length} workspaces on the platform</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-medium hover:bg-primary-container/90 transition-colors">
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
              {WORKSPACES.map((ws) => (
                <tr key={ws.id} className="hover:bg-surface-bright transition-colors">
                  <td className="py-3 px-4 font-medium">{ws.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary-container/20 text-primary border border-primary-container/30 uppercase">{ws.plan}</span>
                  </td>
                  <td className="py-3 px-4">{ws.aiCredits.toLocaleString()}</td>
                  <td className="py-3 px-4 text-on-surface-variant">{new Date(ws.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-3">
                      <button className="text-xs text-primary hover:underline">View</button>
                      <button className="text-xs text-error hover:underline">Suspend</button>
                    </div>
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
