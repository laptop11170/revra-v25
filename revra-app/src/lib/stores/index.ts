// ============================================================
// RevRa CRM - Zustand Stores (Mock Database)
// All state persisted to localStorage
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Session, Lead, User, Workspace, PipelineStage, Conversation,
  Message, Call, Appointment, Task, Workflow, DiscussionChannel,
  DiscussionMessage, Notification, Activity, MorningBriefing,
  AIMessage, EmmaQueueItem, EmmaCampaign, AICreditTransaction,
} from '@/types';
import {
  USERS, WORKSPACES, LEADS, PIPELINE_STAGES,
  CONVERSATIONS_DATA, MESSAGES_DATA, APPOINTMENTS, TASKS,
  WORKFLOWS, DISCUSSIONS, DISCUSSION_MESSAGES, SUBSCRIPTIONS,
  EMMA_CAMPAIGNS, EMMA_QUEUE, NOTIFICATIONS, ACTIVITIES, CALLS, PLANS,
} from '@/lib/db/seed';

// ============================================================
// Auth Store
// ============================================================

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkSession: () => void;
  getCurrentUser: () => User | null;
  getCurrentWorkspace: () => Workspace | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = USERS.find(
            (u) => u.email === email && u.password === password
          );
          if (!user) {
            set({ error: 'Invalid email or password', isLoading: false });
            return false;
          }
          const session: Session = {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            workspaceId: user.workspaceId,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          };
          set({ session, isLoading: false });
          return true;
        } catch {
          set({ error: 'Login failed', isLoading: false });
          return false;
        }
      },

      logout: () => set({ session: null, error: null }),

      checkSession: () => {
        const { session } = get();
        if (session && session.expiresAt < Date.now()) {
          set({ session: null });
        }
      },

      getCurrentUser: () => {
        const { session } = get();
        if (!session) return null;
        return USERS.find((u) => u.id === session.userId) || null;
      },

      getCurrentWorkspace: () => {
        const { session } = get();
        if (!session || !session.workspaceId) return null;
        return WORKSPACES.find((w) => w.id === session.workspaceId) || null;
      },
    }),
    { name: 'revra-auth', storage: createJSONStorage(() => localStorage) }
  )
);

// ============================================================
// Data Store
// ============================================================

interface DataState {
  // Leads
  leads: Lead[];
  createLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  moveLeadToStage: (leadId: string, stageId: string) => void;
  assignLead: (leadId: string, agentId: string | null) => void;

  // Pipeline
  stages: PipelineStage[];
  getStageName: (stageId: string) => string;

  // Conversations & Messages
  conversations: Conversation[];
  messages: Message[];
  createConversation: (leadId: string) => Conversation;
  sendMessage: (conversationId: string, content: string, senderType: Message['senderType'], channel?: Message['channel']) => Message;
  markMessagesRead: (conversationId: string) => void;
  getConversationByLeadId: (leadId: string) => Conversation | undefined;

  // Calls
  calls: Call[];
  createCall: (call: Omit<Call, 'id' | 'createdAt'>) => Call;
  updateCall: (id: string, updates: Partial<Call>) => void;

  // Appointments
  appointments: Appointment[];
  createAppointment: (apt: Omit<Appointment, 'id' | 'createdAt'>) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  // Tasks
  tasks: Task[];
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Workflows
  workflows: Workflow[];
  createWorkflow: (wf: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => Workflow;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;

  // Discussions
  channels: DiscussionChannel[];
  channelMessages: DiscussionMessage[];
  createChannel: (ch: Omit<DiscussionChannel, 'id' | 'createdAt'>) => DiscussionChannel;
  sendChannelMessage: (channelId: string, authorId: string, content: string, mentions?: string[], threadId?: string) => DiscussionMessage;
  markChannelRead: (channelId: string) => void;
  addReaction: (messageId: string, emoji: string, userId: string) => void;
  removeReaction: (messageId: string, emoji: string, userId: string) => void;

  // Emma AI
  emmaCampaigns: EmmaCampaign[];
  emmaQueue: EmmaQueueItem[];
  addToEmmaQueue: (item: Omit<EmmaQueueItem, 'id' | 'createdAt'>) => EmmaQueueItem;
  removeFromEmmaQueue: (id: string) => void;
  updateEmmaQueueItem: (id: string, updates: Partial<EmmaQueueItem>) => void;

  // Activities
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => Activity;

  // Subscriptions (read-only in prototype)
  subscriptions: typeof SUBSCRIPTIONS;

  // Plans (read-only)
  plans: typeof PLANS;

  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

let _idCounter = 10000;
const genId = () => `gen-${++_idCounter}`;

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      // Leads
      leads: LEADS,
      createLead: (lead) => {
        const newLead: Lead = {
          ...lead,
          id: genId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ leads: [...s.leads, newLead] }));
        get().addActivity({
          leadId: newLead.id,
          userId: newLead.assignedAgentId || '',
          type: 'lead_created',
          title: `Lead "${newLead.fullName}" created`,
        });
        return newLead;
      },
      updateLead: (id, updates) =>
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, ...updates, updatedAt: Date.now() } : l
          ),
        })),
      deleteLead: (id) =>
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, deletedAt: Date.now() } : l
          ),
        })),
      moveLeadToStage: (leadId, stageId) => {
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === leadId
              ? { ...l, pipeline: { stageId, enteredStageAt: Date.now() }, updatedAt: Date.now() }
              : l
          ),
        }));
        const lead = get().leads.find((l) => l.id === leadId);
        const stage = get().stages.find((st) => st.id === stageId);
        get().addActivity({
          leadId,
          userId: '',
          type: 'stage_changed',
          title: `Stage changed to ${stage?.name || stageId}`,
          description: lead ? `Lead "${lead.fullName}" moved to ${stage?.name}` : undefined,
        });
      },
      assignLead: (leadId, agentId) => {
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === leadId ? { ...l, assignedAgentId: agentId, updatedAt: Date.now() } : l
          ),
        }));
      },

      // Pipeline
      stages: PIPELINE_STAGES,
      getStageName: (stageId) => {
        const stage = get().stages.find((s) => s.id === stageId);
        return stage?.name || stageId;
      },

      // Conversations & Messages
      conversations: CONVERSATIONS_DATA,
      messages: MESSAGES_DATA,
      createConversation: (leadId) => {
        const conv: Conversation = {
          id: genId(),
          leadId,
          aiActive: true,
          status: 'active',
          lastMessageAt: Date.now(),
          createdAt: Date.now(),
        };
        set((s) => ({ conversations: [...s.conversations, conv] }));
        return conv;
      },
      sendMessage: (conversationId, content, senderType, channel = 'sms') => {
        const msg: Message = {
          id: genId(),
          conversationId,
          direction: senderType === 'lead' ? 'inbound' : 'outbound',
          channel,
          senderType,
          content,
          status: senderType === 'lead' ? 'delivered' : 'sent',
          createdAt: Date.now(),
        };
        set((s) => ({
          messages: [...s.messages, msg],
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, lastMessageAt: Date.now() } : c
          ),
        }));
        return msg;
      },
      markMessagesRead: (conversationId) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.conversationId === conversationId ? { ...m, status: 'read' } : m
          ),
        })),
      getConversationByLeadId: (leadId) =>
        get().conversations.find((c) => c.leadId === leadId),

      // Calls
      calls: CALLS,
      createCall: (call) => {
        const newCall: Call = { ...call, id: genId(), createdAt: Date.now() };
        set((s) => ({ calls: [...s.calls, newCall] }));
        get().addActivity({
          leadId: call.leadId,
          userId: call.agentId,
          type: 'call_completed',
          title: `Call ${call.direction === 'outbound' ? 'out' : 'in'}bound completed`,
          description: call.outcome ? `Outcome: ${call.outcome}` : undefined,
          metadata: call,
        });
        return newCall;
      },
      updateCall: (id, updates) =>
        set((s) => ({
          calls: s.calls.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      // Appointments
      appointments: APPOINTMENTS,
      createAppointment: (apt) => {
        const newApt: Appointment = { ...apt, id: genId(), createdAt: Date.now() };
        set((s) => ({ appointments: [...s.appointments, newApt] }));
        get().addActivity({
          leadId: apt.leadId,
          userId: apt.agentId,
          type: 'appointment_booked',
          title: `Appointment scheduled: ${apt.title}`,
        });
        return newApt;
      },
      updateAppointment: (id, updates) =>
        set((s) => ({
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),
      deleteAppointment: (id) =>
        set((s) => ({
          appointments: s.appointments.filter((a) => a.id !== id),
        })),

      // Tasks
      tasks: TASKS,
      createTask: (task) => {
        const newTask: Task = { ...task, id: genId(), createdAt: Date.now() };
        set((s) => ({ tasks: [...s.tasks, newTask] }));
        return newTask;
      },
      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      // Workflows
      workflows: WORKFLOWS,
      createWorkflow: (wf) => {
        const newWf: Workflow = {
          ...wf,
          id: genId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ workflows: [...s.workflows, newWf] }));
        return newWf;
      },
      updateWorkflow: (id, updates) =>
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w
          ),
        })),
      deleteWorkflow: (id) =>
        set((s) => ({ workflows: s.workflows.filter((w) => w.id !== id) })),

      // Discussions
      channels: DISCUSSIONS,
      channelMessages: DISCUSSION_MESSAGES,
      createChannel: (ch) => {
        const newCh: DiscussionChannel = {
          ...ch,
          id: genId(),
          unreadCount: 0,
          createdAt: Date.now(),
        };
        set((s) => ({ channels: [...s.channels, newCh] }));
        return newCh;
      },
      sendChannelMessage: (channelId, authorId, content, mentions = [], threadId) => {
        const msg: DiscussionMessage = {
          id: genId(),
          channelId,
          authorId,
          type: 'text',
          content,
          mentions,
          threadId,
          reactions: {},
          createdAt: Date.now(),
        };
        set((s) => ({
          channelMessages: [...s.channelMessages, msg],
          channels: s.channels.map((c) =>
            c.id === channelId ? { ...c, lastMessageAt: Date.now() } : c
          ),
        }));
        return msg;
      },
      markChannelRead: (channelId) =>
        set((s) => ({
          channels: s.channels.map((c) =>
            c.id === channelId ? { ...c, unreadCount: 0 } : c
          ),
        })),
      addReaction: (messageId, emoji, userId) =>
        set((s) => ({
          channelMessages: s.channelMessages.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  reactions: {
                    ...m.reactions,
                    [emoji]: [...(m.reactions[emoji] || []), userId],
                  },
                }
              : m
          ),
        })),
      removeReaction: (messageId, emoji, userId) =>
        set((s) => ({
          channelMessages: s.channelMessages.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  reactions: {
                    ...m.reactions,
                    [emoji]: (m.reactions[emoji] || []).filter((id) => id !== userId),
                  },
                }
              : m
          ),
        })),

      // Emma AI
      emmaCampaigns: EMMA_CAMPAIGNS,
      emmaQueue: EMMA_QUEUE,
      addToEmmaQueue: (item) => {
        const newItem: EmmaQueueItem = { ...item, id: genId(), createdAt: Date.now() };
        set((s) => ({ emmaQueue: [...s.emmaQueue, newItem] }));
        return newItem;
      },
      removeFromEmmaQueue: (id) =>
        set((s) => ({ emmaQueue: s.emmaQueue.filter((q) => q.id !== id) })),
      updateEmmaQueueItem: (id, updates) =>
        set((s) => ({
          emmaQueue: s.emmaQueue.map((q) => (q.id === id ? { ...q, ...updates } : q)),
        })),

      // Activities
      activities: ACTIVITIES,
      addActivity: (activity) => {
        const newAct: Activity = { ...activity, id: genId(), createdAt: Date.now() };
        set((s) => ({ activities: [newAct, ...s.activities] }));
        return newAct;
      },

      // Subscriptions & Plans (read-only, no state changes)
      subscriptions: SUBSCRIPTIONS,
      plans: PLANS,

      // Notifications
      notifications: NOTIFICATIONS,
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
    }),
    { name: 'revra-data', storage: createJSONStorage(() => localStorage) }
  )
);

// ============================================================
// AI Store
// ============================================================

interface AIState {
  chatHistory: AIMessage[];
  briefings: Record<string, MorningBriefing>;
  aiCredits: number;
  creditTransactions: AICreditTransaction[];
  addChatMessage: (msg: AIMessage) => void;
  clearChatHistory: () => void;
  deductCredits: (amount: number, action: string, description?: string) => boolean;
  loadBriefing: (agentId: string, briefing: MorningBriefing) => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      chatHistory: [],
      briefings: {},
      aiCredits: 4120,
      creditTransactions: [],

      addChatMessage: (msg) =>
        set((s) => ({ chatHistory: [...s.chatHistory.slice(-49), msg] })),

      clearChatHistory: () => set({ chatHistory: [] }),

      deductCredits: (amount, action, description) => {
        const { aiCredits } = get();
        if (aiCredits < amount) return false;
        set((s) => ({
          aiCredits: s.aiCredits - amount,
          creditTransactions: [
            ...s.creditTransactions,
            { action, amount, timestamp: Date.now(), description },
          ],
        }));
        return true;
      },

      loadBriefing: (agentId, briefing) =>
        set((s) => ({
          briefings: { ...s.briefings, [agentId]: briefing },
        })),
    }),
    { name: 'revra-ai', storage: createJSONStorage(() => localStorage) }
  )
);

// ============================================================
// Admin Store (Platform-wide data for super admin)
// ============================================================

interface AdminState {
  platformStats: {
    totalRevenue: number;
    activeWorkspaces: number;
    totalLeads: number;
    newLeadsThisMonth: number;
    activeCalls24h: number;
    revenueTrend: number;
  };
  networkHealth: {
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    avgResponseTime: number;
    services: Array<{ name: string; status: 'up' | 'down' | 'degraded'; responseTime?: number }>;
  };
}

export const useAdminStore = create<AdminState>()((set) => ({
  platformStats: {
    totalRevenue: 48320,
    activeWorkspaces: 12,
    totalLeads: 4829,
    newLeadsThisMonth: 347,
    activeCalls24h: 89,
    revenueTrend: 12.4,
  },
  networkHealth: {
    status: 'healthy',
    uptime: 99.7,
    avgResponseTime: 124,
    services: [
      { name: 'API Server', status: 'up', responseTime: 87 },
      { name: 'Database', status: 'up', responseTime: 23 },
      { name: 'AI Gateway', status: 'up', responseTime: 340 },
      { name: 'Twilio', status: 'up', responseTime: 156 },
      { name: 'Emma AI', status: 'up', responseTime: 890 },
      { name: 'Stripe', status: 'up', responseTime: 45 },
    ],
  },
}));
