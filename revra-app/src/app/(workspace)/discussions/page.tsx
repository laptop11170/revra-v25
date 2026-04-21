"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useDataStore, useAuthStore } from "@/lib/stores";
import { useState, useMemo } from "react";

export default function DiscussionsPage() {
  const session = useAuthStore((s) => s.session);
  const channels = useDataStore((s) => s.channels);
  const channelMessages = useDataStore((s) => s.channelMessages);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  const workspaceChannels = channels.filter(
    (c) => c.workspaceId === session?.workspaceId && c.type === "channel"
  );
  const workspaceDMs = channels.filter(
    (c) => c.workspaceId === session?.workspaceId && c.type === "dm"
  );

  const selectedChannel = workspaceChannels.find((c) => c.id === selectedChannelId) || workspaceChannels[0];

  const msgs = useMemo(() => {
    if (!selectedChannel) return [];
    return channelMessages
      .filter((m) => m.channelId === selectedChannel.id)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [selectedChannel, channelMessages]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <SubPageLayout>
      <div className="flex h-full">
        <aside className="w-64 bg-surface-container-low border-r border-outline-variant/15 flex flex-col h-full overflow-y-auto shrink-0">
          <div className="p-4 flex items-center justify-between border-b border-outline-variant/10">
            <h2 className="text-sm font-bold tracking-tight text-on-surface">Discussions</h2>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">edit_square</span>
            </button>
          </div>

          <div className="py-4">
            <div className="px-4 flex items-center justify-between mb-2 group cursor-pointer">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Channels</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">add</span>
            </div>
            <ul className="space-y-0.5">
              {workspaceChannels.map((channel) => (
                <li key={channel.id}>
                  <button
                    onClick={() => setSelectedChannelId(channel.id)}
                    className={`w-full flex items-center px-4 py-1.5 text-sm hover:bg-surface-container hover:text-on-surface transition-colors ${
                      selectedChannel?.id === channel.id ? "text-primary font-medium bg-surface-container-highest/50 border-l-2 border-primary" : "text-on-surface-variant"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[18px] mr-2 ${selectedChannel?.id === channel.id ? "text-primary" : "text-outline"}`}>tag</span>
                    {channel.name}
                    {channel.unreadCount > 0 && (
                      <span className="bg-error/20 text-error text-[10px] font-bold px-1.5 rounded-full ml-auto">{channel.unreadCount}</span>
                    )}
                  </button>
                </li>
              ))}
              {workspaceChannels.length === 0 && (
                <li className="px-4 py-2 text-xs text-on-surface-variant">No channels yet</li>
              )}
            </ul>
          </div>

          <div className="py-2">
            <div className="px-4 flex items-center justify-between mb-2 group cursor-pointer">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Direct Messages</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">add</span>
            </div>
            <ul className="space-y-0.5">
              {workspaceDMs.map((dm) => {
                const otherUserId = dm.participants?.find((p) => p !== session?.userId);
                return (
                  <li key={dm.id}>
                    <button className="w-full flex items-center px-4 py-1.5 text-sm hover:bg-surface-container hover:text-on-surface transition-colors">
                      <div className="flex items-center">
                        <div className="relative mr-2">
                          <div className="w-5 h-5 rounded-md bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">
                            {otherUserId ? getInitials(otherUserId) : "?"}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-surface-container-low"></div>
                        </div>
                        {dm.name}
                      </div>
                      {dm.unreadCount > 0 && (
                        <span className="bg-primary/20 text-primary text-[10px] font-bold px-1.5 rounded-full ml-auto">{dm.unreadCount}</span>
                      )}
                    </button>
                  </li>
                );
              })}
              {workspaceDMs.length === 0 && (
                <li className="px-4 py-2 text-xs text-on-surface-variant">No direct messages</li>
              )}
            </ul>
          </div>

          <div className="mt-auto p-4 m-4 bg-surface-container rounded-lg border border-tertiary/10 relative overflow-hidden group cursor-pointer hover:bg-surface-container-highest transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tertiary to-tertiary-container opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5 icon-fill">auto_awesome</span>
              <div>
                <span className="text-xs font-semibold text-tertiary uppercase tracking-wider block mb-1"> Pulse Insight</span>
                <p className="text-[11px] text-on-surface-variant leading-tight">
                  New leads have arrived. Check the pipeline for hot prospects.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 flex flex-col h-full relative bg-surface">
          {selectedChannel ? (
            <>
              <div className="h-14 border-b border-outline-variant/10 flex items-center justify-between px-6 bg-surface/80 backdrop-blur-md z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline text-[22px]">tag</span>
                  <div>
                    <h1 className="text-base font-semibold text-on-surface leading-none">{selectedChannel.name}</h1>
                    <div className="flex items-center text-xs text-on-surface-variant mt-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">group</span> {selectedChannel.participants?.length || 0} members
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                  </button>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                <div className="flex items-center justify-center relative my-2">
                  <div className="absolute w-full h-px bg-outline-variant/20"></div>
                  <span className="bg-surface px-3 text-xs font-medium text-on-surface-variant relative z-10">{formatDate(Date.now())}</span>
                </div>

                {msgs.map((msg) => (
                  <div key={msg.id} className="flex gap-4 group relative">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-sm font-bold text-on-surface mt-1 shrink-0">
                      {getInitials(msg.authorId)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-sm text-on-surface">{msg.authorId}</span>
                        <span className="text-xs text-on-surface-variant">{formatTime(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                            <button key={emoji} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant/30 text-xs text-on-surface hover:bg-surface-container-high transition-colors">
                              <span>{emoji}</span>
                              <span className="text-on-surface-variant">{userIds.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {msgs.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-5xl text-outline mb-4">chat_bubble_outline</span>
                      <p className="text-on-surface-variant font-medium">No messages yet</p>
                      <p className="text-xs text-on-surface-variant mt-1">Be the first to send a message</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-surface shrink-0">
                <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl flex flex-col focus-within:border-primary/50 focus-within:bg-surface-container transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                  <textarea
                    className="w-full bg-transparent border-none text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-0 resize-none py-3 px-4 max-h-32 min-h-[44px]"
                    placeholder={`Message #${selectedChannel.name}...`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={1}
                  ></textarea>
                  <div className="flex items-center justify-between px-2 pb-2 pt-1">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                        <span className="material-symbols-outlined text-[20px]">add_link</span>
                      </button>
                      <button className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                        <span className="material-symbols-outlined text-[20px]">format_bold</span>
                      </button>
                      <button className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                        <span className="material-symbols-outlined text-[20px]">mood</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-highest transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">mic</span>
                      </button>
                      <button className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-colors">
                        <span className="material-symbols-outlined text-[18px] icon-fill">send</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-center text-on-surface-variant/60 mt-2 font-medium tracking-wide">
                  <span className="font-bold">Return</span> to send <span className="mx-1">•</span> <span className="font-bold">Shift + Return</span> to add a new line
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl text-outline mb-4">tag</span>
                <p className="text-on-surface-variant font-medium">Select a channel</p>
                <p className="text-xs text-on-surface-variant mt-1">Choose a channel from the left to start chatting</p>
              </div>
            </div>
          )}
        </section>

        <aside className="w-80 bg-surface-container-lowest border-l border-outline-variant/15 hidden xl:flex flex-col h-full overflow-y-auto shrink-0 shadow-[-8px_0_24px_rgba(0,0,0,0.2)] z-20">
          <div className="h-14 border-b border-outline-variant/10 flex items-center justify-between px-4 shrink-0 bg-surface-container-lowest">
            <h2 className="text-sm font-bold text-on-surface">Thread</h2>
            <button className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-container">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="p-6 flex flex-col items-center justify-center h-full text-center opacity-60">
            <span className="material-symbols-outlined text-4xl mb-3 text-outline">forum</span>
            <p className="text-sm text-on-surface-variant font-medium">Select a message to view its thread</p>
          </div>
        </aside>
      </div>
    </SubPageLayout>
  );
}
