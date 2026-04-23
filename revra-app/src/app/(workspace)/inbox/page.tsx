"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useAuthStore } from "@/lib/stores";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLeads } from "@/hooks/useLeads";
import { useConversations, useMessages, useSendMessage } from "@/hooks/useConversations";
import { useLogCall } from "@/hooks/useCalls";
import type { CallOutcome } from "@/types";

export default function InboxPage() {
  const session = useAuthStore((s) => s.session);
  const { data: allLeads = [] } = useLeads();
  const { data: conversations = [] } = useConversations();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyChannel, setReplyChannel] = useState<"sms" | "email">("sms");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused" | "ai_active">("all");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callOutcome, setCallOutcome] = useState<CallOutcome | "">("");
  const [callDuration, setCallDuration] = useState("");
  const [callNotes, setCallNotes] = useState("");

  const router = useRouter();
  const sendMessage = useSendMessage();
  const logCall = useLogCall();

  // Build lead map for sidebar info
  const leadMap = useMemo(() => {
    const map = new Map<string, any>();
    allLeads.forEach((l: any) => map.set(l.id, l));
    return map;
  }, [allLeads]);

  // Conversations with lead attached (via join)
  const convsWithLead = useMemo(() => {
    return conversations.map((c: any) => ({
      ...c,
      lead: c.lead_id ? leadMap.get(c.lead_id) : null,
    })).filter((c: any) => c.lead != null);
  }, [conversations, leadMap]);

  const filteredConvs = useMemo(() => {
    return convsWithLead.filter((c: any) => {
      if (filterStatus === "active") return c.status === "active";
      if (filterStatus === "paused") return c.status === "paused";
      if (filterStatus === "ai_active") return c.ai_active;
      return true;
    });
  }, [convsWithLead, filterStatus]);

  const selectedConv = filteredConvs.find((c: any) => c.id === selectedConvId) || filteredConvs[0];
  const selectedLead = selectedConv?.lead;

  const { data: messages = [] } = useMessages(selectedConv?.id || null);

  // Sort messages by time
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a: any, b: any) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return aTime - bTime;
    });
  }, [messages]);

  // Messages for sidebar thread list (last message preview)
  const messagesByConv = useMemo(() => {
    const map = new Map<string, any[]>();
    messages.forEach((m: any) => {
      if (!map.has(m.conversation_id)) map.set(m.conversation_id, []);
      map.get(m.conversation_id)!.push(m);
    });
    return map;
  }, [messages]);

  const handleCallLog = () => {
    if (!selectedLead || !session) return;
    const duration = parseInt(callDuration) * 60 || 0;
    logCall.mutate({
      leadId: selectedLead.id,
      direction: "outbound",
      status: "completed",
      outcome: callOutcome as string,
      duration,
      notes: callNotes,
      emmaAi: false,
    });
    setShowCallModal(false);
    setCallOutcome("");
    setCallDuration("");
    setCallNotes("");
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleSend = () => {
    if (!replyText.trim() || !selectedConv || !session) return;
    sendMessage.mutate({
      conversationId: selectedConv.id,
      content: replyText.trim(),
      senderType: 'agent',
      channel: replyChannel,
      direction: 'outbound',
    });
    setReplyText("");
  };

  const handleSelectConv = (convId: string) => {
    setSelectedConvId(convId);
    setShowMoreMenu(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <SubPageLayout>
      <div className="h-[calc(100vh-8rem)] flex bg-surface">
        <aside className="w-80 flex-shrink-0 border-r border-outline-variant/15 flex flex-col bg-surface-container-low h-full">
          <div className="p-3 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-lowest/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                {filterStatus === "all" ? "All Threads" : filterStatus === "active" ? "Active" : filterStatus === "paused" ? "Paused" : "AI Active"}
              </span>
              <span className="bg-surface-variant text-on-surface-variant text-[10px] px-1.5 py-0.5 rounded">{filteredConvs.length}</span>
            </div>
            <div className="relative">
              <button onClick={() => setShowFilterMenu(!showFilterMenu)} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-container-high">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-1 bg-surface-container-highest border border-outline-variant/30 rounded-lg shadow-xl py-1 z-50 min-w-[140px]">
                  <button onClick={() => { setFilterStatus("all"); setShowFilterMenu(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-container ${filterStatus === "all" ? "text-primary font-semibold" : "text-on-surface"}`}>All Threads</button>
                  <button onClick={() => { setFilterStatus("active"); setShowFilterMenu(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-container ${filterStatus === "active" ? "text-primary font-semibold" : "text-on-surface"}`}>Active</button>
                  <button onClick={() => { setFilterStatus("paused"); setShowFilterMenu(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-container ${filterStatus === "paused" ? "text-primary font-semibold" : "text-on-surface"}`}>Paused</button>
                  <button onClick={() => { setFilterStatus("ai_active"); setShowFilterMenu(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-container ${filterStatus === "ai_active" ? "text-primary font-semibold" : "text-on-surface"}`}>AI Active</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {filteredConvs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <span className="material-symbols-outlined text-4xl text-outline mb-3">chat</span>
                <p className="text-sm text-on-surface-variant">No conversations yet</p>
                <p className="text-xs text-on-surface-variant mt-1">Start a conversation from a lead profile</p>
              </div>
            )}
            {filteredConvs.map((conv: any) => {
              const convMsgs = messagesByConv.get(conv.id) || [];
              const sortedMsgs = [...convMsgs].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              const lastMsg = sortedMsgs[0];
              const isSelected = selectedConv?.id === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  className={`p-4 border-b border-outline-variant/10 cursor-pointer relative group transition-colors ${
                    isSelected ? "bg-surface bg-primary-container/5" : "hover:bg-surface-container-lowest/50"
                  }`}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-container"></div>}
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-semibold text-sm truncate pr-2 ${isSelected ? "text-on-surface" : "text-on-surface-variant group-hover:text-on-surface"}`}>
                      {conv.lead?.fullName || "Unknown Lead"}
                    </h4>
                    <span className="text-xs text-on-surface-variant whitespace-nowrap">{lastMsg ? formatTime(lastMsg.created_at) : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="bg-secondary-container/30 text-secondary-fixed text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">sms</span> SMS
                    </span>
                    {conv.ai_active && (
                      <span className="bg-surface-variant text-tertiary border border-tertiary/30 text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] icon-fill">auto_awesome</span> Emma
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">{lastMsg?.content || "No messages yet"}</p>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="flex-1 flex flex-col h-full bg-surface relative z-10">
          {selectedLead ? (
            <>
              <div className="h-16 px-6 border-b border-outline-variant/15 flex items-center justify-between bg-surface/95 backdrop-blur z-20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container/20 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-lg">
                    {getInitials(selectedLead.fullName)}
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-base flex items-center gap-2">
                      {selectedLead.fullName}
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                        Score: {selectedLead.score}
                      </span>
                    </h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">phone_iphone</span> {selectedLead.phonePrimary}
                      </span>
                      {selectedLead.email && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">mail</span> {selectedLead.email}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/leads/${selectedLead.id}`}>
                    <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-md transition-colors" title="View Lead">
                      <span className="material-symbols-outlined">open_in_new</span>
                    </button>
                  </Link>
                  <button onClick={() => router.push(`/dialer?lead=${selectedLead.id}`)} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-md transition-colors" title="Call">
                    <span className="material-symbols-outlined">call</span>
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-md transition-colors">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {showMoreMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-surface-container-highest border border-outline-variant/30 rounded-lg shadow-xl py-1 z-50 min-w-[160px]">
                        <button onClick={() => { router.push(`/leads/${selectedLead.id}`); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">person</span> View Lead Profile</button>
                        <button onClick={() => { router.push(`/dialer?lead=${selectedLead.id}`); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">call</span> Call Lead</button>
                        <button onClick={() => { setShowCallModal(true); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">phone_callback</span> Log a Call</button>
                        <hr className="my-1 border-outline-variant/20" />
                        <button onClick={() => { setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-error hover:bg-surface-container flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">pause</span> Pause AI</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface-container-lowest/50 via-surface to-surface">
                {sortedMessages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-on-surface-variant">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-4xl text-outline mb-3">chat_bubble</span>
                      <p className="text-sm">No messages yet</p>
                    </div>
                  </div>
                )}
                {sortedMessages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${msg.direction === "outbound" ? "items-end self-end max-w-[80%]" : "items-start max-w-[80%]"}`}
                  >
                    <div className="flex items-center gap-2 ml-1 mb-1">
                      {msg.direction === "outbound" ? (
                        <>
                          <span className="text-[10px] text-on-surface-variant/50">{formatTime(msg.created_at)}</span>
                          <span className="text-xs font-medium text-primary">{msg.sender_type === "agent" ? "You" : "Emma AI"}</span>
                          <span className="material-symbols-outlined text-[14px] text-primary">{msg.channel === "sms" ? "sms" : "mail"}</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[14px] text-tertiary" style={{ display: msg.sender_type === "ai" ? "inline" : "none" }}>auto_awesome</span>
                          <span className={`text-xs font-medium ${msg.sender_type === "ai" ? "text-tertiary" : "text-on-surface-variant"}`}>
                            {msg.sender_type === "ai" ? "Emma AI (SMS)" : selectedLead.fullName}
                          </span>
                          <span className="text-[10px] text-on-surface-variant/50">{formatTime(msg.created_at)}</span>
                        </>
                      )}
                    </div>

                    {msg.direction === "outbound" ? (
                      <div className="bg-primary-container text-on-primary-container p-3.5 rounded-2xl rounded-tr-sm text-sm shadow-[0_4px_20px_-4px_rgba(45,91,255,0.2)] border border-primary-container/50">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : (
                      <div className={`bg-surface-container-high border ${msg.sender_type === "ai" ? "border-tertiary/20" : "border-outline-variant/10"} text-sm`}>
                        <p className="p-3.5 rounded-2xl rounded-tl-sm">{msg.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-surface-container-low border-t border-outline-variant/15 z-20">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant">Replying via:</span>
                    <div className="bg-surface-variant rounded-md p-0.5 flex">
                      <button
                        onClick={() => setReplyChannel("sms")}
                        className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${replyChannel === "sms" ? "bg-surface-container-highest text-on-surface rounded shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">sms</span> SMS
                      </button>
                      <button
                        onClick={() => setReplyChannel("email")}
                        className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${replyChannel === "email" ? "bg-surface-container-highest text-on-surface rounded shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">mail</span> Email
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!selectedLead || !replyText.trim()) return;
                      try {
                        const res = await fetch('/api/ai/sms-draft', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ leadId: selectedLead.id }),
                        });
                        if (res.ok) {
                          const { data } = await res.json();
                          if (data.draft) setReplyText(data.draft);
                        }
                      } catch {}
                    }}
                    className="text-xs text-tertiary-container hover:text-tertiary-container/80 font-medium flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span> AI Draft
                  </button>
                </div>

                <div className="relative bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-inner focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                  <textarea
                    className="w-full bg-transparent text-on-surface placeholder:text-on-surface-variant/40 p-4 pb-12 resize-none h-28 focus:outline-none text-sm"
                    placeholder="Type your message..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  ></textarea>
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-md transition-colors">
                        <span className="material-symbols-outlined text-[18px]">attach_file</span>
                      </button>
                      <button className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-md transition-colors">
                        <span className="material-symbols-outlined text-[18px]">sentiment_satisfied</span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSend}
                        disabled={sendMessage.isPending || !replyText.trim()}
                        className="bg-primary-container text-on-primary-container hover:bg-primary-container/90 px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-[0_4px_14px_rgba(45,91,255,0.25)] flex items-center gap-2 disabled:opacity-50"
                      >
                        Send
                        <span className="material-symbols-outlined text-[16px]">send</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl text-outline mb-4">chat</span>
                <p className="text-on-surface-variant font-medium">No conversation selected</p>
                <p className="text-xs text-on-surface-variant mt-1">Select a thread from the left to view messages</p>
              </div>
            </div>
          )}
        </section>

        {selectedLead && (
          <aside className="w-72 hidden xl:flex flex-col border-l border-outline-variant/15 bg-surface-container/30 backdrop-blur-md h-full z-10 overflow-y-auto">
            <div className="p-5 border-b border-outline-variant/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-container to-surface-container flex items-center justify-center text-secondary text-xl font-bold shadow-inner">
                  {getInitials(selectedLead.fullName)}
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-lg">{selectedLead.fullName}</h3>
                  <p className="text-xs text-on-surface-variant font-medium">{selectedLead.coverageType}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">psychology</span> Lead Score
                  </span>
                  <span className="font-semibold text-on-surface">{selectedLead.score}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">location_on</span> State
                  </span>
                  <span className="font-medium text-on-surface">{selectedLead.state}</span>
                </div>
                {selectedLead.currentCarrier && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">shield</span> Current Carrier
                    </span>
                    <span className="font-medium text-on-surface">{selectedLead.currentCarrier}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-b border-outline-variant/10">
              <h4 className="text-xs font-bold text-tertiary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] icon-fill">psychology</span>
                Lead Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {(selectedLead.tags || []).map((tag: string) => (
                  <span key={tag} className="px-2 py-1 rounded text-[10px] font-medium bg-tertiary-container/20 text-tertiary border border-tertiary/20">
                    {tag}
                  </span>
                ))}
                {(!selectedLead.tags || selectedLead.tags.length === 0) && (
                  <span className="text-xs text-on-surface-variant">No tags</span>
                )}
              </div>
            </div>

            <div className="p-5">
              <Link href={`/leads/${selectedLead.id}`}>
                <button className="w-full py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-semibold hover:bg-primary-container/90 transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  View Full Profile
                </button>
              </Link>
            </div>
          </aside>
        )}
      </div>

      {/* Call Modal */}
      {showCallModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setShowCallModal(false)}>
          <div className="bg-surface-container-highest rounded-2xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface">Log a Call</h3>
              <button onClick={() => setShowCallModal(false)} className="p-1 rounded hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mb-4 p-3 bg-surface-container rounded-lg">
              <p className="text-sm font-semibold text-on-surface">{selectedLead.fullName}</p>
              <p className="text-xs text-on-surface-variant">{selectedLead.phonePrimary}</p>
            </div>
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
                <textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} placeholder="Call notes..." rows={3} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCallModal(false)} className="flex-1 py-2.5 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleCallLog} disabled={!callOutcome || logCall.isPending} className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold hover:bg-primary-container/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Log Call</button>
            </div>
          </div>
        </div>
      )}
    </SubPageLayout>
  );
}