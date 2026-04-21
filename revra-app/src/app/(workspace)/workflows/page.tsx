"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useDataStore } from "@/lib/stores";
import { useAuthStore } from "@/lib/stores";
import Link from "next/link";

export default function WorkflowsPage() {
  const session = useAuthStore((s) => s.session);
  const workflows = useDataStore((s) => s.workflows);

  const myWorkflows = workflows.filter((w) => w.workspaceId === session?.workspaceId);

  return (
    <SubPageLayout>
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-xl font-bold tracking-tight text-on-surface">Workflows</h2>
          <div className="h-5 w-px bg-outline-variant/30"></div>
          <span className="text-sm text-on-surface-variant">{myWorkflows.length} active workflow{myWorkflows.length !== 1 ? "s" : ""}</span>
        </div>

        {myWorkflows.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl text-outline mb-4">hub</span>
              <p className="text-on-surface font-medium mb-2">No workflows yet</p>
              <p className="text-sm text-on-surface-variant mb-6">Create automated workflows to streamline your lead management</p>
              <button className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-container/90 transition-colors shadow-[0_4px_14px_rgba(45,91,255,0.25)]">
                Create Workflow
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-surface-container rounded-xl p-5 border border-outline-variant/10 hover:border-outline-variant/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-on-surface mb-1">{workflow.name}</h3>
                    <p className="text-xs text-on-surface-variant">{workflow.description || "No description"}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    workflow.isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-surface-variant text-on-surface-variant"
                  }`}>
                    {workflow.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-4">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">account_tree</span>
                    {workflow.nodes.length} nodes
                  </span>
                  {workflow.totalRuns !== undefined && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                      {workflow.totalRuns} runs
                    </span>
                  )}
                  {workflow.effectivenessScore !== undefined && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span>
                      {workflow.effectivenessScore}%
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded bg-surface-container-low hover:bg-surface-container text-sm font-medium text-on-surface transition-colors border border-outline-variant/10">
                    Edit
                  </button>
                  <button className="px-3 py-2 rounded bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/10">
                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SubPageLayout>
  );
}
