"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/stores";
import { useAuthStore } from "@/lib/stores";
import type { Lead } from "@/types";

const getStatusBadge = (status: string, color: string) => {
  const colorClasses: Record<string, string> = {
    tertiary: "bg-tertiary-container/20 text-tertiary border-tertiary-container/30",
    surface: "bg-surface-container-highest text-on-surface-variant border-outline-variant/30",
    primary: "bg-primary-container/20 text-primary-fixed-dim border-primary-container/30",
    error: "bg-error-container/20 text-error border-error-container/30",
    "primary-container": "bg-primary-container/20 text-primary border-primary-container/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border inline-flex items-center gap-1 ${colorClasses[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current`}></span>
      {status}
    </span>
  );
};

export default function LeadsPage() {
  const session = useAuthStore((s) => s.session);
  const leads = useDataStore((s) => s.leads);
  const stages = useDataStore((s) => s.stages);
  const [filter, setFilter] = useState("");
  const [selectedCoverage, setSelectedCoverage] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const myLeads = useMemo(() => {
    return leads.filter((l) => {
      if (l.deletedAt) return false;
      if (l.workspaceId !== session?.workspaceId) return false;
      if (session?.role === "agent" && l.assignedAgentId !== session?.userId) return false;
      if (filter && !l.fullName.toLowerCase().includes(filter.toLowerCase())) return false;
      if (selectedCoverage && l.coverageType !== selectedCoverage) return false;
      if (selectedStage && l.pipeline.stageId !== selectedStage) return false;
      return true;
    });
  }, [leads, session, filter, selectedCoverage, selectedStage]);

  const totalLeads = myLeads.length;
  const hotLeads = myLeads.filter((l) => l.score >= 80).length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === myLeads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(myLeads.map((l) => l.id)));
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* High-level Summary Bar */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">Total Leads</span>
            <span className="material-symbols-outlined text-primary-container text-lg">groups</span>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold tracking-tight text-on-surface">{totalLeads}</h3>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary-container/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">Hot Leads</span>
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
              </span>
              <span className="material-symbols-outlined text-tertiary text-lg">local_fire_department</span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold tracking-tight text-on-surface">{hotLeads}</h3>
            <span className="text-xs text-on-surface-variant mb-1">Requires action</span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-error-container/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">New This Week</span>
            <span className="material-symbols-outlined text-error text-lg">person_add</span>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold tracking-tight text-on-surface">{myLeads.filter((l) => l.createdAt > Date.now() - 7 * 86400000).length}</h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-surface-container-low to-surface-container rounded-xl p-4 border border-tertiary-container/30 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-8xl text-tertiary">auto_awesome</span>
          </div>
          <div className="flex justify-between items-start mb-1 relative z-10">
            <span className="text-xs font-bold text-tertiary tracking-wider uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] icon-fill">smart_toy</span> RevRa AI
            </span>
          </div>
          <p className="text-sm text-on-surface-variant leading-snug mt-1 relative z-10">
            <span className="text-on-surface font-medium">{hotLeads}</span> leads scored 80+ — prioritize immediately.
          </p>
        </div>
      </section>

      {/* Data Area Header & Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Active Pool</h2>
            <p className="text-xs text-on-surface-variant">Showing {myLeads.length} leads</p>
          </div>
          {selected.size > 0 && (
            <div className="glass-panel px-3 py-1.5 rounded-lg border border-outline-variant/20 flex items-center gap-3">
              <span className="text-xs font-medium text-primary bg-primary-container/20 px-2 py-0.5 rounded">{selected.size} Selected</span>
              <div className="w-px h-4 bg-outline-variant/30"></div>
              <button className="text-on-surface hover:text-primary transition-colors flex items-center gap-1 text-xs font-medium">
                <span className="material-symbols-outlined text-[16px]">person_add</span> Assign
              </button>
              <button className="text-on-surface hover:text-error transition-colors flex items-center gap-1 text-xs font-medium">
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Advanced Filter Bar */}
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 border-r border-outline-variant/20 pr-3">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">filter_list</span>
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Filters</span>
          </div>
          <input
            type="text"
            placeholder="Search by name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-surface border border-outline-variant/30 px-3 py-1.5 rounded text-xs text-on-surface focus:outline-none focus:border-primary"
          />
          <select
            value={selectedCoverage}
            onChange={(e) => setSelectedCoverage(e.target.value)}
            className="bg-surface border border-outline-variant/30 px-3 py-1.5 rounded text-xs text-on-surface"
          >
            <option value="">All Coverage</option>
            <option value="Medicare">Medicare</option>
            <option value="ACA">ACA</option>
            <option value="Final Expense">Final Expense</option>
            <option value="Life">Life</option>
            <option value="Group Health">Group Health</option>
          </select>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="bg-surface border border-outline-variant/30 px-3 py-1.5 rounded text-xs text-on-surface"
          >
            <option value="">All Stages</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {(filter || selectedCoverage || selectedStage) && (
            <button
              onClick={() => { setFilter(""); setSelectedCoverage(""); setSelectedStage(""); }}
              className="text-xs text-primary font-medium px-2 hover:underline ml-auto"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/15 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-surface-container-high sticky top-0 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
              <tr className="text-[10px] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    className="rounded border-outline-variant/40 bg-surface-container-lowest text-primary-container focus:ring-primary-container focus:ring-offset-surface-container-high cursor-pointer"
                    type="checkbox"
                    checked={selected.size === myLeads.length && myLeads.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="py-3 px-4">Lead Name</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Coverage Type</th>
                <th className="py-3 px-4 w-32">AI Score</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/5 text-sm text-on-surface">
              {myLeads.map((lead) => {
                const stage = stages.find((s) => s.id === lead.pipeline.stageId);
                const daysInStage = Math.floor(
                  (Date.now() - lead.pipeline.enteredStageAt) / (1000 * 60 * 60 * 24)
                );
                const stageColor =
                  stage?.position === 8 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  stage?.position === 9 ? "bg-error/10 text-error border-error/20" :
                  daysInStage > 7 ? "bg-error/10 text-error border-error/20" :
                  "bg-surface-container text-on-surface-variant border-outline-variant/30";
                return (
                  <tr key={lead.id} className="hover:bg-surface-bright transition-colors group">
                    <td className="py-2.5 px-4 text-center">
                      <input
                        className="rounded border-outline-variant/40 bg-surface-container-lowest text-primary-container focus:ring-primary-container cursor-pointer"
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <Link href={`/leads/${lead.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                        <div className="w-7 h-7 rounded bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
                          {lead.fullName.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{lead.fullName}</span>
                          <span className="text-[11px] text-on-surface-variant font-mono">{lead.phonePrimary}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${stageColor}`}>
                        {stage?.name || "Unknown"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{lead.coverageType}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${lead.score >= 80 ? "text-tertiary" : lead.score >= 50 ? "text-on-surface" : "text-on-surface-variant"}`}>
                          {lead.score}
                        </span>
                        <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              lead.score >= 80 ? "bg-gradient-to-r from-tertiary to-tertiary-container" : lead.score >= 50 ? "bg-primary" : "bg-outline-variant"
                            }`}
                            style={{ width: `${lead.score}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      {lead.assignedAgentId ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold">
                            A
                          </div>
                          <span className="text-xs">Agent</span>
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-xs">
                      <div className="flex flex-col">
                        <span>{daysInStage}d in stage</span>
                        <span className="text-[10px] text-on-surface-variant">{lead.source.replace("_", " ")}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded transition-colors" title="Call">
                          <span className="material-symbols-outlined text-[16px]">call</span>
                        </button>
                        <Link href={`/leads/${lead.id}`} className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded transition-colors">
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="bg-surface-container-high border-t border-outline-variant/15 p-3 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">Showing 1-{Math.min(myLeads.length, 50)} of {myLeads.length}</span>
          <div className="flex items-center gap-2">
            <button className="text-xs text-on-surface-variant hover:text-on-surface px-2 py-1 rounded hover:bg-surface-variant transition-colors disabled:opacity-50" disabled>Previous</button>
            <div className="flex gap-1">
              <button className="w-6 h-6 flex items-center justify-center rounded bg-primary-container text-on-primary-container text-xs font-medium">1</button>
              <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-variant text-on-surface-variant text-xs font-medium transition-colors">2</button>
            </div>
            <button className="text-xs text-on-surface hover:text-primary px-2 py-1 rounded hover:bg-surface-variant transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
