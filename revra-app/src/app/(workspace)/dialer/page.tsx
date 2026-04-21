"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useDataStore } from "@/lib/stores";
import { useAuthStore } from "@/lib/stores";
import { useMemo } from "react";
import Link from "next/link";

export default function DialerPage() {
  const session = useAuthStore((s) => s.session);
  const leads = useDataStore((s) => s.leads);
  const emmaQueue = useDataStore((s) => s.emmaQueue);
  const calls = useDataStore((s) => s.calls);

  const myLeads = leads.filter((l) => {
    if (l.deletedAt) return false;
    if (l.workspaceId !== session?.workspaceId) return false;
    if (session?.role === "agent" && l.assignedAgentId !== session?.userId) return false;
    return true;
  });

  const queueLeads = useMemo(() => {
    return myLeads
      .filter((l) => l.outcome === "pending")
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }, [myLeads]);

  const hotCount = queueLeads.filter((l) => l.score >= 80).length;
  const warmCount = queueLeads.filter((l) => l.score >= 60 && l.score < 80).length;
  const todayCalls = calls.filter((c) => {
    if (c.agentId !== session?.userId) return false;
    const today = new Date().setHours(0, 0, 0, 0);
    return c.createdAt >= today;
  });

  const avgTalkTime = useMemo(() => {
    const completed = todayCalls.filter((c) => c.duration);
    if (completed.length === 0) return "0m 0s";
    const total = completed.reduce((sum, c) => sum + (c.duration || 0), 0);
    const avg = Math.floor(total / completed.length);
    const mins = Math.floor(avg / 60);
    const secs = avg % 60;
    return `${mins}m ${secs}s`;
  }, [todayCalls]);

  const getPriority = (score: number) => {
    if (score >= 80) return "hot";
    if (score >= 60) return "warm";
    return "cool";
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SubPageLayout>
      <div className="h-full flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">AI Dialer Queue</h1>
            <p className="text-on-surface-variant text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_rgba(210,187,255,0.6)]"></span>
              Queue optimization active. {queueLeads.length} leads prioritized for immediate contact.
            </p>
          </div>
          <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary-container px-8 py-3 rounded font-bold tracking-wide flex items-center gap-3 hover:opacity-90 transition-opacity shadow-lg shadow-primary-container/20">
            <span className="material-symbols-outlined icon-fill">play_arrow</span>
            START AUTO-DIAL
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-container rounded-xl p-6 flex flex-col justify-between border border-outline-variant/15 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-high to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex justify-between items-start mb-4">
              <span className="text-on-surface-variant text-sm font-medium tracking-wide uppercase">Queue Depth</span>
              <span className="material-symbols-outlined text-primary-container">groups</span>
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-extrabold text-on-surface tracking-tighter">{queueLeads.length}</div>
              <div className="text-xs text-tertiary mt-1 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> +{hotCount} hot leads
              </div>
            </div>
          </div>

          <div className="bg-surface-container rounded-xl p-6 flex flex-col justify-between border border-outline-variant/15 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-high to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex justify-between items-start mb-4">
              <span className="text-on-surface-variant text-sm font-medium tracking-wide uppercase">Avg Talk Time</span>
              <span className="material-symbols-outlined text-secondary-container">timer</span>
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-extrabold text-on-surface tracking-tighter">{avgTalkTime}</div>
              <div className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">{todayCalls.length} calls today</div>
            </div>
          </div>

          <div className="bg-surface-container rounded-xl p-6 flex flex-col justify-between border border-outline-variant/15 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-high to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex justify-between items-start mb-4">
              <span className="text-on-surface-variant text-sm font-medium tracking-wide uppercase">Warm Leads</span>
              <span className="material-symbols-outlined text-tertiary-container">local_fire_department</span>
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-extrabold text-on-surface tracking-tighter">{warmCount}</div>
              <div className="text-xs text-tertiary mt-1 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span> Ready to call
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl flex flex-col overflow-hidden border border-outline-variant/15 mb-8 flex-1">
          <div className="px-6 py-4 border-b border-outline-variant/15 bg-surface-container-high flex items-center justify-between">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">Priority Call List</h2>
            <div className="flex gap-2">
              <button className="text-xs text-on-surface-variant hover:text-on-surface px-2 py-1 bg-surface-container rounded transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">filter_list</span> Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/15">
                  <th className="px-6 py-4 font-semibold w-16 text-center">Pri</th>
                  <th className="px-6 py-4 font-semibold">Lead Name</th>
                  <th className="px-6 py-4 font-semibold">Score</th>
                  <th className="px-6 py-4 font-semibold">Coverage</th>
                  <th className="px-6 py-4 font-semibold">Source</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {queueLeads.map((lead) => {
                  const priority = getPriority(lead.score);
                  return (
                    <tr key={lead.id} className="border-b border-outline-variant/10 hover:bg-surface-bright/30 transition-colors group">
                      <td className="px-6 py-4 text-center">
                        {priority === "hot" && <span className="material-symbols-outlined text-error icon-fill">local_fire_department</span>}
                        {priority === "warm" && <span className="w-2 h-2 rounded-full bg-tertiary inline-block"></span>}
                        {priority === "cool" && <span className="w-2 h-2 rounded-full bg-outline-variant inline-block"></span>}
                      </td>
                      <td className="px-6 py-4 font-medium text-on-surface">
                        <Link href={`/leads/${lead.id}`} className="hover:text-primary transition-colors">
                          {lead.fullName}
                        </Link>
                        <span className="text-xs text-on-surface-variant block font-normal">{lead.phonePrimary}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${lead.score >= 80 ? "text-error" : lead.score >= 60 ? "text-tertiary" : "text-on-surface-variant"}`}>{lead.score}</span>
                          <div className="w-16 h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${lead.score >= 80 ? "bg-error" : lead.score >= 60 ? "bg-tertiary" : "bg-outline-variant"}`}
                              style={{ width: `${lead.score}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary-container/50 text-secondary">{lead.coverageType}</span>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant capitalize">{lead.source.replace("_", " ")}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 rounded bg-surface-container hover:bg-tertiary-container hover:text-on-tertiary-container text-on-surface-variant transition-colors" title="Add to Emma AI">
                            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                          </button>
                          <button className="p-1.5 rounded bg-surface-container hover:bg-surface-container-highest text-on-surface-variant transition-colors" title="Skip">
                            <span className="material-symbols-outlined text-[18px]">skip_next</span>
                          </button>
                          <Link href={`/leads/${lead.id}`}>
                            <button className="p-1.5 rounded bg-primary-container text-on-primary-container hover:bg-primary transition-colors" title="View Lead">
                              <span className="material-symbols-outlined text-[18px]">person</span>
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-outline-variant/15 bg-surface-container text-center text-xs text-on-surface-variant">
            Showing top {queueLeads.length} of {queueLeads.length} queued leads.
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
}
