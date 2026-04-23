"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDataStore, useAuthStore } from "@/lib/stores";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from "@/hooks/useLeads";
import { usePipelineStages } from "@/hooks/useWorkspace";
import { useAgents } from "@/hooks/useAgents";
import type { Lead, CoverageType, Call } from "@/types";
import { USERS } from "@/lib/db/seed";

const PAGE_SIZE = 50;

const stageBadgeClass = (position: number, daysInStage: number) => {
  if (position === 8) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (position === 9) return "bg-error/10 text-error border-error/20";
  if (daysInStage > 7) return "bg-error/10 text-error border-error/20";
  return "bg-surface-container text-on-surface-variant border-outline-variant/30";
};

// ============ Add/Edit Lead Modal ============

interface LeadFormData {
  fullName: string;
  phonePrimary: string;
  phoneSecondary: string;
  email: string;
  dateOfBirth: string;
  state: string;
  coverageType: CoverageType;
  source: Lead["source"];
  assignedAgentId: string;
  score: number;
}

const defaultForm: LeadFormData = {
  fullName: "",
  phonePrimary: "",
  phoneSecondary: "",
  email: "",
  dateOfBirth: "",
  state: "",
  coverageType: "Medicare",
  source: "manual",
  assignedAgentId: "",
  score: 50,
};

function LeadModal({
  initial,
  onSave,
  onClose,
  agents,
}: {
  initial?: Lead;
  onSave: (data: LeadFormData, leadId?: string) => void;
  onClose: () => void;
  agents?: any[];
}) {
  const [form, setForm] = useState<LeadFormData>(
    initial
      ? {
          fullName: initial.fullName,
          phonePrimary: initial.phonePrimary,
          phoneSecondary: initial.phoneSecondary ?? "",
          email: initial.email ?? "",
          dateOfBirth: initial.dateOfBirth ?? "",
          state: initial.state,
          coverageType: initial.coverageType,
          source: initial.source,
          assignedAgentId: initial.assignedAgentId ?? "",
          score: initial.score,
        }
      : defaultForm
  );
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});

  const validate = () => {
    const e: Partial<Record<keyof LeadFormData, string>> = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.phonePrimary.trim()) e.phonePrimary = "Required";
    if (!form.state.trim()) e.state = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form, initial?.id);
    onClose();
  };

  const field = (key: keyof LeadFormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
    className: `bg-surface border ${errors[key] ? "border-error" : "border-outline-variant/30"} px-3 py-2 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary w-full`,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <h2 className="text-lg font-bold text-on-surface">{initial ? "Edit Lead" : "Add New Lead"}</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Full Name *</label>
              <input {...field("fullName")} placeholder="Jane Doe" />
              {errors.fullName && <p className="text-[10px] text-error mt-0.5">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Phone *</label>
              <input {...field("phonePrimary")} placeholder="(555) 000-0000" />
              {errors.phonePrimary && <p className="text-[10px] text-error mt-0.5">{errors.phonePrimary}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Secondary Phone</label>
              <input {...field("phoneSecondary")} placeholder="(555) 000-0000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Email</label>
              <input {...field("email")} type="email" placeholder="jane@example.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Date of Birth</label>
              <input {...field("dateOfBirth")} type="date" />
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">State *</label>
              <input {...field("state")} placeholder="CA" maxLength={2} className="uppercase" />
              {errors.state && <p className="text-[10px] text-error mt-0.5">{errors.state}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Coverage Type</label>
              <select {...field("coverageType")} className="bg-surface border border-outline-variant/30 px-3 py-2 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary w-full">
                <option value="Medicare">Medicare</option>
                <option value="ACA">ACA</option>
                <option value="Final Expense">Final Expense</option>
                <option value="Life">Life</option>
                <option value="Group Health">Group Health</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Source</label>
              <select {...field("source")} className="bg-surface border border-outline-variant/30 px-3 py-2 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary w-full">
                <option value="manual">Manual</option>
                <option value="meta_ads">Meta Ads</option>
                <option value="csv_import">CSV Import</option>
                <option value="referral">Referral</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Assign Agent</label>
              <select
                value={form.assignedAgentId}
                onChange={(e) => setForm((f) => ({ ...f, assignedAgentId: e.target.value }))}
                className="bg-surface border border-outline-variant/30 px-3 py-2 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary w-full"
              >
                <option value="">Unassigned</option>
                {(agents || []).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Lead Score</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={form.score}
                  onChange={(e) => setForm((f) => ({ ...f, score: Number(e.target.value) }))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-bold text-on-surface w-8 text-right">{form.score}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors">
              {initial ? "Save Changes" : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ Bulk Assign Modal ============

function BulkAssignModal({
  count,
  agents,
  onAssign,
  onClose,
}: {
  count: number;
  agents?: any[];
  onAssign: (agentId: string) => void;
  onClose: () => void;
}) {
  const [selectedAgent, setSelectedAgent] = useState("");

  const handleAssign = () => {
    if (selectedAgent) {
      onAssign(selectedAgent);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <h2 className="text-lg font-bold text-on-surface">Bulk Assign</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-on-surface-variant">
            Assign <span className="font-semibold text-on-surface">{count}</span> lead{count !== 1 ? "s" : ""} to:
          </p>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="bg-surface border border-outline-variant/30 px-3 py-2 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary w-full"
          >
            <option value="">Select an agent...</option>
            {(agents || []).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancel
            </button>
            <button onClick={handleAssign} disabled={!selectedAgent} className="flex-1 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Call Modal ============

function CallModal({
  lead,
  onSave,
  onClose,
}: {
  lead: Lead;
  onSave: (outcome: Call["outcome"], duration: number, notes: string) => void;
  onClose: () => void;
}) {
  const [outcome, setOutcome] = useState<Call["outcome"] | "">("");
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState("");

  const outcomes: Array<{ value: Call["outcome"]; label: string; icon: string }> = [
    { value: "contacted", label: "Contacted", icon: "check_circle" },
    { value: "no_answer", label: "No Answer", icon: "phone_disabled" },
    { value: "voicemail", label: "Voicemail", icon: "voicemail" },
    { value: "callback_requested", label: "Callback Requested", icon: "schedule" },
    { value: "not_interested", label: "Not Interested", icon: "thumb_down" },
    { value: "wrong_number", label: "Wrong Number", icon: "backspace" },
    { value: "dead_line", label: "Dead Line", icon: "block" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <h2 className="text-lg font-bold text-on-surface">Log Call</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-surface-container rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
              {lead.fullName.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <div className="text-sm font-semibold text-on-surface">{lead.fullName}</div>
              <div className="text-xs text-on-surface-variant">{lead.phonePrimary}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-2">Call Outcome</label>
            <div className="grid grid-cols-2 gap-2">
              {outcomes.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setOutcome(o.value)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    outcome === o.value
                      ? "border-primary bg-primary-container/20 text-primary"
                      : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{o.icon}</span>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Duration (seconds)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              placeholder="0"
              className="bg-surface border border-outline-variant/30 px-3 py-2 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add call notes..."
              rows={3}
              className="bg-surface border border-outline-variant/30 px-3 py-2 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary w-full resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancel
            </button>
            <button onClick={() => { onSave(outcome as Call["outcome"], duration, notes); onClose(); }} disabled={!outcome} className="flex-1 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              Log Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Delete Confirm Modal ============

function DeleteModal({
  count,
  onConfirm,
  onClose,
}: {
  count: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <h2 className="text-lg font-bold text-on-surface">Confirm Delete</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 bg-error-container/20 rounded-lg p-4">
            <span className="material-symbols-outlined text-error text-2xl">warning</span>
            <p className="text-sm text-on-surface">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{count}</span> lead{count !== 1 ? "s" : ""}? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancel
            </button>
            <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-4 py-2 rounded-lg bg-error text-on-error text-sm font-medium hover:bg-error/90 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ More Menu ============

function MoreMenu({
  lead,
  onEdit,
  onCall,
  onSMS,
  onDelete,
  onClose,
}: {
  lead: Lead;
  onEdit: () => void;
  onCall: () => void;
  onSMS: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-8 z-50 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
        <button onClick={onEdit} className="w-full px-4 py-2.5 text-sm text-left text-on-surface hover:bg-surface-bright transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">edit</span> Edit Lead
        </button>
        <button onClick={onCall} className="w-full px-4 py-2.5 text-sm text-left text-on-surface hover:bg-surface-bright transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">call</span> Log Call
        </button>
        <button onClick={onSMS} className="w-full px-4 py-2.5 text-sm text-left text-on-surface hover:bg-surface-bright transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">sms</span> Send SMS
        </button>
        <div className="border-t border-outline-variant/10"></div>
        <button onClick={onDelete} className="w-full px-4 py-2.5 text-sm text-left text-error hover:bg-error-container/20 transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">delete</span> Delete
        </button>
      </div>
    </>
  );
}

// ============ Main Page ============

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="max-w-[1600px] mx-auto p-6 text-on-surface-variant">Loading...</div>}>
      <LeadsContent />
    </Suspense>
  );
}

function LeadsContent() {
  const session = useAuthStore((s) => s.session);
  const { data: stages = [] } = usePipelineStages();
  const { data: agents = [] } = useAgents();
  const assignLead = useDataStore((s) => s.assignLead);
  const createCall = useDataStore((s) => s.createCall);
  const createConversation = useDataStore((s) => s.createConversation);
  const sendMessage = useDataStore((s) => s.sendMessage);

  const searchParams = useSearchParams();
  const [filter, setFilter] = useState("");
  const [selectedCoverage, setSelectedCoverage] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);

  // TanStack Query for leads from Supabase
  const { data: allLeads = [] } = useLeads({
    stageId: selectedStage || undefined,
    search: filter || undefined,
  });

  // CRUD mutations
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  // Auto-open modal when navigated via ?add=true from dashboard
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setShowAddModal(true);
    }
  }, [searchParams]);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [callLead, setCallLead] = useState<Lead | null>(null);
  const [smsLead, setSmsLead] = useState<Lead | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<{ lead: Lead; ref: HTMLButtonElement | null } | null>(null);

  // Filter by coverage + role client-side (stage/search already via API)
  const myLeads = useMemo(() => {
    return allLeads.filter((l) => {
      if (l.deletedAt) return false;
      if (session?.role === "agent" && l.assignedAgentId !== session?.userId) return false;
      if (selectedCoverage && l.coverageType !== selectedCoverage) return false;
      return true;
    });
  }, [allLeads, session, selectedCoverage]);

  const totalLeads = myLeads.length;
  const hotLeads = myLeads.filter((l) => l.score >= 80).length;
  const totalPages = Math.max(1, Math.ceil(totalLeads / PAGE_SIZE));
  const paginatedLeads = useMemo(
    () => myLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [myLeads, page]
  );

  // Reset page when filters change
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (val: string) => {
    setter(val);
    setPage(1);
  };

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === paginatedLeads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedLeads.map((l) => l.id)));
    }
  }

  function handleSaveLead(data: LeadFormData, leadId?: string) {
    if (leadId) {
      updateLead.mutate({
        id: leadId,
        fullName: data.fullName,
        phonePrimary: data.phonePrimary,
        phoneSecondary: data.phoneSecondary || undefined,
        email: data.email || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        state: data.state,
        coverageType: data.coverageType,
        source: data.source,
        assignedAgentId: data.assignedAgentId || null,
        score: data.score,
      });
    } else {
      createLead.mutate({
        assignedAgentId: data.assignedAgentId || null,
        fullName: data.fullName,
        phonePrimary: data.phonePrimary,
        phoneSecondary: data.phoneSecondary || undefined,
        email: data.email || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        state: data.state,
        coverageType: data.coverageType,
        source: data.source,
        score: data.score,
        exclusivity: "shared",
        outcome: "pending",
        tags: [],
        pipeline: { stageId: "stage-1", enteredStageAt: Date.now() },
      });
    }
  }

  function handleBulkAssign(agentId: string) {
    selected.forEach((id) => assignLead(id, agentId));
    setSelected(new Set());
  }

  function handleBulkDelete() {
    selected.forEach((id) => deleteLead.mutate(id));
    setSelected(new Set());
    setShowDelete(false);
  }

  function handleLogCall(outcome: Call["outcome"], duration: number, notes: string) {
    if (!callLead || !session) return;
    createCall({
      leadId: callLead.id,
      agentId: session.userId,
      direction: "outbound",
      status: "completed",
      outcome,
      duration,
      notes,
      emmaAi: false,
    });
    // Add activity
  }

  function handleSendSMS(content: string) {
    if (!smsLead || !session) return;
    let conv = useDataStore.getState().getConversationByLeadId(smsLead.id);
    if (!conv) {
      conv = createConversation(smsLead.id);
    }
    sendMessage(conv!.id, content, "agent", "sms");
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Modals */}
      {showAddModal && (
        <LeadModal agents={agents} onSave={handleSaveLead} onClose={() => setShowAddModal(false)} />
      )}
      {editLead && (
        <LeadModal agents={agents} initial={editLead} onSave={handleSaveLead} onClose={() => setEditLead(null)} />
      )}
      {showBulkAssign && (
        <BulkAssignModal agents={agents} count={selected.size} onAssign={handleBulkAssign} onClose={() => setShowBulkAssign(false)} />
      )}
      {showDelete && (
        <DeleteModal count={selected.size} onConfirm={handleBulkDelete} onClose={() => setShowDelete(false)} />
      )}
      {callLead && (
        <CallModal lead={callLead} onSave={handleLogCall} onClose={() => setCallLead(null)} />
      )}

      {/* SMS Modal */}
      {smsLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setSmsLead(null)}>
          <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
              <h2 className="text-lg font-bold text-on-surface">Send SMS</h2>
              <button onClick={() => setSmsLead(null)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-surface-container rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
                  {getInitials(smsLead.fullName)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-on-surface">{smsLead.fullName}</div>
                  <div className="text-xs text-on-surface-variant">{smsLead.phonePrimary}</div>
                </div>
              </div>
              <SMSModalForm onSend={handleSendSMS} onClose={() => setSmsLead(null)} />
            </div>
          </div>
        </div>
      )}

      {/* More Menu */}
      {moreAnchor && (
        <MoreMenu
          lead={moreAnchor.lead}
          onEdit={() => { setEditLead(moreAnchor!.lead); setMoreAnchor(null); }}
          onCall={() => { setCallLead(moreAnchor!.lead); setMoreAnchor(null); }}
          onSMS={() => { setSmsLead(moreAnchor!.lead); setMoreAnchor(null); }}
          onDelete={() => { deleteLead.mutate(moreAnchor!.lead.id); setMoreAnchor(null); }}
          onClose={() => setMoreAnchor(null)}
        />
      )}

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
            <h3 className="text-3xl font-bold tracking-tight text-on-surface">
              {myLeads.filter((l) => l.createdAt > Date.now() - 7 * 86400000).length}
            </h3>
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
              <button
                onClick={() => setShowBulkAssign(true)}
                className="text-on-surface hover:text-primary transition-colors flex items-center gap-1 text-xs font-medium"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span> Assign
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="text-on-surface hover:text-error transition-colors flex items-center gap-1 text-xs font-medium"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_2px_8px_rgba(45,91,255,0.3)]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Add Lead
          </button>
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
            onChange={(e) => handleFilterChange(setFilter)(e.target.value)}
            className="bg-surface border border-outline-variant/30 px-3 py-1.5 rounded text-xs text-on-surface focus:outline-none focus:border-primary"
          />
          <select
            value={selectedCoverage}
            onChange={(e) => handleFilterChange(setSelectedCoverage)(e.target.value)}
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
            onChange={(e) => handleFilterChange(setSelectedStage)(e.target.value)}
            className="bg-surface border border-outline-variant/30 px-3 py-1.5 rounded text-xs text-on-surface"
          >
            <option value="">All Stages</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {(filter || selectedCoverage || selectedStage) && (
            <button
              onClick={() => { setFilter(""); setSelectedCoverage(""); setSelectedStage(""); setPage(1); }}
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
                    checked={selected.size === paginatedLeads.length && paginatedLeads.length > 0}
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
              {paginatedLeads.map((lead) => {
                const stage = stages.find((s) => s.id === lead.pipeline.stageId);
                const daysInStage = Math.floor(
                  (Date.now() - lead.pipeline.enteredStageAt) / (1000 * 60 * 60 * 24)
                );
                const agentName = agents.find((a: any) => a.id === lead.assignedAgentId)?.name ?? null;
                const badgeClass = stageBadgeClass(stage?.position ?? 0, daysInStage);
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
                          {getInitials(lead.fullName)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{lead.fullName}</span>
                          <span className="text-[11px] text-on-surface-variant font-mono">{lead.phonePrimary}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${badgeClass}`}>
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
                      {agentName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold">
                            {getInitials(agentName)}
                          </div>
                          <span className="text-xs">{agentName}</span>
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
                        <button
                          onClick={() => setCallLead(lead)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded transition-colors"
                          title="Log Call"
                        >
                          <span className="material-symbols-outlined text-[16px]">call</span>
                        </button>
                        <div className="relative">
                          <button
                            ref={(el) => {
                              if (el && moreAnchor?.lead.id === lead.id) {
                                // already set
                              }
                            }}
                            onClick={(e) => setMoreAnchor({ lead, ref: e.currentTarget as HTMLButtonElement })}
                            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded transition-colors"
                            title="More"
                          >
                            <span className="material-symbols-outlined text-[16px]">more_vert</span>
                          </button>
                        </div>
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
          <span className="text-xs text-on-surface-variant">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalLeads)}–{Math.min(page * PAGE_SIZE, totalLeads)} of {totalLeads}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs text-on-surface-variant hover:text-on-surface px-2 py-1 rounded hover:bg-surface-variant transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) {
                  p = i + 1;
                } else if (page <= 3) {
                  p = i + 1;
                } else if (page >= totalPages - 2) {
                  p = totalPages - 4 + i;
                } else {
                  p = page - 2 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-6 h-6 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                      page === p
                        ? "bg-primary-container text-on-primary-container"
                        : "hover:bg-surface-variant text-on-surface-variant"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs text-on-surface hover:text-primary px-2 py-1 rounded hover:bg-surface-variant transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ SMS Modal Form (inline to avoid extra component file) ============

function SMSModalForm({
  onSend,
  onClose,
}: {
  onSend: (content: string) => void;
  onClose: () => void;
}) {
  const [content, setContent] = useState("");
  const templates = [
    "Hi! Just checking in on your coverage. Ready to discuss options?",
    "Following up on our conversation. Any questions I can help with?",
    "Hi! Your policy is up for renewal soon. Let's review your options.",
  ];
  return (
    <>
      <div className="flex gap-2 mb-2">
        {templates.map((t) => (
          <button
            key={t}
            onClick={() => setContent(t)}
            className="text-[10px] px-2 py-1 rounded bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Use template
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your message..."
        rows={4}
        className="bg-surface border border-outline-variant/30 px-3 py-2 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary w-full resize-none"
      />
      <div className="flex gap-3 pt-3">
        <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
          Cancel
        </button>
        <button onClick={() => { onSend(content); onClose(); }} disabled={!content.trim()} className="flex-1 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
          Send SMS
        </button>
      </div>
    </>
  );
}