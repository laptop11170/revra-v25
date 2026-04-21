// ============================================================
// RevRa CRM - Seed Data
// Comprehensive mock database for testing
// ============================================================

import {
  Workspace, User, Lead, PipelineStage, Conversation, Message,
  Appointment, Task, Workflow, DiscussionChannel, DiscussionMessage,
  Subscription, Plan, Notification, Activity, EmmaCampaign, EmmaQueueItem,
  Call, createId, now, daysAgo, daysFromNow,
} from '@/types';

// ============ Pipeline Stages (11 stages per PRD2 Section 4.1) ============

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'stage-1', name: 'New Lead', slug: 'new_lead', color: '#b8c3ff', position: 1 },
  { id: 'stage-2', name: 'Attempting Contact', slug: 'attempting_contact', color: '#b8c3ff', position: 2 },
  { id: 'stage-3', name: 'Contacted', slug: 'contacted', color: '#eaddff', position: 3 },
  { id: 'stage-4', name: 'Needs Analysis', slug: 'needs_analysis', color: '#8342f4', position: 4 },
  { id: 'stage-5', name: 'Quote Sent', slug: 'quote_sent', color: '#b8c3ff', position: 5 },
  { id: 'stage-6', name: 'Application Submitted', slug: 'application_submitted', color: '#dde1ff', position: 6 },
  { id: 'stage-7', name: 'In Underwriting', slug: 'in_underwriting', color: '#d2bbff', position: 7 },
  { id: 'stage-8', name: 'Bound / Policy Active', slug: 'bound', color: '#10b981', position: 8 },
  { id: 'stage-9', name: 'Closed Lost', slug: 'closed_lost', color: '#ffb4ab', position: 9 },
  { id: 'stage-10', name: 'Renewal Due', slug: 'renewal_due', color: '#fbbf24', position: 10 },
  { id: 'stage-11', name: 'Lapsed', slug: 'lapsed', color: '#6b7280', position: 11 },
];

// ============ Plans ============

export const PLANS: Plan[] = [
  { id: 'plan-starter', name: 'Starter', weeklyPrice: 57.50, monthlyPrice: 250, weeklyLeadLimit: 10, monthlyAiCredits: 1000, features: ['Leads', 'Pipeline', 'Inbox', 'Calendar', 'Basic AI'], isActive: true },
  { id: 'plan-growth', name: 'Growth', weeklyPrice: 103.75, monthlyPrice: 450, weeklyLeadLimit: 20, monthlyAiCredits: 5000, features: ['Everything in Starter', 'AI Command Center', 'Workflows', 'Emma AI', 'Advanced Analytics'], isActive: true },
  { id: 'plan-scale', name: 'Scale', weeklyPrice: 184, monthlyPrice: 799, weeklyLeadLimit: 40, monthlyAiCredits: 15000, features: ['Everything in Growth', 'Priority Support', 'Custom Integrations', 'API Access'], isActive: true },
  { id: 'plan-enterprise', name: 'Enterprise', weeklyPrice: 0, monthlyPrice: 0, weeklyLeadLimit: 0, monthlyAiCredits: 0, features: ['Everything in Scale', 'Dedicated Support', 'Custom Development', 'SLA'], isActive: true },
];

// ============ Workspaces ============

export const WORKSPACES: Workspace[] = [
  {
    id: 'ws-1',
    name: 'San Diego Health Agents',
    plan: 'growth',
    aiCredits: 4120,
    aiCreditTransactions: [
      { action: 'morning_briefing', amount: 5, timestamp: daysAgo(1), description: 'Daily briefing generation' },
      { action: 'sms_draft', amount: 1, timestamp: daysAgo(1), description: 'SMS draft for Sarah Jenkins' },
      { action: 'lead_scoring', amount: 2, timestamp: daysAgo(2), description: 'Lead score update' },
    ],
    integrations: { llm: { model: 'claude-sonnet-4' } },
    createdAt: daysAgo(90),
  },
  {
    id: 'ws-2',
    name: 'Texas Insurance Group',
    plan: 'starter',
    aiCredits: 2500,
    aiCreditTransactions: [],
    integrations: {},
    createdAt: daysAgo(45),
  },
];

// ============ Users ============

export const USERS: User[] = [
  // Workspace 1 - San Diego Health Agents
  { id: 'u-1', email: 'agent1@revra.test', password: 'password', name: 'Alex Mercer', role: 'agent', workspaceId: 'ws-1', isActive: true, createdAt: daysAgo(90) },
  { id: 'u-2', email: 'agent2@revra.test', password: 'password', name: 'Sarah Jenkins', role: 'agent', workspaceId: 'ws-1', isActive: true, createdAt: daysAgo(75) },
  { id: 'u-3', email: 'agent3@revra.test', password: 'password', name: 'Marcus Torres', role: 'agent', workspaceId: 'ws-1', isActive: true, createdAt: daysAgo(60) },
  { id: 'u-4', email: 'admin1@revra.test', password: 'password', name: 'David Wu', role: 'admin', workspaceId: 'ws-1', isActive: true, createdAt: daysAgo(90) },

  // Workspace 2 - Texas Insurance Group
  { id: 'u-5', email: 'agent4@revra.test', password: 'password', name: 'Emily Chen', role: 'agent', workspaceId: 'ws-2', isActive: true, createdAt: daysAgo(45) },
  { id: 'u-6', email: 'agent5@revra.test', password: 'password', name: 'Michael Chang', role: 'agent', workspaceId: 'ws-2', isActive: true, createdAt: daysAgo(30) },
  { id: 'u-7', email: 'agent6@revra.test', password: 'password', name: 'Lisa Park', role: 'agent', workspaceId: 'ws-2', isActive: true, createdAt: daysAgo(20) },
  { id: 'u-8', email: 'admin2@revra.test', password: 'password', name: 'James Rodriguez', role: 'admin', workspaceId: 'ws-2', isActive: true, createdAt: daysAgo(45) },

  // Super Admin
  { id: 'u-super', email: 'super@revra.test', password: 'password', name: 'Platform Admin', role: 'super_admin', workspaceId: null, isActive: true, createdAt: daysAgo(180) },
];

// ============ Leads ============

function generateLeads(): Lead[] {
  const states = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
  const coverages: Lead['coverageType'][] = ['Medicare', 'ACA', 'Final Expense', 'Life', 'Group Health'];
  const sources: Lead['source'][] = ['meta_ads', 'manual', 'csv_import', 'referral'];
  const firstNames = ['Michael', 'Sarah', 'Emily', 'Marcus', 'Jennifer', 'David', 'Lisa', 'James', 'Robert', 'Patricia', 'William', 'Linda', 'Thomas', 'Barbara', 'Christopher', 'Elizabeth', 'Daniel', 'Susan', 'Matthew', 'Jessica', 'Anthony', 'Karen', 'Joseph', 'Nancy', 'Charles', 'Betty', 'Steven', 'Helen', 'Andrew', 'Sandra', 'Edward', 'Donna', 'Brian', 'Carol', 'Ronald', 'Michelle', 'Timothy', 'Amanda', 'Jason', 'Dorothy', 'Jeffrey', 'Sharon', 'Ryan', 'Nancy', 'Jacob', 'Lisa', 'Gary', 'Sharon', 'Nicholas', 'Sandra'];
  const lastNames = ['Roberts', 'Williams', 'Chen', 'Torres', 'Smith', 'Johnson', 'Brown', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Perez', 'Hall', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Campbell', 'Mitchell', 'Robertson', 'Jones', 'Turner', 'Phillips', 'Evans', 'Parker', 'Edwards', 'Collins', 'Stewart'];

  const leads: Lead[] = [];
  const n = now;

  // Distribution across stages (more in early stages, fewer in late stages)
  const stageDistribution: Record<string, number> = {
    'stage-1': 8,  // New Lead
    'stage-2': 5,  // Attempting Contact
    'stage-3': 6,  // Contacted
    'stage-4': 4,  // Needs Analysis
    'stage-5': 5,  // Quote Sent
    'stage-6': 4,  // Application Submitted
    'stage-7': 3,  // In Underwriting
    'stage-8': 8,  // Bound / Policy Active
    'stage-9': 3,  // Closed Lost
    'stage-10': 4, // Renewal Due
    'stage-11': 2, // Lapsed
  };

  let leadIndex = 0;
  for (const [stageId, count] of Object.entries(stageDistribution)) {
    for (let i = 0; i < count; i++) {
      const firstName = firstNames[leadIndex % firstNames.length];
      const lastName = lastNames[(leadIndex * 3) % lastNames.length];
      const state = states[leadIndex % states.length];
      const coverage = coverages[leadIndex % coverages.length];
      const source = sources[leadIndex % sources.length];
      const assignedAgent = leadIndex % 4 === 0 ? null : `u-${(leadIndex % 3) + 1}`;
      const workspaceId = 'ws-1';

      const daysInStage = Math.floor(Math.random() * 14) + 1;
      const enteredStageAt = n() - daysInStage * 24 * 60 * 60 * 1000;

      let score = Math.floor(Math.random() * 40) + 60;
      if (stageId === 'stage-8') score = Math.floor(Math.random() * 20) + 80;
      if (stageId === 'stage-9') score = Math.floor(Math.random() * 30) + 20;

      leads.push({
        id: `lead-${leadIndex + 1}`,
        workspaceId,
        assignedAgentId: assignedAgent,
        fullName: `${firstName} ${lastName}`,
        phonePrimary: `(555) ${String(100 + leadIndex).padStart(3, '0')}-${String(1000 + leadIndex * 7).slice(-4)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        dateOfBirth: `${1950 + (leadIndex % 35)}-${String((leadIndex % 12) + 1).padStart(2, '0')}-${String((leadIndex % 28) + 1).padStart(2, '0')}`,
        age: 50 + (leadIndex % 35),
        state,
        coverageType: coverage,
        currentCarrier: leadIndex % 3 === 0 ? 'UnitedHealthcare' : leadIndex % 3 === 1 ? 'Blue Cross' : undefined,
        policyRenewalDate: coverage === 'Medicare' ? '2026-10-01' : undefined,
        monthlyBudget: [150, 200, 250, 300, 400, 500][leadIndex % 6],
        score,
        scoreFactors: score >= 80 ? [
          { factor: 'Medicare coverage in high-demand state', impact: '+20 pts', points: 20 },
          { factor: 'Budget $300+/month', impact: '+15 pts', points: 15 },
          { factor: 'Recent engagement with outreach', impact: '+10 pts', points: 10 },
        ] : score >= 50 ? [
          { factor: 'Active coverage interest', impact: '+8 pts', points: 8 },
          { factor: 'Medicare lead', impact: '+12 pts', points: 12 },
        ] : [
          { factor: 'Limited budget', impact: '-10 pts', points: -10 },
          { factor: 'No recent engagement', impact: '-8 pts', points: -8 },
        ],
        source,
        exclusivity: source === 'meta_ads' ? 'exclusive' : 'shared',
        outcome: stageId === 'stage-8' ? 'won' : stageId === 'stage-9' ? 'lost' : stageId === 'stage-11' ? 'lapsed' : 'pending',
        tags: source === 'meta_ads' ? ['meta', coverage.toLowerCase()] : source === 'referral' ? ['referral'] : [],
        pipeline: { stageId, enteredStageAt },
        notes: leadIndex % 5 === 0 ? 'Interested in comprehensive coverage. Callback requested.' : undefined,
        createdAt: n() - (60 + leadIndex) * 24 * 60 * 60 * 1000,
        updatedAt: n() - daysInStage * 24 * 60 * 60 * 1000,
      });
      leadIndex++;
    }
  }

  // Add some leads to workspace 2
  for (let i = 0; i < 15; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[(i * 7) % lastNames.length];
    leads.push({
      id: `lead-ws2-${i + 1}`,
      workspaceId: 'ws-2',
      assignedAgentId: i % 3 === 0 ? null : `u-${(i % 3) + 5}`,
      fullName: `${firstName} ${lastName}`,
      phonePrimary: `(555) ${String(200 + i).padStart(3, '0')}-${String(2000 + i * 3).slice(-4)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      state: states[i % states.length],
      coverageType: coverages[i % coverages.length],
      score: Math.floor(Math.random() * 40) + 60,
      source: sources[i % sources.length],
      exclusivity: 'shared',
      outcome: 'pending',
      tags: [],
      pipeline: { stageId: 'stage-1', enteredStageAt: n() - i * 24 * 60 * 60 * 1000 },
      createdAt: n() - (30 + i) * 24 * 60 * 60 * 1000,
      updatedAt: n() - i * 24 * 60 * 60 * 1000,
    });
  }

  return leads;
}

export const LEADS: Lead[] = generateLeads();

// ============ Conversations & Messages ============

function generateConversations(): { conversations: Conversation[]; messages: Message[] } {
  const conversations: Conversation[] = [];
  const messages: Message[] = [];
  const ws1Leads = LEADS.filter(l => l.workspaceId === 'ws-1').slice(0, 10);

  ws1Leads.forEach((lead, idx) => {
    if (idx >= 5) return; // Only create convos for first 5 leads

    const convId = `conv-${idx + 1}`;
    const isActive = idx === 0;

    conversations.push({
      id: convId,
      leadId: lead.id,
      aiActive: idx < 3,
      status: isActive ? 'active' : 'active',
      lastMessageAt: now() - idx * 2 * 60 * 60 * 1000,
      createdAt: now() - (10 + idx) * 24 * 60 * 60 * 1000,
    });

    const messagePairs = [
      {
        direction: 'outbound' as const,
        senderType: 'agent' as const,
        content: `Hi ${lead.fullName.split(' ')[0]}, this is Alex from RevRa. I wanted to follow up on your Medicare Advantage inquiry. Do you have a few minutes to chat?`,
        status: 'delivered' as const,
        ago: (10 + idx) * 24,
      },
      {
        direction: 'inbound' as const,
        senderType: 'lead' as const,
        content: idx === 0
          ? "That sounds perfect. Can we schedule a viewing for the property on Oak Street this Thursday afternoon?"
          : idx === 1
          ? "Yes! I've been looking at your options. Can you send over the quote details?"
          : "Sure, I have about 15 minutes available tomorrow afternoon.",
        status: 'read' as const,
        ago: (9 + idx) * 24,
      },
      {
        direction: 'outbound' as const,
        senderType: 'agent' as const,
        content: `Great to hear from you! I've attached the detail sheets here. Let me know if you'd like to bundle these into a single viewing trip.`,
        status: 'delivered' as const,
        ago: (8 + idx) * 24,
      },
      {
        direction: 'inbound' as const,
        senderType: 'lead' as const,
        content: idx === 0 ? "That sounds perfect. Can we schedule a viewing for Thursday afternoon?" : "I'll review and get back to you by end of week.",
        status: 'delivered' as const,
        ago: idx * 2,
      },
    ];

    messagePairs.forEach((msg, midx) => {
      messages.push({
        id: `${convId}-msg-${midx + 1}`,
        conversationId: convId,
        direction: msg.direction,
        channel: 'sms',
        senderType: msg.senderType,
        content: msg.content,
        status: msg.status,
        createdAt: now() - msg.ago * 60 * 60 * 1000,
      });
    });
  });

  return { conversations, messages };
}

export const { conversations: CONVERSATIONS_DATA, messages: MESSAGES_DATA } = generateConversations();

// ============ Appointments ============

function generateAppointments(): Appointment[] {
  const appointments: Appointment[] = [];
  const ws1Leads = LEADS.filter(l => l.workspaceId === 'ws-1' && l.assignedAgentId);

  // Today's appointments
  for (let i = 0; i < 3; i++) {
    const lead = ws1Leads[i];
    const hour = 9 + i * 3;
    appointments.push({
      id: `apt-${i + 1}`,
      leadId: lead.id,
      agentId: lead.assignedAgentId!,
      title: `${lead.coverageType} Discovery Call`,
      scheduledAt: new Date().setHours(hour, 0, 0, 0),
      duration: 30,
      type: 'phone',
      status: i === 1 ? 'confirmed' : 'pending',
      aiPreMeetingBrief: i === 1 ? `Key talking points for ${lead.fullName}: Medicare Advantage open enrollment timeline, budget considerations, current carrier alternatives.` : undefined,
      reminder24hSent: true,
      reminder1hSent: false,
      createdAt: daysAgo(2),
    });
  }

  // Tomorrow's appointments
  for (let i = 0; i < 2; i++) {
    const lead = ws1Leads[i + 3];
    appointments.push({
      id: `apt-tomorrow-${i + 1}`,
      leadId: lead.id,
      agentId: lead.assignedAgentId!,
      title: `${lead.coverageType} Quote Review`,
      scheduledAt: new Date(Date.now() + 86400000).setHours(10 + i * 4, 0, 0, 0),
      duration: 45,
      type: 'video',
      meetingLink: 'https://meet.revra.test/abc123',
      status: 'pending',
      reminder24hSent: false,
      reminder1hSent: false,
      createdAt: daysAgo(1),
    });
  }

  // Past appointments
  for (let i = 0; i < 5; i++) {
    const lead = ws1Leads[i + 6];
    appointments.push({
      id: `apt-past-${i + 1}`,
      leadId: lead.id,
      agentId: lead.assignedAgentId!,
      title: `${lead.coverageType} Follow-up`,
      scheduledAt: daysAgo(i + 3),
      duration: 30,
      type: 'phone',
      status: 'completed',
      notes: 'Discussed coverage options and timeline.',
      reminder24hSent: true,
      reminder1hSent: true,
      createdAt: daysAgo(i + 10),
    });
  }

  return appointments;
}

export const APPOINTMENTS: Appointment[] = generateAppointments();

// ============ Tasks ============

function generateTasks(): Task[] {
  return [
    { id: 'task-1', leadId: 'lead-1', agentId: 'u-1', title: 'Follow up with Michael Roberts', type: 'follow_up', priority: 'high', dueAt: now() + 2 * 60 * 60 * 1000, status: 'pending', createdAt: daysAgo(1) },
    { id: 'task-2', leadId: 'lead-2', agentId: 'u-1', title: 'Send Medicare quote to Sarah Williams', type: 'send_info', priority: 'medium', dueAt: now() + 24 * 60 * 60 * 1000, status: 'pending', createdAt: daysAgo(2) },
    { id: 'task-3', leadId: 'lead-3', agentId: 'u-2', title: 'Schedule needs analysis for Emily Chen', type: 'callback', priority: 'high', dueAt: now() + 4 * 60 * 60 * 1000, status: 'pending', createdAt: daysAgo(1) },
    { id: 'task-4', leadId: 'lead-4', agentId: 'u-1', title: 'Review Application for Marcus Pierce', type: 'follow_up', priority: 'urgent', dueAt: now() + 1 * 60 * 60 * 1000, status: 'pending', createdAt: daysAgo(0) },
    { id: 'task-5', leadId: 'lead-5', agentId: 'u-1', title: 'Re-engage lapsed lead - Michael Roberts', type: 'reactivation', priority: 'medium', dueAt: daysFromNow(2), status: 'pending', createdAt: daysAgo(3) },
  ];
}

export const TASKS: Task[] = generateTasks();

// ============ Discussions ============

function generateDiscussions(): DiscussionChannel[] {
  return [
    { id: 'ch-general', workspaceId: 'ws-1', type: 'channel', name: 'general', unreadCount: 0, lastMessageAt: now() - 2 * 60 * 60 * 1000, createdAt: daysAgo(90) },
    { id: 'ch-medicare', workspaceId: 'ws-1', type: 'channel', name: 'medicare-tips', unreadCount: 2, lastMessageAt: now() - 30 * 60 * 1000, createdAt: daysAgo(60) },
    { id: 'ch-leads', workspaceId: 'ws-1', type: 'channel', name: 'leads-hotline', unreadCount: 3, lastMessageAt: now() - 60 * 60 * 1000, createdAt: daysAgo(45) },
    { id: 'ch-q3', workspaceId: 'ws-1', type: 'channel', name: 'q3-strategy', unreadCount: 0, lastMessageAt: daysAgo(2), createdAt: daysAgo(30) },
    { id: 'ch-dm-1', workspaceId: 'ws-1', type: 'dm', name: 'Sarah Jenkins', participants: ['u-1', 'u-2'], unreadCount: 1, lastMessageAt: now() - 15 * 60 * 1000, createdAt: daysAgo(20) },
  ];
}

export const DISCUSSIONS: DiscussionChannel[] = generateDiscussions();

export const DISCUSSION_MESSAGES: DiscussionMessage[] = [
  { id: 'dm-1', channelId: 'ch-medicare', authorId: 'u-4', type: 'text', content: 'Team, reminder that AEP starts October 15th. Let\'s make sure all our Medicare leads are staged properly.', mentions: [], reactions: { '👍': ['u-1', 'u-2', 'u-3'] }, createdAt: now() - 60 * 60 * 1000 },
  { id: 'dm-2', channelId: 'ch-medicare', authorId: 'u-1', type: 'text', content: 'Good point David. I have 4 Medicare leads in Needs Analysis. Should I prioritize them this week?', mentions: ['u-4'], reactions: {}, createdAt: now() - 45 * 60 * 1000 },
  { id: 'dm-3', channelId: 'ch-medicare', authorId: 'u-4', type: 'text', content: '@Alex Mercer yes, absolutely. The ones with scores above 80 should be your focus.', mentions: ['u-1'], reactions: { '✅': ['u-1'] }, createdAt: now() - 30 * 60 * 1000 },
  { id: 'dm-4', channelId: 'ch-general', authorId: 'u-2', type: 'text', content: 'Anyone available for a quick peer review on my quote for TechCorp Solutions? New to the group health product.', mentions: [], reactions: {}, createdAt: now() - 2 * 60 * 60 * 1000 },
];

// ============ Subscriptions ============

export const SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub-1', workspaceId: 'ws-1', planId: 'plan-growth', status: 'active', currentPeriodStart: now() - 3 * 24 * 60 * 60 * 1000, currentPeriodEnd: daysFromNow(4), cancelAtPeriodEnd: false },
  { id: 'sub-2', workspaceId: 'ws-2', planId: 'plan-starter', status: 'active', currentPeriodStart: now() - 10 * 24 * 60 * 60 * 1000, currentPeriodEnd: daysFromNow(3), cancelAtPeriodEnd: false },
];

// ============ Workflows ============

export const WORKFLOWS: Workflow[] = [
  {
    id: 'wf-1',
    workspaceId: 'ws-1',
    name: 'Medicare Follow-Up Sequence',
    description: 'Auto-follow-up sequence for Medicare leads after initial contact',
    isActive: true,
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Lead Assigned', config: { type: 'lead_assigned' }, position: { x: 100, y: 100 } },
      { id: 'n2', type: 'delay', label: 'Wait 24 hours', config: { duration: 24, unit: 'hours' as const }, position: { x: 300, y: 100 } },
      { id: 'n3', type: 'condition', label: 'No Reply', config: { field: 'reply_received', operator: 'equals' as const, value: false }, position: { x: 500, y: 100 } },
      { id: 'n4', type: 'action', label: 'Send SMS', config: { type: 'send_sms', template: 'follow_up_1' }, position: { x: 700, y: 100 } },
      { id: 'n5', type: 'delay', label: 'Wait 48 hours', config: { duration: 48, unit: 'hours' as const }, position: { x: 900, y: 100 } },
      { id: 'n6', type: 'action', label: 'Create Task', config: { type: 'create_task', title: 'Manual follow-up required', priority: 'high' }, position: { x: 1100, y: 100 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
      { id: 'e5', source: 'n5', target: 'n6' },
    ],
    effectivenessScore: 0.72,
    totalRuns: 45,
    successfulRuns: 32,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(5),
  },
  {
    id: 'wf-2',
    workspaceId: 'ws-1',
    name: 'Hot Lead Escalation',
    description: 'Immediate notification when a lead scores 85+',
    isActive: true,
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Lead Assigned', config: { type: 'lead_assigned' }, position: { x: 100, y: 100 } },
      { id: 'n2', type: 'condition', label: 'Score >= 85', config: { field: 'score', operator: 'greater_than' as const, value: 85 }, position: { x: 300, y: 100 } },
      { id: 'n3', type: 'action', label: 'Create Urgent Task', config: { type: 'create_task', title: 'Hot lead - immediate follow-up needed', priority: 'urgent' }, position: { x: 500, y: 100 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ],
    effectivenessScore: 0.88,
    totalRuns: 12,
    successfulRuns: 10,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  },
];

// ============ Emma AI Campaigns ============

export const EMMA_CAMPAIGNS: EmmaCampaign[] = [
  {
    id: 'emma-1',
    workspaceId: 'ws-1',
    name: 'Medicare AEP Follow-Up',
    coverageType: 'Medicare',
    targetStages: ['stage-5', 'stage-6'],
    targetAgentIds: ['u-1', 'u-2', 'u-3'],
    script: 'Hello, this is Emma from RevRa. I\'m calling regarding your Medicare Advantage coverage. Do you have a few minutes to discuss your options?',
    maxRetries: 2,
    voicemailBehavior: 'leave',
    isActive: true,
    createdAt: daysAgo(15),
  },
];

export const EMMA_QUEUE: EmmaQueueItem[] = [
  { id: 'emma-q-1', leadId: 'lead-2', campaignId: 'emma-1', status: 'queued', scheduledAt: now() + 30 * 60 * 1000, createdAt: now() - 60 * 60 * 1000 },
  { id: 'emma-q-2', leadId: 'lead-5', campaignId: 'emma-1', status: 'completed', resultSummary: 'Lead answered, expressed interest in Medicare Advantage. Appointment requested for Thursday.', transcript: 'Emma: Hello, this is Emma from RevRa...', createdAt: now() - 2 * 60 * 60 * 1000 },
  { id: 'emma-q-3', leadId: 'lead-8', campaignId: 'emma-1', status: 'voicemail', createdAt: now() - 4 * 60 * 60 * 1000 },
];

// ============ Notifications ============

export const NOTIFICATIONS: Notification[] = [
  { id: 'notif-1', userId: 'u-1', type: 'lead_assigned', title: 'New Lead Assigned', body: 'Michael Roberts has been assigned to you from the lead pool.', read: false, data: { leadId: 'lead-1' }, createdAt: now() - 30 * 60 * 1000 },
  { id: 'notif-2', userId: 'u-1', type: 'message_received', title: 'New Message', body: 'Sarah Jenkins replied to your message.', read: true, data: { leadId: 'lead-1', conversationId: 'conv-1' }, createdAt: now() - 2 * 60 * 60 * 1000 },
  { id: 'notif-3', userId: 'u-1', type: 'appointment_reminder', title: 'Appointment in 1 hour', body: 'Medicare Discovery Call with Sarah Williams at 11:00 AM.', read: false, data: { appointmentId: 'apt-2' }, createdAt: now() - 60 * 60 * 1000 },
  { id: 'notif-4', userId: 'u-1', type: 'ai_suggestion', title: 'AI Suggestion', body: 'Consider offering a Q3 discount to Omega Corp. Their engagement dropped 40%.', read: false, data: { leadId: 'lead-3' }, createdAt: now() - 45 * 60 * 1000 },
];

// ============ Activities ============

export const ACTIVITIES: Activity[] = [
  { id: 'act-1', leadId: 'lead-1', userId: 'u-1', type: 'lead_created', title: 'Lead created', description: 'Michael Roberts added from Meta Ads campaign', createdAt: daysAgo(10) },
  { id: 'act-2', leadId: 'lead-1', userId: 'u-1', type: 'stage_changed', title: 'Stage changed to Attempting Contact', description: 'Moved from New Lead to Attempting Contact', createdAt: daysAgo(8) },
  { id: 'act-3', leadId: 'lead-1', userId: 'u-1', type: 'call_completed', title: 'Call completed', description: 'Duration: 8 min, Outcome: Callback Requested', metadata: { duration: 480, outcome: 'callback_requested' }, createdAt: daysAgo(5) },
  { id: 'act-4', leadId: 'lead-1', userId: 'u-1', type: 'sms_sent', title: 'SMS sent', description: 'Follow-up message sent after call', createdAt: daysAgo(4) },
  { id: 'act-5', leadId: 'lead-1', userId: 'u-1', type: 'ai_summary', title: 'AI call summary generated', description: 'Lead interested in Medicare Advantage. Budget $300-400/month. Scheduled callback for Thursday.', createdAt: daysAgo(5) },
  { id: 'act-6', leadId: 'lead-1', userId: 'u-1', type: 'stage_changed', title: 'Stage changed to Needs Analysis', description: 'Moved from Attempting Contact to Needs Analysis', createdAt: daysAgo(3) },
];

// ============ Call Records ============

export const CALLS: Call[] = [
  { id: 'call-1', leadId: 'lead-1', agentId: 'u-1', direction: 'outbound', status: 'completed', outcome: 'contacted', duration: 480, emmaAi: false, aiSummary: 'Lead expressed strong interest in Medicare Advantage. Current coverage with UHC expires Nov 15. Requested callback for Thursday 2pm to discuss Humana options.', transcript: 'Agent: Hi Michael, this is Alex... Lead: Yes, I\'ve been meaning to call...', createdAt: daysAgo(5), endedAt: daysAgo(5) + 480000 },
  { id: 'call-2', leadId: 'lead-2', agentId: 'u-1', direction: 'outbound', status: 'completed', outcome: 'voicemail', duration: 45, emmaAi: false, createdAt: daysAgo(3), endedAt: daysAgo(3) + 45000 },
  { id: 'call-3', leadId: 'lead-3', agentId: 'u-2', direction: 'outbound', status: 'completed', outcome: 'not_interested', duration: 180, emmaAi: false, createdAt: daysAgo(2), endedAt: daysAgo(2) + 180000 },
  { id: 'call-4', leadId: 'lead-8', agentId: 'u-1', direction: 'outbound', status: 'completed', outcome: 'contacted', duration: 720, emmaAi: true, aiSummary: 'Emma AI successfully connected with lead. Lead expressed interest in renewing their Final Expense policy. Appointment booked for Thursday.', transcript: 'Emma: Hello, this is Emma from RevRa...', createdAt: daysAgo(1), endedAt: daysAgo(1) + 720000 },
];
