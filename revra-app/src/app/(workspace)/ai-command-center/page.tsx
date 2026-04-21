"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useDataStore, useAuthStore, useAIStore } from "@/lib/stores";
import { useState, useRef, useEffect } from "react";

export default function AICommandCenterPage() {
  const session = useAuthStore((s) => s.session);
  const aiCredits = useAIStore((s) => s.aiCredits);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Draft follow-up email",
    "Summarize recent calls",
    "Update deal probabilities",
    "Analyze pipeline",
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
    setInput("");
  };

  return (
    <SubPageLayout>
      <div className="h-full flex relative">
        <div className="flex-1 flex flex-col relative h-full bg-surface">
          <div className="flex-1 overflow-y-auto px-8 pb-32 pt-4 flex flex-col gap-8 scroll-smooth relative z-0">
            <div className="text-center text-xs text-on-surface-variant/50 font-medium my-2">
              {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </div>

            <div className="flex justify-end w-full">
              <div className="bg-surface-container-high rounded-lg rounded-tr-sm p-4 max-w-[80%] lg:max-w-[60%] text-sm leading-relaxed text-on-surface shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
                {input || "Analyze my pipeline for Q3. Identify any enterprise deals stuck in the 'Proposal' stage and suggest a follow-up strategy."}
              </div>
            </div>

            <div className="flex justify-start w-full gap-4">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 mt-1">
                <span className="material-symbols-outlined text-tertiary text-[18px]">temp_preferences_custom</span>
              </div>
              <div className="flex flex-col gap-3 max-w-[85%] lg:max-w-[70%]">
                <div className="text-sm leading-relaxed text-on-surface text-opacity-90">
                  Welcome to the <strong className="text-tertiary font-semibold">RevRa AI Command Center</strong>. I can help you analyze leads, draft communications, generate briefings, and optimize your sales workflow.
                  <br/><br/>
                  Try asking me to:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Summarize your pipeline performance</li>
                    <li>Draft an SMS or email to a specific lead</li>
                    <li>Generate a morning briefing</li>
                    <li>Score and rank your hot leads</li>
                  </ul>
                </div>
              </div>
            </div>

            {isTyping && (
              <div className="flex justify-start w-full gap-4 mt-2">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-tertiary text-[18px] animate-spin">sync</span>
                </div>
                <div className="flex items-center text-sm text-tertiary-fixed-dim italic">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 pt-12 bg-gradient-to-t from-surface via-surface/90 to-transparent z-20 pointer-events-none">
            <div className="max-w-4xl mx-auto pointer-events-auto">
              <div className="bg-surface-variant/60 backdrop-blur-[24px] rounded-lg p-3 flex items-end gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <button className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0 mb-1">
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <div className="flex-1 relative">
                  <textarea
                    className="w-full bg-transparent border-none text-on-surface text-sm placeholder-on-surface-variant/50 resize-none focus:ring-0 px-2 py-2 max-h-32 min-h-[44px]"
                    placeholder="Ask RevRa to analyze, draft, or command..."
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  ></textarea>
                </div>
                <div className="flex gap-2 shrink-0 mb-1">
                  <button className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors" title="Voice Command">
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                  <button
                    onClick={handleSend}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary-container font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    Send <span className="material-symbols-outlined text-[16px]">send</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide text-xs">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors whitespace-nowrap"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="w-80 bg-surface-container-lowest border-l-0 shrink-0 hidden lg:flex flex-col h-screen overflow-y-auto">
          <div className="p-6">
            <h2 className="text-sm font-semibold tracking-wide text-on-surface mb-6 uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-tertiary">psychology</span>
              Intelligence Hub
            </h2>

            <div className="mb-8">
              <div className="text-xs font-medium text-on-surface-variant mb-3 px-1">AI Credits</div>
              <div className="bg-surface-container rounded-lg p-4">
                <div className="text-2xl font-bold text-on-surface">{aiCredits.toLocaleString()}</div>
                <div className="text-xs text-on-surface-variant mt-1">credits remaining</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-on-surface-variant mb-3 px-1 flex items-center justify-between">
                Quick Actions
                <span className="material-symbols-outlined text-[14px] cursor-pointer hover:text-on-surface">add</span>
              </div>
              <div className="space-y-2">
                {[
                  { icon: "description", title: "Morning Briefing", desc: "Generate today's briefing" },
                  { icon: "calculate", title: "Score Leads", desc: "Analyze pipeline leads" },
                  { icon: "mail", title: "Draft SMS", desc: "Generate SMS draft" },
                ].map((prompt, i) => (
                  <div key={i} className="bg-surface p-3 rounded-lg flex items-start gap-3 hover:bg-surface-container-low transition-colors cursor-pointer group">
                    <span className="material-symbols-outlined text-[16px] text-primary-container mt-0.5 group-hover:scale-110 transition-transform">{prompt.icon}</span>
                    <div>
                      <div className="text-sm text-on-surface font-medium">{prompt.title}</div>
                      <div className="text-xs text-on-surface-variant/70 mt-1">{prompt.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-br from-surface-container to-surface-container-low p-4 rounded-lg border border-surface-variant/30">
              <div className="flex items-center gap-2 text-xs font-medium text-tertiary mb-3">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span> AI Active
              </div>
              <div className="text-xs text-on-surface-variant space-y-2">
                <div className="flex justify-between"><span>Mode:</span> <span className="text-on-surface">Command</span></div>
                <div className="flex justify-between"><span>Model:</span> <span className="text-on-surface">Claude</span></div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </SubPageLayout>
  );
}
