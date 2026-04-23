"use client";

import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface FloatingAIBarProps {
  context?: {
    leadId?: string;
    leadName?: string;
    page?: string;
  };
}

export function FloatingAIBar({ context }: FloatingAIBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState<'claude-sonnet-4-6' | 'claude-haiku-4-5'>('claude-sonnet-4-6');
  const bottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const streamAI = async (userMessage: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const assistantMsg: Message = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, assistantMsg]);

    const systemPrompt = context?.leadId
      ? `Context: You are RevRa's AI assistant. The user is currently viewing lead "${context.leadName || context.leadId}" in the ${context.page || 'CRM'}. Provide helpful, concise responses related to this lead's data, insurance sales best practices, and CRM workflows.`
      : `You are RevRa's AI assistant. The user is navigating the CRM. Provide helpful, concise responses about lead management, sales, and CRM workflows.`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt,
          model,
        }),
      });

      if (!res.ok) {
        setMessages(prev => prev.map(m => m.id === assistantMsg.id
          ? { ...m, content: 'AI service unavailable. Please check your API configuration.' }
          : m
        ));
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(m => m.id === assistantMsg.id
          ? { ...m, content: m.content + chunk }
          : m
        ));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantMsg.id
        ? { ...m, content: 'Connection error. Please try again.' }
        : m
      ));
    } finally {
      setIsStreaming(false);
      // Deduct credit
      try {
        await fetch('/api/workspace/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ amount: 1, action: 'chat_message', description: 'AI chat message credit deduction' }),
        });
        qc.invalidateQueries({ queryKey: ['workspace'] });
      } catch {}
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    streamAI(input.trim());
  };

  const quickActions = [
    { label: 'Score my leads', prompt: 'Analyze my current lead pipeline and suggest which ones I should prioritize today.' },
    { label: 'Draft follow-up', prompt: context?.leadId ? `Draft a professional follow-up message for ${context.leadName || 'this lead'}.` : 'Draft a professional follow-up message for a new Medicare lead.' },
    { label: 'Summarize inbox', prompt: 'Give me a summary of my inbox conversations that need attention today.' },
    { label: 'Pipeline advice', prompt: 'Based on my pipeline, what stages are bottlenecks and how can I improve conversion rates?' },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-primary-container shadow-[0_8px_24px_rgba(45,91,255,0.35)] hover:scale-110 transition-all flex items-center justify-center group"
        title="Ask RevRa AI"
      >
        <span className="material-symbols-outlined text-on-primary-container text-2xl">psychology</span>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-surface animate-pulse"></span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[90] w-96 max-h-[600px] flex flex-col bg-surface-container-highest rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.4)] border border-outline-variant/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-container-high border-b border-outline-variant/15">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container text-lg">psychology</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">RevRa AI</p>
            <p className="text-[10px] text-on-surface-variant">Powered by OpusMax</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as any)}
            className="bg-transparent text-[10px] text-on-surface-variant border border-outline-variant/30 rounded px-1.5 py-0.5 focus:outline-none"
          >
            <option value="claude-sonnet-4-6">Sonnet</option>
            <option value="claude-haiku-4-5">Haiku</option>
          </select>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <span className="material-symbols-outlined text-4xl text-primary-container mb-3">auto_awesome</span>
            <p className="text-sm text-on-surface font-medium">How can I help you today?</p>
            <p className="text-xs text-on-surface-variant mt-1 mb-4">Ask about leads, drafts, scheduling, or CRM advice.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => streamAI(action.prompt)}
                  disabled={isStreaming}
                  className="text-xs px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/20"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === 'user'
                ? 'bg-primary-container text-on-primary-container rounded-br-md'
                : 'bg-surface-container text-on-surface rounded-bl-md'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content || (msg.role === 'assistant' && isStreaming && msg.id === messages[messages.length - 1]?.id ? '...' : '')}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-outline-variant/15">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask RevRa anything..."
            rows={1}
            className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary-container/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </div>
        {context?.leadId && (
          <p className="text-[10px] text-on-surface-variant mt-1.5 px-1">
            Context: {context.page || 'CRM'} · Lead: {context.leadName || context.leadId}
          </p>
        )}
      </form>
    </div>
  );
}