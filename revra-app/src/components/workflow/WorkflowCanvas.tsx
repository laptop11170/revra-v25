"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { WorkflowNode, WorkflowEdge } from "@/types";
import { useUpdateWorkflow } from "@/hooks/useWorkflows";

const NODE_PALETTE: { type: WorkflowNode["type"]; label: string; color: string; icon: string; defaultLabel: string }[] = [
  { type: "trigger", label: "Trigger", color: "#3b82f6", icon: "bolt", defaultLabel: "Lead Created" },
  { type: "condition", label: "Condition", color: "#f59e0b", icon: "call_split", defaultLabel: "If Score >" },
  { type: "action", label: "Action", color: "#10b981", icon: "flash_on", defaultLabel: "Send SMS" },
  { type: "delay", label: "Delay", color: "#6b7280", icon: "schedule", defaultLabel: "Wait 1 Hour" },
];

interface WorkflowCanvasProps {
  workflowId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isActive: boolean;
  onSave: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
}

interface Point { x: number; y: number }

function getNodeCenter(node: WorkflowNode): Point {
  return { x: node.position.x + 120, y: node.position.y + 40 };
}

function getBezierPath(p1: Point, p2: Point): string {
  const dx = Math.abs(p2.x - p1.x);
  const cx = Math.max(dx * 0.5, 80);
  return `M ${p1.x} ${p1.y} C ${p1.x + cx} ${p1.y}, ${p2.x - cx} ${p2.y}, ${p2.x} ${p2.y}`;
}

export default function WorkflowCanvas({ workflowId, nodes: initialNodes, edges: initialEdges, isActive, onSave }: WorkflowCanvasProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [nodeCounter, setNodeCounter] = useState(initialNodes.length + 1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const updateWorkflow = useUpdateWorkflow();

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  const getNodeColor = (type: WorkflowNode["type"]) =>
    NODE_PALETTE.find(p => p.type === type)?.color || "#6b7280";
  const getNodeIcon = (type: WorkflowNode["type"]) =>
    NODE_PALETTE.find(p => p.type === type)?.icon || "circle";
  const getNodeLabel = (type: WorkflowNode["type"]) =>
    NODE_PALETTE.find(p => p.type === type)?.label || type;

  const addNode = (type: WorkflowNode["type"]) => {
    const def = NODE_PALETTE.find(p => p.type === type)!;
    const newNode: WorkflowNode = {
      id: `node-${nodeCounter}`,
      type,
      label: def.defaultLabel,
      config: getDefaultConfig(type),
      position: { x: 100 + Math.random() * 200, y: 100 + nodes.length * 120 },
    };
    setNodeCounter(n => n + 1);
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  function getDefaultConfig(type: WorkflowNode["type"]): Record<string, unknown> {
    switch (type) {
      case "trigger":
        return { type: "lead_created" };
      case "condition":
        return { field: "score", operator: "greater_than", value: 70 };
      case "action":
        return { actionType: "send_sms", message: "Hi {{lead_name}}, following up on your inquiry!" };
      case "delay":
        return { delayMinutes: 60 };
      default:
        return {};
    }
  }

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).closest(".canvas-bg")) {
      if (e.button === 0 && !draggingNodeId) {
        setSelectedNodeId(null);
      }
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        e.preventDefault();
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }

    if (draggingNodeId) {
      setNodes(prev => prev.map(n =>
        n.id === draggingNodeId
          ? { ...n, position: { x: x - pan.x - dragOffset.x, y: y - pan.y - dragOffset.y } }
          : n
      ));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setConnectingFrom(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDraggingNodeId(nodeId);
    setDragOffset({ x: x - pan.x - node.position.x, y: y - pan.y - node.position.y });
    setSelectedNodeId(nodeId);
  };

  const handleConnectorMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnectingFrom(nodeId);
  };

  const handleNodeMouseUp = (e: React.MouseEvent, nodeId: string) => {
    if (connectingFrom && connectingFrom !== nodeId) {
      const newEdge: WorkflowEdge = {
        id: `edge-${Date.now()}`,
        sourceId: connectingFrom,
        targetId: nodeId,
      };
      // Avoid duplicate edges
      const exists = edges.some(e => e.sourceId === connectingFrom && e.targetId === nodeId);
      if (!exists) {
        setEdges(prev => [...prev, newEdge]);
      }
    }
  };

  const handleEdgeClick = (e: React.MouseEvent, edgeId: string) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setEdges(prev => prev.filter(ee => ee.id !== edgeId));
    }
  };

  const handleSave = async () => {
    await updateWorkflow.mutateAsync({
      id: workflowId,
      nodes,
      edges,
      isActive,
    });
    onSave(nodes, edges);
  };

  const triggerOptions = [
    { value: "lead_created", label: "Lead Created" },
    { value: "lead_stage_changed", label: "Stage Changed" },
    { value: "lead_assigned", label: "Lead Assigned" },
    { value: "score_threshold", label: "Score Threshold" },
    { value: "appointment_scheduled", label: "Appointment Scheduled" },
    { value: "call_completed", label: "Call Completed" },
    { value: "sms_sent", label: "SMS Sent" },
  ];

  const conditionFieldOptions = [
    { value: "outcome", label: "Outcome" },
    { value: "score", label: "Lead Score" },
    { value: "source", label: "Lead Source" },
    { value: "coverage_type", label: "Coverage Type" },
    { value: "days_in_stage", label: "Days in Stage" },
  ];

  const conditionOpOptions = [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "not equals" },
    { value: "greater_than", label: ">" },
    { value: "less_than", label: "<" },
    { value: "contains", label: "contains" },
  ];

  const actionTypeOptions = [
    { value: "send_sms", label: "Send SMS" },
    { value: "update_stage", label: "Update Stage" },
    { value: "assign_agent", label: "Assign Agent" },
    { value: "add_tag", label: "Add Tag" },
    { value: "queue_emma", label: "Queue to Emma AI" },
  ];

  const stageOptions = [
    { value: "stage-1", label: "New Lead" },
    { value: "stage-2", label: "Contacted" },
    { value: "stage-3", label: "Quoted" },
    { value: "stage-4", label: "Application" },
    { value: "stage-5", label: "Underwriting" },
    { value: "stage-6", label: "Bound" },
  ];

  return (
    <div className="flex h-full gap-0">
      {/* Node Palette */}
      <div className="w-48 bg-surface-container-low border-r border-outline-variant/15 flex flex-col shrink-0">
        <div className="p-3 border-b border-outline-variant/10">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Node Types</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {NODE_PALETTE.map(def => (
            <button
              key={def.type}
              onClick={() => addNode(def.type)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors border border-transparent hover:border-outline-variant/30 group"
            >
              <div
                className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                style={{ backgroundColor: def.color + "22" }}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: def.color }}>{def.icon}</span>
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-on-surface">{def.label}</p>
                <p className="text-[10px] text-on-surface-variant">Click to add</p>
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-outline-variant/10">
          <button
            onClick={handleSave}
            disabled={updateWorkflow.isPending}
            className="w-full py-2.5 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold hover:bg-primary-container/90 transition-colors disabled:opacity-40"
          >
            {updateWorkflow.isPending ? "Saving..." : "Save Workflow"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-surface cursor-crosshair select-none canvas-bg"
        style={{ backgroundImage: "radial-gradient(circle, var(--color-outline-variant, #6b7280) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        {/* Nodes layer */}
        <div
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          {/* Edges SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
              </marker>
            </defs>
            {edges.map(edge => {
              const source = nodes.find(n => n.id === edge.sourceId);
              const target = nodes.find(n => n.id === edge.targetId);
              if (!source || !target) return null;
              const p1 = { x: source.position.x + 240, y: source.position.y + 40 };
              const p2 = { x: target.position.x, y: target.position.y + 40 };
              return (
                <g key={edge.id} onClick={(e) => handleEdgeClick(e, edge.id)} className="pointer-events-auto cursor-pointer hover:opacity-80">
                  <path
                    d={getBezierPath(p1, p2)}
                    stroke="#6b7280"
                    strokeWidth={2}
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                  {edge.condition && (
                    <text
                      x={(p1.x + p2.x) / 2}
                      y={(p1.y + p2.y) / 2 - 8}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#9ca3af"
                    >
                      {edge.condition === "yes" ? "✓" : "✗"}
                    </text>
                  )}
                </g>
              );
            })}
            {/* Connecting line while dragging */}
            {connectingFrom && (() => {
              const source = nodes.find(n => n.id === connectingFrom);
              if (!source) return null;
              const p1 = { x: source.position.x + 240, y: source.position.y + 40 };
              const p2 = { x: mousePos.x - pan.x, y: mousePos.y - pan.y };
              return (
                <path
                  d={getBezierPath(p1, p2)}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="none"
                  strokeDasharray="6,3"
                />
              );
            })()}
          </svg>

          {/* Node elements */}
          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute w-60 rounded-xl border-2 shadow-lg transition-shadow ${
                selectedNodeId === node.id ? "border-primary shadow-primary/20" : "border-outline-variant/20"
              }`}
              style={{
                left: node.position.x,
                top: node.position.y,
                backgroundColor: "var(--color-surface-container-highest, #1e293b)",
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
            >
              {/* Header */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-t-xl"
                style={{ backgroundColor: getNodeColor(node.type) + "22" }}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: getNodeColor(node.type) }}>
                  {getNodeIcon(node.type)}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: getNodeColor(node.type) }}>
                  {getNodeLabel(node.type)}
                </span>
                {node.type === "trigger" && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">START</span>
                )}
              </div>
              {/* Body */}
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-on-surface truncate">{node.label}</p>
                {node.type === "condition" && (
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    {String(node.config.field || "?")} {String(node.config.operator || "?")} {String(node.config.value || "?")}
                  </p>
                )}
                {node.type === "action" && (
                  <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">
                    {String(node.config.actionType || "action")}
                  </p>
                )}
                {node.type === "delay" && (
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    Wait {String(node.config.delayMinutes || 60)} min
                  </p>
                )}
              </div>
              {/* Connector handles */}
              {/* Input connector */}
              <div
                className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-surface border-2 border-outline flex items-center justify-center cursor-crosshair hover:scale-125 transition-transform"
                style={{ borderColor: getNodeColor(node.type) }}
                onMouseDown={(e) => handleConnectorMouseDown(e, node.id)}
              />
              {/* Output connector */}
              {node.type !== "trigger" && (
                <div
                  className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-surface border-2 border-outline flex items-center justify-center cursor-crosshair hover:scale-125 transition-transform"
                  style={{ borderColor: getNodeColor(node.type) }}
                  onMouseDown={(e) => { e.stopPropagation(); setConnectingFrom(node.id); }}
                />
              )}
              {/* Delete button */}
              <button
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-error text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity text-xs"
                onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                style={{ opacity: selectedNodeId === node.id ? 1 : undefined }}
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </div>
          ))}
        </div>

        {/* Help text */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-on-surface-variant bg-surface/80 px-3 py-1.5 rounded-lg pointer-events-none">
          Click a node type to add · Drag nodes to move · Click output handle then input handle to connect · Shift+click edge to delete
        </div>
      </div>

      {/* Node Config Panel */}
      {selectedNode && (
        <div className="w-64 bg-surface-container-low border-l border-outline-variant/15 flex flex-col shrink-0">
          <div className="p-3 border-b border-outline-variant/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Configure Node</h3>
            <button onClick={() => setSelectedNodeId(null)} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Label</label>
              <input
                value={selectedNode.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {selectedNode.type === "trigger" && (
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Trigger Event</label>
                <select
                  value={String(selectedNode.config.type || "lead_created")}
                  onChange={(e) => updateNode(selectedNode.id, { config: { ...selectedNode.config, type: e.target.value } })}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  {triggerOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedNode.type === "condition" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Field</label>
                  <select
                    value={String(selectedNode.config.field || "score")}
                    onChange={(e) => updateNode(selectedNode.id, { config: { ...selectedNode.config, field: e.target.value } })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  >
                    {conditionFieldOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Operator</label>
                  <select
                    value={String(selectedNode.config.operator || "greater_than")}
                    onChange={(e) => updateNode(selectedNode.id, { config: { ...selectedNode.config, operator: e.target.value } })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  >
                    {conditionOpOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Value</label>
                  <input
                    type="text"
                    value={String(selectedNode.config.value || "")}
                    onChange={(e) => updateNode(selectedNode.id, { config: { ...selectedNode.config, value: e.target.value } })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </>
            )}

            {selectedNode.type === "action" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Action Type</label>
                  <select
                    value={String(selectedNode.config.actionType || "send_sms")}
                    onChange={(e) => updateNode(selectedNode.id, { config: { ...selectedNode.config, actionType: e.target.value } })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  >
                    {actionTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {selectedNode.config.actionType === "send_sms" && (
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Message</label>
                    <textarea
                      value={String(selectedNode.config.message || "")}
                      onChange={(e) => updateNode(selectedNode.id, { config: { ...selectedNode.config, message: e.target.value } })}
                      rows={3}
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
                    />
                    <p className="text-[10px] text-on-surface-variant mt-1">Use {"{{lead_name}}"} for personalization</p>
                  </div>
                )}
                {selectedNode.config.actionType === "update_stage" && (
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Target Stage</label>
                    <select
                      value={String(selectedNode.config.targetStageId || "")}
                      onChange={(e) => updateNode(selectedNode.id, { config: { ...selectedNode.config, targetStageId: e.target.value } })}
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                    >
                      {stageOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedNode.config.actionType === "add_tag" && (
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Tag</label>
                    <input
                      value={String(selectedNode.config.tag || "")}
                      onChange={(e) => updateNode(selectedNode.id, { config: { ...selectedNode.config, tag: e.target.value } })}
                      placeholder="e.g. hot-lead"
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </>
            )}

            {selectedNode.type === "delay" && (
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Wait Duration (minutes)</label>
                <input
                  type="number"
                  value={Number(selectedNode.config.delayMinutes || 60)}
                  onChange={(e) => updateNode(selectedNode.id, { config: { ...selectedNode.config, delayMinutes: parseInt(e.target.value) || 60 } })}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
          <div className="p-3 border-t border-outline-variant/10">
            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="w-full py-2 rounded-lg bg-error/10 text-error text-sm font-medium hover:bg-error/20 transition-colors"
            >
              Delete Node
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
