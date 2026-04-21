// ============================================================
// RevRa AI Service - Real LLM + Mock Fallback
// ============================================================

import type {
  AIMessage, AIContext, SMSDraft, LeadScoreResult, PreCallBrief,
  PostCallSummary, ColumnMapping, MorningBriefing, Lead, Appointment,
} from '@/types';

// ============ Configuration ============

export const AI_CONFIG = {
  apiBase: process.env.AI_API_BASE || 'https://api.anthropic.com/v1',
  apiKey: process.env.AI_API_KEY || '',
  model: process.env.AI_MODEL || 'claude-haiku-4-20250514',
  useMock: !process.env.AI_API_KEY,
};

// ============ Credit Costs ============

export const CREDIT_COSTS: Record<string, number> = {
  sms_draft: 1,
  morning_briefing: 5,
  lead_scoring: 2,
  pre_call_brief: 3,
  post_call_summary: 3,
  chat_message: 1,
  csv_mapping: 2,
};

// ============ Mock Templates ============

const MOCK_SMS_DRAFTS = {
  friendly: "Hi {{firstName}}! This is {{agentName}} from RevRa. I wanted to check in on our conversation about your Medicare coverage. Would you have a few minutes to chat this week? Best time to reach me is usually afternoons.",
  professional: "Hello {{firstName}}, this is {{agentName}} reaching out regarding your insurance needs. I have some options that may better suit your situation. Please let me know a convenient time to connect at your earliest convenience.",
  urgent: "{{firstName}}, I wanted to connect before the enrollment period closes. We have limited availability this week — would a quick 10-minute call work? Call or text me back.",
};

const MOCK_LEAD_SCORE_FACTORS = [
  { factor: "Medicare coverage in high-demand state", impact: "+20 pts", points: 20 },
  { factor: "Budget $300+/month", impact: "+15 pts", points: 15 },
  { factor: "Recent engagement with outreach", impact: "+10 pts", points: 10 },
  { factor: "Pre-existing conditions noted", impact: "+5 pts", points: 5 },
];

const MOCK_CHAT_RESPONSES: Record<string, string> = {
  default: "Based on your current pipeline, I see 3 leads that need immediate attention. I've ranked them by score and urgency. Would you like me to draft outreach messages for each of them, or would you prefer to focus on the highest-scoring one first?",
  pipeline: "Your Q3 pipeline shows strong momentum in the Medicare Advantage segment. 12 of your 42 active deals are in the Quote Sent stage — historically, 35% of those convert within 14 days. I'd recommend prioritizing follow-ups on deals older than 7 days in that stage.",
  leads: "You have 47 leads assigned to you across all stages. 8 are flagged as hot leads (score 80+). The highest-scoring lead is Michael Roberts at 94 points — he showed strong interest during your last call and is ready for a needs analysis.",
  schedule: "You have 3 appointments today: a Medicare discovery call at 11 AM with Sarah Williams, a quote review at 2 PM with Marcus Torres, and a video call at 4:30 PM with David Chen. I've pre-generated talking points for the 11 AM call based on your last conversation with Sarah.",
  emails: "I can draft professional follow-up emails for your recent calls. Based on your conversation history, I noticed 4 leads are ready for a follow-up email after the initial call. Want me to draft personalized emails for each, or should I create a template that you can customize?",
};

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] || `{{${k}}}`);
}

// ============ Mock AI Service ============

export const mockAI = {
  async *chat(messages: AIMessage[], context: AIContext): AsyncGenerator<string> {
    // Simulate streaming delay
    const lastContent = messages[messages.length - 1]?.content || '';
    const lower = lastContent.toLowerCase();

    let response = MOCK_CHAT_RESPONSES.default;
    if (lower.includes('pipeline') || lower.includes('stage')) response = MOCK_CHAT_RESPONSES.pipeline;
    else if (lower.includes('lead') || lower.includes('score')) response = MOCK_CHAT_RESPONSES.leads;
    else if (lower.includes('schedule') || lower.includes('appointment') || lower.includes('calendar')) response = MOCK_CHAT_RESPONSES.schedule;
    else if (lower.includes('email') || lower.includes('draft')) response = MOCK_CHAT_RESPONSES.emails;

    // Simulate streaming token by token
    const words = response.split(' ');
    for (const word of words) {
      await new Promise((r) => setTimeout(r, 15));
      yield word + ' ';
    }
  },

  async smsDraft(lead: Lead, tone: 'friendly' | 'professional' | 'urgent', agentName: string): Promise<SMSDraft> {
    await new Promise((r) => setTimeout(r, 600));
    const template = MOCK_SMS_DRAFTS[tone];
    const draft = interpolate(template, {
      firstName: lead.fullName.split(' ')[0],
      agentName,
    });
    return { draft, tone, confidence: 0.82 + Math.random() * 0.16, leadId: lead.id };
  },

  async scoreLead(lead: Lead): Promise<LeadScoreResult> {
    await new Promise((r) => setTimeout(r, 800));
    const score = lead.score || Math.floor(Math.random() * 40) + 60;
    const tier = score >= 80 ? 'hot' : score >= 50 ? 'warm' : 'cold';
    return { score, tier, factors: MOCK_LEAD_SCORE_FACTORS };
  },

  async preCallBrief(lead: Lead, appointment: Appointment): Promise<PreCallBrief> {
    await new Promise((r) => setTimeout(r, 700));
    return {
      talkingPoints: [
        `Confirm ${lead.fullName}'s current coverage and any recent changes to their situation`,
        `Understand their timeline for purchasing insurance — when are they looking to be covered?`,
        `Discuss budget range: ${lead.monthlyBudget ? `$${lead.monthlyBudget}/month` : 'not yet established'}`,
        `Ask about any pre-existing conditions that might affect their options`,
      ],
      keyQuestions: [
        `What coverage are you currently with, and when does your policy renew?`,
        `What would make you feel confident about switching to a new plan?`,
        `Is there anything specific you've been worrying about with your current coverage?`,
      ],
      anticipatedObjections: [
        'My current plan is working fine',
        "I don't have time to switch right now",
        'I need to discuss it with my spouse first',
      ],
      coverageRecommendation: `Based on their profile (${lead.coverageType}, ${lead.age ? `${lead.age} years old` : 'age unknown'}), I recommend focusing on ${lead.coverageType} Advantage plans with a $0 premium option to reduce friction.`,
      leadSummary: `${lead.fullName} is a${lead.age && lead.age >= 65 ? 'n' : ''} ${lead.age || 'age unknown'} prospect interested in ${lead.coverageType} coverage. Source: ${lead.source.replace('_', ' ')}. Score: ${lead.score}/100.`,
    };
  },

  async postCallSummary(call: { duration?: number; outcome?: string }, lead: Lead): Promise<PostCallSummary> {
    await new Promise((r) => setTimeout(r, 600));
    return {
      summary: `Connected with ${lead.fullName} regarding their ${lead.coverageType} needs. Discussed current coverage situation and next steps for the quote. ${call.outcome === 'contacted' ? 'Lead is engaged and wants to proceed.' : 'Call answered but limited engagement.'}`,
      keyOutcomes: [
        call.outcome === 'contacted' ? 'Lead confirmed interest in Medicare Advantage options' : 'Limited engagement — voicemail or no answer',
        'Requested callback for detailed quote discussion' as string,
        'Budget range confirmed as $200-400/month' as string,
      ],
      recommendedNextAction: call.outcome === 'contacted'
        ? 'Send personalized Medicare Advantage quote with 3 plan options. Follow up in 2 days.'
        : 'Add to Emma AI queue for automated follow-up call in 3 days.',
    };
  },

  async morningBriefing(agentName: string, stats: Record<string, unknown>): Promise<MorningBriefing> {
    await new Promise((r) => setTimeout(r, 1200));
    return {
      id: `briefing-${Date.now()}`,
      agentId: 'u-1',
      date: new Date().toISOString().split('T')[0],
      generatedAt: Date.now(),
      sections: {
        newLeads: {
          summary: `Good morning ${agentName}. You have 3 new leads assigned overnight. Focus on the Medicare Advantage leads first — they have the highest conversion potential.`,
          items: [
            { leadName: 'Michael Roberts', score: 94, coverageType: 'Medicare', actionLabel: 'Call Now' },
            { leadName: 'Sarah Williams', score: 78, coverageType: 'ACA', actionLabel: 'Schedule' },
            { leadName: 'David Chen', score: 65, coverageType: 'Life', actionLabel: 'SMS' },
          ],
          color: '#b8c3ff',
          icon: 'person_add',
        },
        overdueFollowUps: {
          summary: 'These 2 leads have exceeded their follow-up window. AI recommends immediate contact to prevent further pipeline stagnation.',
          items: [
            { leadName: 'Emily Chen', score: 52, daysOverdue: 3, actionLabel: 'Call Now' },
            { leadName: 'Marcus Pierce', score: 34, daysOverdue: 7, actionLabel: 'Re-engage' },
          ],
          color: '#ffb4ab',
          icon: 'warning',
        },
        dueToday: {
          summary: 'You have 3 follow-ups due today. Prioritize the Medicare leads as enrollment deadline approaches.',
          items: [
            { leadName: 'Sarah Williams', actionLabel: 'Appointment at 11 AM' },
            { leadName: 'Marcus Torres', actionLabel: 'Quote review at 2 PM' },
            { leadName: 'David Chen', actionLabel: 'Video call at 4:30 PM' },
          ],
          color: '#fbbf24',
          icon: 'today',
        },
        hotLeads: {
          summary: '5 leads scored 85+ and require immediate attention. These are your highest-urgency opportunities.',
          items: [
            { leadName: 'Michael Roberts', score: 94, priority: 'High' },
            { leadName: 'Jennifer Smith', score: 91, priority: 'High' },
            { leadName: 'James Wilson', score: 88, priority: 'High' },
          ],
          color: '#10b981',
          icon: 'local_fire_department',
        },
        appointmentsToday: {
          summary: '3 appointments scheduled today. AI has pre-generated talking points for each call.',
          items: [
            { leadName: 'Sarah Williams', appointmentTime: '11:00 AM', appointmentTitle: 'Medicare Discovery' },
            { leadName: 'Marcus Torres', appointmentTime: '2:00 PM', appointmentTitle: 'Quote Review' },
            { leadName: 'David Chen', appointmentTime: '4:30 PM', appointmentTitle: 'Video Call' },
          ],
          color: '#b8c3ff',
          icon: 'event',
        },
        renewalsThisMonth: {
          summary: '4 policies approaching renewal this month. Proactive outreach can prevent lapses.',
          items: [
            { leadName: 'Robert Brown', actionLabel: 'Renewal Due Nov 1' },
            { leadName: 'Patricia Lee', actionLabel: 'Renewal Due Nov 15' },
          ],
          color: '#fbbf24',
          icon: 'autorenew',
        },
        aiSuggestions: {
          summary: 'AI has generated personalized recommendations based on your pipeline and recent activities.',
          items: [
            { leadName: 'Omega Corp', aiSuggestion: 'Consider offering a Q3 discount — engagement dropped 40% after pricing deck.', priority: 'Medium' },
            { leadName: 'TechNova', aiSuggestion: 'Positive sentiment detected in last call. Pitch Enterprise tier upgrade.', priority: 'High' },
          ],
          color: '#8342f4',
          icon: 'psychology',
        },
      },
    };
  },

  async csvMapping(headers: string[]): Promise<ColumnMapping[]> {
    await new Promise((r) => setTimeout(r, 500));
    const fieldMap: Record<string, { field: string; confidence: number }> = {
      'name': { field: 'full_name', confidence: 95 },
      'full name': { field: 'full_name', confidence: 98 },
      'first name': { field: 'first_name', confidence: 97 },
      'last name': { field: 'last_name', confidence: 97 },
      'email': { field: 'email_primary', confidence: 99 },
      'email address': { field: 'email_primary', confidence: 99 },
      'phone': { field: 'phone_primary', confidence: 92 },
      'phone number': { field: 'phone_primary', confidence: 94 },
      'mobile': { field: 'phone_mobile', confidence: 88 },
      'mobile number': { field: 'phone_mobile', confidence: 90 },
      'address': { field: 'home_address', confidence: 85 },
      'city': { field: 'city', confidence: 95 },
      'state': { field: 'state', confidence: 98 },
      'zip': { field: 'zip_code', confidence: 95 },
      'company': { field: 'company_name', confidence: 90 },
      'coverage': { field: 'coverage_type', confidence: 80 },
      'source': { field: 'lead_source', confidence: 75 },
    };

    return headers.map((header) => {
      const lower = header.toLowerCase().trim();
      const mapped = fieldMap[lower] || { field: '', confidence: 0 };
      return {
        csvHeader: header,
        sampleValue: `Sample ${header}`,
        revraField: mapped.field,
        confidence: mapped.confidence,
        status: mapped.confidence >= 90 ? 'high' : mapped.confidence >= 70 ? 'medium' : mapped.confidence > 0 ? 'low' : 'unmapped',
      };
    });
  },
};

// ============ Real LLM Service ============

async function llmComplete(prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch(`${AI_CONFIG.apiBase}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': AI_CONFIG.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

export const realAI = {
  async *chat(messages: AIMessage[], context: AIContext): AsyncGenerator<string> {
    const systemPrompt = `You are RevRa AI, an intelligent CRM assistant for health insurance sales agents. You have access to the agent's full CRM context. Be helpful, concise, and actionable. Current context: Agent ${context.agentName}, Workspace ${context.workspaceId}, Tab: ${context.currentTab}.`;

    const conversation = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    const fullPrompt = `${conversation}\n\nProvide a helpful, actionable response.`;

    const response = await llmComplete(fullPrompt, systemPrompt);

    const words = response.split(' ');
    for (const word of words) {
      yield word + ' ';
    }
  },

  async smsDraft(lead: Lead, tone: string, agentName: string): Promise<SMSDraft> {
    const prompt = `Generate a ${tone} SMS message for an insurance sales agent to send to a prospect.\n\nLead: ${lead.fullName}, Coverage: ${lead.coverageType}, State: ${lead.state}\nAgent: ${agentName}\n\nKeep it under 160 characters. Include merge fields if appropriate.`;
    const draft = await llmComplete(prompt, 'You are RevRa AI. Generate SMS drafts for insurance agents.');
    return { draft: draft.trim(), tone: tone as 'friendly' | 'professional' | 'urgent', confidence: 0.9, leadId: lead.id };
  },

  async scoreLead(lead: Lead): Promise<LeadScoreResult> {
    const prompt = `Score this lead from 0-100 for insurance sales potential. Provide a score and factor breakdown.\n\n${JSON.stringify(lead, null, 2)}`;
    const result = await llmComplete(prompt, 'You are RevRa AI. Score leads 0-100 for insurance sales potential. Return JSON: {"score": number, "factors": [{"factor": string, "impact": string, "points": number}]}');
    try {
      return JSON.parse(result);
    } catch {
      return { score: 70, tier: 'warm', factors: [] };
    }
  },

  async preCallBrief(lead: Lead, appointment: Appointment): Promise<PreCallBrief> {
    const prompt = `Generate a pre-call brief for an insurance sales call.\n\nLead: ${lead.fullName}, ${lead.coverageType}, Score: ${lead.score}\nAppointment: ${appointment.title} at ${new Date(appointment.scheduledAt).toLocaleString()}`;
    const result = await llmComplete(prompt, 'You are RevRa AI. Generate pre-call briefs with talking points, key questions, anticipated objections, and coverage recommendation. Return JSON with fields: talkingPoints, keyQuestions, anticipatedObjections, coverageRecommendation, leadSummary.');
    try {
      return JSON.parse(result);
    } catch {
      return { talkingPoints: [], keyQuestions: [], anticipatedObjections: [], coverageRecommendation: '', leadSummary: '' };
    }
  },

  async postCallSummary(call: Record<string, unknown>, lead: Lead): Promise<PostCallSummary> {
    const prompt = `Summarize this sales call and provide next actions.\n\nCall: ${JSON.stringify(call)}\nLead: ${lead.fullName}, ${lead.coverageType}`;
    const result = await llmComplete(prompt, 'You are RevRa AI. Summarize sales calls with key outcomes and recommended next actions. Return JSON with fields: summary, keyOutcomes[], recommendedNextAction.');
    try {
      return JSON.parse(result);
    } catch {
      return { summary: '', keyOutcomes: [], recommendedNextAction: '' };
    }
  },

  async morningBriefing(agentName: string, stats: Record<string, unknown>): Promise<MorningBriefing> {
    const prompt = `Generate a morning briefing for insurance sales agent ${agentName}.\n\nPipeline stats: ${JSON.stringify(stats)}`;
    const result = await llmComplete(prompt, 'You are RevRa AI. Generate morning briefings for insurance agents. Return JSON matching MorningBriefing type.');
    try {
      return JSON.parse(result);
    } catch {
      return mockAI.morningBriefing(agentName, stats);
    }
  },

  async csvMapping(headers: string[]): Promise<ColumnMapping[]> {
    const prompt = `Map these CSV headers to RevRa CRM fields: ${headers.join(', ')}. Available fields: full_name, first_name, last_name, email_primary, phone_primary, phone_mobile, home_address, city, state, zip_code, coverage_type, lead_source, monthly_budget, income_range, current_carrier.`;
    const result = await llmComplete(prompt, 'You are RevRa AI. Map CSV headers to CRM fields. Return JSON array with {csvHeader, revraField, confidence, status}.');
    try {
      return JSON.parse(result);
    } catch {
      return mockAI.csvMapping(headers);
    }
  },
};

// ============ Unified AI Service ============

export const aiService = AI_CONFIG.useMock ? mockAI : realAI;

// ============ Streaming Chat (Server-compatible) ============

export async function* streamChat(messages: AIMessage[], context: AIContext): AsyncGenerator<string> {
  if (AI_CONFIG.useMock) {
    yield* mockAI.chat(messages, context);
  } else {
    yield* realAI.chat(messages, context);
  }
}
