"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useDataStore } from "@/lib/stores";
import { useAuthStore } from "@/lib/stores";
import { useState, useMemo } from "react";
import Link from "next/link";

export default function InboxPage() {
  const session = useAuthStore((s) => s.session);
  const leads = useDataStore((s) => s.leads);
  const conversations = useDataStore((s) => s.conversations);
  const messages = useDataStore((s) => s.messages);
  const sendMessage = useDataStore((s) => s.sendMessage);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyChannel, setReplyChannel] = useState<"sms" | "email">("sms");

  const myLeads = leads.filter((l) => {
    if (l.deletedAt) return false;
    if (l.workspaceId !== session?.workspaceId) return false;
    if (session?.role === "agent" && l.assignedAgentId !== session?.userId) return false;
    return true;
  });

  const leadMap = useMemo(() => {
    const map = new Map<string, typeof leads[0]>();
    myLeads.forEach((l) => map.set(l.id, l));
    return map;
  }, [myLeads]);

  const convsWithLeads = useMemo(() => {
    return conversations
      .filter((c) => leadMap.has(c.leadId))
      .map((c) => ({ ...c, lead: leadMap.get(c.leadId)! }))
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }, [conversations, leadMap]);

  const selectedConv = convsWithLeads.find((c) => c.id === selectedConvId) || convsWithLeads[0];
  const selectedLead = selectedConv?.lead;

  const convMessages = useMemo(() => {
    if (!selectedConv) return [];
    return messages
      .filter((m) => m.conversationId === selectedConv.id)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [selectedConv, messages]);

  const activeConvs = convsWithLeads.filter((c) => c.status === "active");

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleSend = () => {
    if (!replyText.trim() || !selectedConv || !session) return;
    sendMessage(selectedConv.id, replyText.trim(), "agent", replyChannel);
    setReplyText("");
  };

  const formatTime = (ts: number) => {
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
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Active Threads</span>
              <span className="bg-surface-variant text-on-surface-variant text-[10px] px-1.5 py-0.5 rounded">{activeConvs.length}</span>
            </div>
            <button className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {convsWithLeads.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <span className="material-symbols-outlined text-4xl text-outline mb-3">chat</span>
                <p className="text-sm text-on-surface-variant">No conversations yet</p>
                <p className="text-xs text-on-surface-variant mt-1">Start a conversation from a lead profile</p>
              </div>
            )}
            {convsWithLeads.map((conv) => {
              const convMsgs = messages.filter((m) => m.conversationId === conv.id).sort((a, b) => b.createdAt - a.createdAt);
              const lastMsg = convMsgs[convMsgs.length - 1];
              const isSelected = selectedConv?.id === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-4 border-b border-outline-variant/10 cursor-pointer relative group transition-colors ${
                    isSelected ? "bg-surface bg-primary-container/5" : "hover:bg-surface-container-lowest/50"
                  }`}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-container"></div>}
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-semibold text-sm truncate pr-2 ${isSelected ? "text-on-surface" : "text-on-surface-variant group-hover:text-on-surface"}`}>
                      {conv.lead.fullName}
                    </h4>
                    <span className="text-xs text-on-surface-variant whitespace-nowrap">{lastMsg ? formatTime(lastMsg.createdAt) : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="bg-secondary-container/30 text-secondary-fixed text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">sms</span> SMS
                    </span>
                    {conv.aiActive && (
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
                  <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-md transition-colors" title="Call">
                    <span className="material-symbols-outlined">call</span>
                  </button>
                  <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-md transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface-container-lowest/50 via-surface to-surface">
                {convMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${msg.direction === "outbound" ? "items-end self-end max-w-[80%]" : "items-start max-w-[80%]"}`}
                  >
                    <div className="flex items-center gap-2 ml-1 mb-1">
                      {msg.direction === "outbound" ? (
                        <>
                          <span className="text-[10px] text-on-surface-variant/50">{formatTime(msg.createdAt)}</span>
                          <span className="text-xs font-medium text-primary">{msg.senderType === "agent" ? "You" : "Emma AI"}</span>
                          <span className="material-symbols-outlined text-[14px] text-primary">{msg.channel === "sms" ? "sms" : "mail"}</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[14px] text-tertiary" style={{ display: msg.senderType === "ai" ? "inline" : "none" }}>auto_awesome</span>
                          <span className={`text-xs font-medium ${msg.senderType === "ai" ? "text-tertiary" : "text-on-surface-variant"}`}>
                            {msg.senderType === "ai" ? "Emma AI (SMS)" : selectedLead.fullName}
                          </span>
                          <span className="text-[10px] text-on-surface-variant/50">{formatTime(msg.createdAt)}</span>
                        </>
                      )}
                    </div>

                    {msg.direction === "outbound" ? (
                      <div className="bg-primary-container text-on-primary-container p-3.5 rounded-2xl rounded-tr-sm text-sm shadow-[0_4px_20px_-4px_rgba(45,91,255,0.2)] border border-primary-container/50">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : (
                      <div className={`bg-surface-container-high border ${msg.senderType === "ai" ? "border-tertiary/20" : "border-outline-variant/10"} text-sm`}>
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
                        className="bg-primary-container text-on-primary-container hover:bg-primary-container/90 px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-[0_4px_14px_rgba(45,91,255,0.25)] flex items-center gap-2"
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
                {selectedLead.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded text-[10px] font-medium bg-tertiary-container/20 text-tertiary border border-tertiary/20">
                    {tag}
                  </span>
                ))}
                {selectedLead.tags.length === 0 && (
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
    </SubPageLayout>
  );
}
