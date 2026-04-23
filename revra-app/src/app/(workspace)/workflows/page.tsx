"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useWorkflows, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow } from "@/hooks/useWorkflows";
import { useState } from "react";
import WorkflowCanvas from "@/components/workflow/WorkflowCanvas";

export default function WorkflowsPage() {
  const { data: workflowsData, isLoading } = useWorkflows();
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();

  const workflows = (workflowsData as any)?.data || [];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWfId, setEditingWfId] = useState<string | null>(null);
  const [canvasWfData, setCanvasWfData] = useState<{ nodes: any[]; edges: any[]; isActive: boolean } | null>(null);
  const [wfName, setWfName] = useState("");
  const [wfDesc, setWfDesc] = useState("");
  const [wfActive, setWfActive] = useState(true);

  const handleCreate = async () => {
    if (!wfName.trim()) return;
    await createWorkflow.mutateAsync({
      name: wfName.trim(),
      description: wfDesc.trim() || undefined,
      isActive: wfActive,
      nodes: [{ id: "1", type: "trigger", label: "Lead Assigned", config: { type: "lead_assigned" }, position: { x: 200, y: 100 } }],
      edges: [],
    });
    setShowCreateModal(false);
    setWfName(""); setWfDesc(""); setWfActive(true);
  };

  const handleEdit = (workflow: any) => {
    setEditingWfId(workflow.id);
    setWfName(workflow.name);
    setWfDesc(workflow.description || "");
    setWfActive(workflow.isActive);
    setCanvasWfData({ nodes: workflow.nodes || [], edges: workflow.edges || [], isActive: workflow.isActive });
  };

  const handleSaveEdit = async () => {
    if (!editingWfId || !wfName.trim()) return;
    await updateWorkflow.mutateAsync({
      id: editingWfId,
      name: wfName.trim(),
      description: wfDesc.trim() || undefined,
      isActive: wfActive,
    });
    setEditingWfId(null);
    setCanvasWfData(null);
    setWfName(""); setWfDesc("");
  };

  const handleDelete = async (workflowId: string) => {
    if (!confirm("Delete this workflow?")) return;
    await deleteWorkflow.mutateAsync(workflowId);
  };

  return (
    <SubPageLayout>
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-xl font-bold tracking-tight text-on-surface">Workflows</h2>
          <div className="h-5 w-px bg-outline-variant/30"></div>
          <span className="text-sm text-on-surface-variant">{workflows.length} workflow{workflows.length !== 1 ? "s" : ""}</span>
        </div>

        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-on-surface-variant">Loading workflows...</p>
          </div>
        )}

        {!isLoading && workflows.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl text-outline mb-4">hub</span>
              <p className="text-on-surface font-medium mb-2">No workflows yet</p>
              <p className="text-sm text-on-surface-variant mb-6">Create automated workflows to streamline your lead management</p>
              <button onClick={() => setShowCreateModal(true)} className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-container/90 transition-colors shadow-[0_4px_14px_rgba(45,91,255,0.25)]">
                Create Workflow
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow: any) => (
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
                    {workflow.nodes?.length || 0} nodes
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
                  <button onClick={() => handleEdit(workflow)} className="flex-1 py-2 rounded bg-surface-container-low hover:bg-surface-container text-sm font-medium text-on-surface transition-colors border border-outline-variant/10">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(workflow.id)} className="px-3 py-2 rounded bg-surface-container-low hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors border border-outline-variant/10">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setShowCreateModal(false)}>
          <div className="bg-surface-container-highest rounded-2xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface">Create Workflow</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Workflow Name</label>
                <input value={wfName} onChange={(e) => setWfName(e.target.value)} placeholder="e.g. New Lead Follow-Up" className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Description</label>
                <textarea value={wfDesc} onChange={(e) => setWfDesc(e.target.value)} placeholder="What does this workflow do?" rows={3} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface">Active immediately</span>
                <button onClick={() => setWfActive(!wfActive)} className={`w-12 h-6 rounded-full transition-colors relative ${wfActive ? "bg-primary" : "bg-surface-container-highest"}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${wfActive ? "left-7" : "left-1"}`}></span>
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={createWorkflow.isPending} className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold hover:bg-primary-container/90 transition-colors disabled:opacity-40">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Editor Overlay */}
      {editingWfId && canvasWfData && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col">
          {/* Canvas top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-container border-b border-outline-variant/15">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setEditingWfId(null); setCanvasWfData(null); }}
                className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to List
              </button>
              <div className="h-5 w-px bg-outline-variant/30" />
              <input
                value={wfName}
                onChange={(e) => setWfName(e.target.value)}
                className="bg-transparent text-sm font-bold text-on-surface focus:outline-none border-b border-transparent focus:border-primary px-1"
                placeholder="Workflow name"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant">Active</span>
                <button
                  onClick={() => setWfActive(!wfActive)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${wfActive ? "bg-emerald-500" : "bg-surface-container-highest"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${wfActive ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
              <button
                onClick={handleSaveEdit}
                disabled={updateWorkflow.isPending}
                className="px-4 py-1.5 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold hover:bg-primary-container/90 transition-colors disabled:opacity-40"
              >
                {updateWorkflow.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          {/* Canvas */}
          <div className="flex-1">
            <WorkflowCanvas
              workflowId={editingWfId}
              nodes={canvasWfData.nodes}
              edges={canvasWfData.edges}
              isActive={wfActive}
              onSave={(nodes, edges) => setCanvasWfData(prev => prev ? { ...prev, nodes, edges } : null)}
            />
          </div>
        </div>
      )}
    </SubPageLayout>
  );
}