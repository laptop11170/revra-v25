"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useAuthStore } from "@/lib/stores";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { CallOutcome } from "@/types";
import { useLeads } from "@/hooks/useLeads";
import { useCalls, useLogCall } from "@/hooks/useCalls";
import { useQueryClient } from "@tanstack/react-query";

function getToken() {
  if (typeof window === "undefined") return "";
  const match = document.cookie.match(/sb-access-token=([^;]+)/);
  return match ? match[1] : "";
}

export default function DialerPage() {
  const session = useAuthStore((s) => s.session);
  const { data: leads = [] } = useLeads();
  const { data: calls = [] } = useCalls();
  const logCall = useLogCall();
  const qc = useQueryClient();

  const [emmaQueue, setEmmaQueue] = useState<Array<{ leadId: string; campaignId: string; status: string }>>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const myLeads = useMemo(() => leads.filter((l: any) => {
    if (l.deleted_at) return false;
    if (l.workspace_id !== session?.workspaceId) return false;
    if (session?.role === "agent" && l.assigned_agent_id !== session?.userId) return false;
    return true;
  }), [leads, session]);

  const queueLeads = useMemo(() => {
    return myLeads
      .filter((l: any) => l.outcome === "pending")
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 20);
  }, [myLeads]);

  const hotCount = queueLeads.filter((l: any) => l.score >= 80).length;
  const warmCount = queueLeads.filter((l: any) => l.score >= 60 && l.score < 80).length;
  const todayCalls = useMemo(() => calls.filter((c: any) => {
    if (c.agent_id !== session?.userId) return false;
    const today = new Date().setHours(0, 0, 0, 0);
    const callMs = new Date(c.created_at).getTime();
    return callMs >= today;
  }), [calls, session]);

  const avgTalkTime = useMemo(() => {
    const completed = todayCalls.filter((c: any) => c.duration);
    if (completed.length === 0) return "0m 0s";
    const total = completed.reduce((sum: number, c: any) => sum + (c.duration || 0), 0);
    const avg = Math.floor(total / completed.length);
    const mins = Math.floor(avg / 60);
    const secs = avg % 60;
    return `${mins}m ${secs}s`;
  }, [todayCalls]);

  const [dialerRunning, setDialerRunning] = useState(false);
  const [currentLeadIdx, setCurrentLeadIdx] = useState(0);
  const [showPostCallModal, setShowPostCallModal] = useState(false);
  const [postCallLead, setPostCallLead] = useState<string | null>(null);
  const [callOutcome, setCallOutcome] = useState<CallOutcome | "">("");
  const [callDuration, setCallDuration] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [skippedLeads, setSkippedLeads] = useState<Set<string>>(new Set());

  const handleStartDialer = () => {
    if (queueLeads.length === 0) return;
    setDialerRunning(true);
    setCurrentLeadIdx(0);
  };

  const handleStopDialer = () => {
    setDialerRunning(false);
  };

  const handleAddToEmma = (leadId: string) => {
    const alreadyQueued = emmaQueue.some((q) => q.leadId === leadId);
    if (alreadyQueued) return;
    setEmmaQueue((prev) => [...prev, { leadId, campaignId: "", status: "queued" }]);
  };

  const handleSkip = (leadId: string) => {
    setSkippedLeads((prev) => new Set([...prev, leadId]));
    const nextIdx = currentLeadIdx + 1;
    if (nextIdx < queueLeads.length) {
      setCurrentLeadIdx(nextIdx);
    } else {
      setDialerRunning(false);
    }
  };

  const handleOpenPostCall = (leadId: string) => {
    setPostCallLead(leadId);
    setAiSummary("");
    setShowPostCallModal(true);
  };

  const handleLogPostCall = () => {
    if (!postCallLead || !callOutcome || !session) return;
    const duration = parseInt(callDuration) * 60 || 0;
    const combinedNotes = aiSummary ? `${callNotes}\n\n[AI Summary]\n${aiSummary}`.trim() : callNotes;
    logCall.mutate({
      leadId: postCallLead,
      direction: "outbound",
      status: "completed",
      outcome: callOutcome as CallOutcome,
      duration,
      notes: combinedNotes,
      emmaAi: false,
    });
    setShowPostCallModal(false);
    setPostCallLead(null);
    setCallOutcome("");
    setCallDuration("");
    setCallNotes("");
    const nextIdx = currentLeadIdx + 1;
    if (nextIdx < queueLeads.length) {
      setCurrentLeadIdx(nextIdx);
    } else {
      setDialerRunning(false);
    }
  };

  const activeQueueLeads = useMemo(
    () => queueLeads.filter((l: any) => !skippedLeads.has(l.id)),
    [queueLeads, skippedLeads]
  );

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
          {dialerRunning ? (
            <button onClick={handleStopDialer} className="bg-gradient-to-r from-error to-red-700 text-white px-8 py-3 rounded font-bold tracking-wide flex items-center gap-3 hover:opacity-90 transition-opacity shadow-lg shadow-error/20">
              <span className="material-symbols-outlined icon-fill">stop</span>
              STOP DIALER
            </button>
          ) : (
            <button onClick={handleStartDialer} disabled={activeQueueLeads.length === 0} className="bg-gradient-to-r from-primary to-primary-container text-on-primary-container px-8 py-3 rounded font-bold tracking-wide flex items-center gap-3 hover:opacity-90 transition-opacity shadow-lg shadow-primary-container/20 disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="material-symbols-outlined icon-fill">play_arrow</span>
              START AUTO-DIAL
            </button>
          )}
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
                {activeQueueLeads.map((lead: any) => {
                  const priority = getPriority(lead.score);
                  const isEmmaQueued = emmaQueue.some((q) => q.leadId === lead.id);
                  return (
                    <tr key={lead.id} className="border-b border-outline-variant/10 hover:bg-surface-bright/30 transition-colors group">
                      <td className="px-6 py-4 text-center">
                        {priority === "hot" && <span className="material-symbols-outlined text-error icon-fill">local_fire_department</span>}
                        {priority === "warm" && <span className="w-2 h-2 rounded-full bg-tertiary inline-block"></span>}
                        {priority === "cool" && <span className="w-2 h-2 rounded-full bg-outline-variant inline-block"></span>}
                      </td>
                      <td className="px-6 py-4 font-medium text-on-surface">
                        <Link href={`/leads/${lead.id}`} className="hover:text-primary transition-colors">
                          {lead.full_name}
                        </Link>
                        <span className="text-xs text-on-surface-variant block font-normal">{lead.phone_primary}</span>
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
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary-container/50 text-secondary">{lead.coverage_type}</span>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant capitalize">{(lead.source || "").replace("_", " ")}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleAddToEmma(lead.id)}
                            disabled={isEmmaQueued}
                            className={`p-1.5 rounded transition-colors ${isEmmaQueued ? "bg-tertiary-container text-on-tertiary-container cursor-not-allowed opacity-60" : "bg-surface-container hover:bg-tertiary-container hover:text-on-tertiary-container text-on-surface-variant"}`}
                            title={isEmmaQueued ? "Already in Emma Queue" : "Add to Emma AI"}
                          >
                            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                          </button>
                          <button
                            onClick={() => handleSkip(lead.id)}
                            className="p-1.5 rounded bg-surface-container hover:bg-surface-container-highest text-on-surface-variant transition-colors"
                            title="Skip"
                          >
                            <span className="material-symbols-outlined text-[18px]">skip_next</span>
                          </button>
                          <button
                            onClick={() => handleOpenPostCall(lead.id)}
                            className="p-1.5 rounded bg-primary-container text-on-primary-container hover:bg-primary transition-colors"
                            title="Log Call"
                          >
                            <span className="material-symbols-outlined text-[18px]">call</span>
                          </button>
                          <Link href={`/leads/${lead.id}`}>
                            <button className="p-1.5 rounded bg-surface-container text-on-surface-variant hover:bg-surface-container-highest transition-colors" title="View Lead">
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
            Showing {activeQueueLeads.length} of {queueLeads.length} queued leads.
          </div>
        </div>
      </div>

      {/* Post-Call Outcome Modal */}
      {showPostCallModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setShowPostCallModal(false)}>
          <div className="bg-surface-container-highest rounded-2xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface">Log Call Outcome</h3>
              <button onClick={() => setShowPostCallModal(false)} className="p-1 rounded hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {aiSummary && (
              <div className="mb-4 bg-tertiary-container/10 border border-tertiary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-tertiary icon-fill">auto_awesome</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-tertiary">AI Call Summary</span>
                </div>
                <p className="text-sm text-on-surface whitespace-pre-wrap">{aiSummary}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Call Outcome</label>
                <select value={callOutcome} onChange={(e) => setCallOutcome(e.target.value as CallOutcome)} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary">
                  <option value="">Select outcome...</option>
                  <option value="contacted">Contacted</option>
                  <option value="no_answer">No Answer</option>
                  <option value="voicemail">Voicemail</option>
                  <option value="callback_requested">Callback Requested</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="wrong_number">Wrong Number</option>
                  <option value="dead_line">Dead Line</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Duration (minutes)</label>
                <input type="number" value={callDuration} onChange={(e) => setCallDuration(e.target.value)} placeholder="e.g. 5" min="0" className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Notes</label>
                <textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} placeholder="Call notes, key takeaways..." rows={3} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              {postCallLead && (
                <button
                  onClick={async () => {
                    if (isGeneratingSummary) return;
                    setIsGeneratingSummary(true);
                    try {
                      const res = await fetch("/api/ai/post-call-summary", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                        credentials: "include",
                        body: JSON.stringify({ leadId: postCallLead }),
                      });
                      if (res.ok) {
                        const { data } = await res.json();
                        setAiSummary(data.summary || data.briefing || "");
                      }
                    } catch {}
                    setIsGeneratingSummary(false);
                  }}
                  disabled={isGeneratingSummary}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-tertiary-container text-tertiary text-sm font-medium hover:bg-tertiary-container/90 transition-colors disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isGeneratingSummary ? "animate-spin" : "icon-fill"}`}>auto_awesome</span>
                  {isGeneratingSummary ? "Generating..." : aiSummary ? "Regenerate" : "AI Summary"}
                </button>
              )}
              <button onClick={() => handleSkip(postCallLead!)} className="flex-1 py-2.5 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">Skip</button>
              <button onClick={handleLogPostCall} disabled={!callOutcome} className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold hover:bg-primary-container/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Save Outcome</button>
            </div>
          </div>
        </div>
      )}
    </SubPageLayout>
  );
}
