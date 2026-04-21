"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useDataStore } from "@/lib/stores";
import { useAuthStore } from "@/lib/stores";
import Link from "next/link";

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

export default function PipelinePage() {
  const session = useAuthStore((s) => s.session);
  const leads = useDataStore((s) => s.leads);
  const stages = useDataStore((s) => s.stages);
  const moveLeadToStage = useDataStore((s) => s.moveLeadToStage);

  const myLeads = leads.filter((l) => {
    if (l.deletedAt) return false;
    if (l.workspaceId !== session?.workspaceId) return false;
    if (session?.role === "agent" && l.assignedAgentId !== session?.userId) return false;
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
      moveLeadToStage(leadId, targetStageId);
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
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-full bg-surface-container-highest text-xs font-medium text-on-surface hover:bg-surface-bright transition-colors flex items-center gap-1">
              All Coverages <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
            </button>
            <button className="px-3 py-1.5 rounded-full bg-surface-container-highest text-xs font-medium text-on-surface hover:bg-surface-bright transition-colors flex items-center gap-1">
              My Leads <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
            </button>
          </div>
          <span className="ml-auto text-sm text-on-surface-variant">
            {myLeads.length} lead{myLeads.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-w-max">
            {stages.map((stage) => {
              const stageLeads = myLeads.filter((l) => l.pipeline.stageId === stage.id);
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
                    {stageLeads.map((lead) => {
                      const days = daysInStage(lead.pipeline.enteredStageAt);
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
