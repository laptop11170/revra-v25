"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useLeads, useUpdateLead } from "@/hooks/useLeads";
import { usePipelineStages } from "@/hooks/useWorkspace";
import { useAuthStore } from "@/lib/stores";
import Link from "next/link";
import { useState } from "react";
import type { CoverageType } from "@/types";

const stageColors: Record<string, string> = {
  "#2d5bff": "#2d5bff",
  "#b8c3ff": "#b8c3ff",
  "#eaddff": "#eaddff",
  "#8342f4": "#8342f4",
  "#dde1ff": "#dde1ff",
  "#d2bbff": "#d2bbff",
  "#10b981": "#10b981",
  "#ffb4ab": "#ffb4ab",
  "#fbbf24": "#fbbf24",
  "#f87171": "#f87171",
  "#6b7280": "#6b7280",
};

type CoverageFilter = "All" | CoverageType;
type OwnerFilter = "All" | "Mine";

export default function PipelinePage() {
  const session = useAuthStore((s) => s.session);
  const { data: allLeads = [] } = useLeads();
  const { data: stages = [] } = usePipelineStages();
  const updateLead = useUpdateLead();

  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("All");
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("Mine");
  const [showCoverageMenu, setShowCoverageMenu] = useState(false);
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);

  const myLeads = allLeads.filter((l: any) => {
    if (l.deletedAt) return false;
    if (session?.role === "agent" && l.assignedAgentId !== session?.userId) return false;
    if (coverageFilter !== "All" && l.coverageType !== coverageFilter) return false;
    return true;
  }).filter((l: any) => {
    if (ownerFilter === "Mine" && session?.role === "agent") {
      return l.assignedAgentId === session?.userId;
    }
    return true;
  });

  const getStageColor = (color: string) => stageColors[color] || "#6b7280";

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      updateLead.mutate({ id: leadId, pipeline: { stageId: targetStageId, enteredStageAt: Date.now() } });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <SubPageLayout>
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-xl font-bold tracking-tight text-on-surface">Pipeline</h2>
          <div className="h-5 w-px bg-outline-variant/30"></div>
          <div className="flex items-center gap-2 relative">
            {/* Coverage Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowCoverageMenu(!showCoverageMenu); setShowOwnerMenu(false); }}
                className="px-3 py-1.5 rounded-full bg-surface-container-highest text-xs font-medium text-on-surface hover:bg-surface-bright transition-colors flex items-center gap-1"
              >
                {coverageFilter === "All" ? "All Coverages" : coverageFilter} <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
              </button>
              {showCoverageMenu && (
                <div className="absolute top-full left-0 mt-1 bg-surface-container-highest border border-outline-variant/30 rounded-lg shadow-xl py-1 z-50 min-w-[140px]">
                  <button onClick={() => { setCoverageFilter("All"); setShowCoverageMenu(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-container transition-colors ${coverageFilter === "All" ? "text-primary font-semibold" : "text-on-surface"}`}>All Coverages</button>
                  {(["ACA", "Medicare", "Final Expense", "Life", "Group Health"] as CoverageType[]).map((c) => (
                    <button key={c} onClick={() => { setCoverageFilter(c); setShowCoverageMenu(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-container transition-colors ${coverageFilter === c ? "text-primary font-semibold" : "text-on-surface"}`}>{c}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Owner Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowOwnerMenu(!showOwnerMenu); setShowCoverageMenu(false); }}
                className="px-3 py-1.5 rounded-full bg-surface-container-highest text-xs font-medium text-on-surface hover:bg-surface-bright transition-colors flex items-center gap-1"
              >
                {ownerFilter === "All" ? "All Leads" : "My Leads"} <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
              </button>
              {showOwnerMenu && (
                <div className="absolute top-full left-0 mt-1 bg-surface-container-highest border border-outline-variant/30 rounded-lg shadow-xl py-1 z-50 min-w-[120px]">
                  <button onClick={() => { setOwnerFilter("All"); setShowOwnerMenu(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-container transition-colors ${ownerFilter === "All" ? "text-primary font-semibold" : "text-on-surface"}`}>All Leads</button>
                  <button onClick={() => { setOwnerFilter("Mine"); setShowOwnerMenu(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-container transition-colors ${ownerFilter === "Mine" ? "text-primary font-semibold" : "text-on-surface"}`}>My Leads</button>
                </div>
              )}
            </div>
          </div>
          <span className="ml-auto text-sm text-on-surface-variant">
            {myLeads.length} lead{myLeads.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-w-max">
            {stages.map((stage: any) => {
              const stageLeads = myLeads.filter((l: any) => l.pipeline?.stageId === stage.id);
              const daysInStage = (enteredAt: number) =>
                Math.floor((Date.now() - enteredAt) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={stage.id}
                  className="w-80 flex flex-col h-full bg-surface-container-low rounded-xl border border-outline-variant/10"
                  onDrop={(e) => handleDrop(e, stage.id)}
                  onDragOver={handleDragOver}
                >
                  <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-highest/50 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getStageColor(stage.color) }}
                      ></span>
                      <h3 className="text-sm font-bold tracking-wide uppercase text-on-surface">
                        {stage.name}
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {stageLeads.map((lead: any) => {
                      const days = daysInStage((lead.pipeline as any).enteredStageAt || lead.pipeline.enteredStageAt);
                      const isStalled = days > 7;

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          className="bg-surface-container p-4 rounded-lg border border-outline-variant/10 hover:border-outline-variant/30 transition-colors cursor-grab active:cursor-grabbing relative group shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                        >
                          {isStalled && (
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-error border-2 border-surface-container shadow-[0_0_8px_rgba(255,180,171,0.5)]"></div>
                          )}

                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-secondary-container/30 text-secondary">
                              {lead.coverageType}
                            </span>
                            <div className="flex items-center gap-1 text-tertiary">
                              <span className="material-symbols-outlined text-[14px]">psychology</span>
                              <span className="text-xs font-bold">{lead.score}</span>
                            </div>
                          </div>

                          <Link href={`/leads/${lead.id}`}>
                            <h4 className="text-base font-semibold text-on-surface mb-1 hover:text-primary transition-colors">
                              {lead.fullName}
                            </h4>
                          </Link>

                          <div className="flex justify-between items-center border-t border-outline-variant/10 pt-3 mt-3">
                            <span className={`text-[10px] flex items-center gap-1 ${isStalled ? "text-error font-medium" : "text-on-surface-variant"}`}>
                              <span className="material-symbols-outlined text-[12px]">
                                {isStalled ? "warning" : "schedule"}
                              </span>
                              {isStalled ? `${days}d in stage` : `${days}d in stage`}
                            </span>
                            <div className="w-6 h-6 rounded-full bg-surface-bright flex items-center justify-center text-[10px] font-bold text-on-surface">
                              {getInitials(lead.fullName)}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {stageLeads.length === 0 && (
                      <div className="flex items-center justify-center h-32 border border-dashed border-outline-variant/30 rounded-lg">
                        <div className="text-center">
                          <span className="material-symbols-outlined text-outline text-3xl mb-2">inbox</span>
                          <p className="text-xs text-on-surface-variant">Drop leads here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
}
