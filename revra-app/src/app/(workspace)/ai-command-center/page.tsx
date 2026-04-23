"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useAuthStore } from "@/lib/stores";
import { useState, useRef, useEffect, useCallback } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useQueryClient } from "@tanstack/react-query";
import type { AIMessage } from "@/types";

const COST_PER_MESSAGE = 1;

function getToken() {
  if (typeof window === 'undefined') return '';
  const match = document.cookie.match(/sb-access-token=([^;]+)/);
  return match ? match[1] : '';
}

const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', desc: 'Balanced' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', desc: 'Fast' },
] as const;

export default function AICommandCenterPage() {
  const session = useAuthStore((s) => s.session);
  const { data: workspace } = useWorkspace();
  const [chatHistory, setChatHistory] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const aiCredits = (workspace as any)?.ai_credits ?? 0;
  const qc = useQueryClient();

  const deductCredits = async (amount: number, action: string) => {
    try {
      await fetch('/api/workspace/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount, action, description: `AI ${action} credit deduction` }),
      });
      qc.invalidateQueries({ queryKey: ['workspace'] });
    } catch {
      // Silently fail — don't block AI for credit errors
    }
  };

  const suggestions = [
    "Draft follow-up SMS for a Medicare lead",
    "Summarize my pipeline today",
    "Score my top 5 leads",
    "What leads need follow-up today?",
  ];

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [chatHistory, isTyping, scrollToBottom]);

  const streamAI = async (messages: AIMessage[]) => {
    const systemPrompt = `You are RevRa AI, an intelligent CRM assistant for health insurance sales agents. You have access to the agent's full CRM context. Be helpful, concise, and actionable. Current context: Agent ${session?.name || 'Unknown'}, Workspace ${session?.workspaceId || 'Unknown'}.`;

    const conversation = messages.map((m) => `${m.role === 'assistant' ? 'assistant' : 'user'}: ${m.content}`).join('\n');

    setIsTyping(true);
    let fullResponse = '';

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          messages: [{ role: 'user', content: conversation }],
          model: selectedModel,
        }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const text = parsed.content?.[0]?.type === 'text_delta'
                ? parsed.content[0].text
                : parsed.choices?.[0]?.delta?.content || '';
              if (text) {
                fullResponse += text;
                setChatHistory((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant') {
                    return [...prev.slice(0, -1), { ...last, content: fullResponse }];
                  }
                  return [...prev, { role: 'assistant', content: text, timestamp: Date.now() }];
                });
              }
            } catch {
              // skip malformed
            }
          }
        }
      }
    } catch (err) {
      const errResp = 'Sorry, I encountered an error. Please try again.';
      fullResponse = errResp;
      setChatHistory((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return [...prev.slice(0, -1), { ...last, content: errResp }];
        }
        return [...prev, { role: 'assistant', content: errResp, timestamp: Date.now() }];
      });
    } finally {
      setIsTyping(false);
      deductCredits(1, 'chat_message');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !session) return;
    const userMsg: AIMessage = { role: "user", content: input.trim(), timestamp: Date.now() };
    setChatHistory((prev) => [...prev, userMsg]);
    const updated = [...chatHistory, userMsg];
    setInput("");
    await streamAI(updated);
  };

  const handleSuggestionSend = (text: string) => {
    if (!session) return;
    const userMsg: AIMessage = { role: "user", content: text, timestamp: Date.now() };
    setChatHistory((prev) => [...prev, userMsg]);
    streamAI([...chatHistory, userMsg]);
  };

  const handleQuickAction = (action: string) => {
    const prompts: Record<string, string> = {
      "Morning Briefing": "Generate my morning briefing for today. List my overdue follow-ups, today's appointments, new leads, and hot leads.",
      "Score Leads": "Score and rank my top 10 leads by conversion probability. Explain the scoring factors.",
      "Draft SMS": "Draft an SMS follow-up message for a Medicare lead who missed their last scheduled call.",
    };
    setInput(prompts[action] || action);
  };

  return (
    <SubPageLayout>
      <div className="h-full flex relative">
        <div className="flex-1 flex flex-col relative h-full bg-surface">
          <div className="flex-1 overflow-y-auto px-8 pb-32 pt-4 flex flex-col gap-8 scroll-smooth relative z-0">
            <div className="text-center text-xs text-on-surface-variant/50 font-medium my-2">
              {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </div>

            {chatHistory.length === 0 && (
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
            )}

            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} w-full`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 mt-1">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">temp_preferences_custom</span>
                  </div>
                )}
                <div className={`rounded-lg p-4 max-w-[80%] lg:max-w-[60%] text-sm leading-relaxed text-on-surface shadow-[0_4px_24px_rgba(0,0,0,0.1)] ${msg.role === "user" ? "bg-surface-container-high rounded-tr-sm" : ""}`}>
                  {msg.content}
                </div>
              </div>
            ))}

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
            <div ref={chatEndRef} />
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
                    data-send-btn
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
                    onClick={() => handleSuggestionSend(s)}
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
                  { icon: "description", title: "Morning Briefing", desc: "Generate today's briefing", action: "Morning Briefing" },
                  { icon: "calculate", title: "Score Leads", desc: "Analyze pipeline leads", action: "Score Leads" },
                  { icon: "mail", title: "Draft SMS", desc: "Generate SMS draft", action: "Draft SMS" },
                ].map((prompt, i) => (
                  <button key={i} onClick={() => handleQuickAction(prompt.action)} className="w-full bg-surface p-3 rounded-lg flex items-start gap-3 hover:bg-surface-container-low transition-colors cursor-pointer group text-left">
                    <span className="material-symbols-outlined text-[16px] text-primary-container mt-0.5 group-hover:scale-110 transition-transform">{prompt.icon}</span>
                    <div>
                      <div className="text-sm text-on-surface font-medium">{prompt.title}</div>
                      <div className="text-xs text-on-surface-variant/70 mt-1">{prompt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-br from-surface-container to-surface-container-low p-4 rounded-lg border border-surface-variant/30">
              <div className="flex items-center gap-2 text-xs font-medium text-tertiary mb-3">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span> AI Active
              </div>
              <div className="text-xs text-on-surface-variant space-y-2 mb-3">
                <div className="flex justify-between"><span>Mode:</span> <span className="text-on-surface">Command</span></div>
              </div>
              <div className="text-xs font-medium text-on-surface-variant mb-1.5">Model</div>
              <div className="space-y-1">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      selectedModel === m.id
                        ? "bg-primary-container/30 text-primary font-medium"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    <div className="text-left">
                      <div>{m.label}</div>
                      <div className="text-[10px] opacity-70">{m.desc}</div>
                    </div>
                    {selectedModel === m.id && (
                      <span className="material-symbols-outlined text-[14px] text-primary">check</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </SubPageLayout>
  );
}
