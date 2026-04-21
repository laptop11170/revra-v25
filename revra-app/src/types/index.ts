// ============================================================
// RevRa CRM - TypeScript Type Definitions
// All entities from PRD2 Section 15
// ============================================================

import { v4 as uuid } from 'uuid';

// ============ Core Entities ============

export interface Workspace {
  id: string;
  name: string;
  plan: PlanTier;
  aiCredits: number;
  aiCreditTransactions: AICreditTransaction[];
  integrations: WorkspaceIntegrations;
  createdAt: number;
}

export type PlanTier = 'starter' | 'growth' | 'scale' | 'enterprise';

export interface WorkspaceIntegrations {
  twilio?: { accountSid?: string; authToken?: string; phoneNumber?: string };
  meta?: { accessToken?: string; adAccountId?: string };
  emmaAi?: { apiKey?: string };
  stripe?: { customerId?: string; subscriptionId?: string };
  llm?: { apiKey?: string; model?: string };
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  workspaceId: string | null;
  isActive: boolean;
  createdAt: number;
}

export type UserRole = 'agent' | 'admin' | 'viewer' | 'super_admin';

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string | null;
  expiresAt: number;
}

// ============ Lead Entities ============

export type CoverageType = 'ACA' | 'Medicare' | 'Final Expense' | 'Life' | 'Group Health';
export type LeadOutcome = 'pending' | 'won' | 'lost' | 'lapsed';
export type LeadSource = 'meta_ads' | 'manual' | 'csv_import' | 'referral';

export interface Lead {
  id: string;
  workspaceId: string;
  assignedAgentId: string | null;
  fullName: string;
  phonePrimary: string;
  phoneSecondary?: string;
  email?: string;
  dateOfBirth?: string;
  age?: number;
  state: string;
  county?: string;
  homeAddress?: string;
  coverageType: CoverageType;
  currentCarrier?: string;
  policyRenewalDate?: string;
  preExistingConditions?: string;
  monthlyBudget?: number;
  householdSize?: number;
  dependents?: number;
  incomeRange?: string;
  score: number;
  scoreFactors?: ScoreFactor[];
  source: LeadSource;
  exclusivity: 'exclusive' | 'shared';
  outcome: LeadOutcome;
  tags: string[];
  pipeline: LeadPipeline;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface ScoreFactor {
  factor: string;
  impact: string;
  points: number;
}

export interface LeadPipeline {
  stageId: string;
  enteredStageAt: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  slug: string;
  color: string;
  position: number;
  triggerConfig?: Record<string, unknown>;
}

// ============ Communication Entities ============

export type ConversationStatus = 'active' | 'paused' | 'closed' | 'agent_takeover';
export type MessageChannel = 'sms' | 'email' | 'emma_ai';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageSenderType = 'agent' | 'ai' | 'lead';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface Conversation {
  id: string;
  leadId: string;
  aiActive: boolean;
  status: ConversationStatus;
  lastMessageAt: number;
  createdAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  channel: MessageChannel;
  senderType: MessageSenderType;
  content: string;
  status: MessageStatus;
  createdAt: number;
}

export type CallOutcome =
  | 'contacted'
  | 'no_answer'
  | 'voicemail'
  | 'not_interested'
  | 'wrong_number'
  | 'dead_line'
  | 'callback_requested';

export interface Call {
  id: string;
  leadId: string;
  agentId: string;
  direction: 'inbound' | 'outbound';
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  outcome?: CallOutcome;
  duration?: number;
  recordingUrl?: string;
  transcript?: string;
  aiSummary?: string;
  notes?: string;
  emmaAi: boolean;
  createdAt: number;
  endedAt?: number;
}

// ============ Scheduling Entities ============

export type AppointmentType = 'phone' | 'video' | 'in_person';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';

export interface Appointment {
  id: string;
  leadId: string;
  agentId: string;
  title: string;
  scheduledAt: number;
  duration: 15 | 30 | 45 | 60;
  type: AppointmentType;
  status: AppointmentStatus;
  meetingLink?: string;
  notes?: string;
  aiPreMeetingBrief?: string;
  reminder24hSent: boolean;
  reminder1hSent: boolean;
  createdAt: number;
}

// ============ Task Entities ============

export type TaskType = 'follow_up' | 'callback' | 'send_info' | 'reactivation' | 'custom';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  leadId: string;
  agentId: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  dueAt?: number;
  status: TaskStatus;
  createdAt: number;
}

// ============ Workflow Entities ============

export type WorkflowNodeType = 'trigger' | 'condition' | 'action' | 'delay';

export interface WorkflowTrigger {
  type: 'lead_assigned' | 'stage_changed' | 'no_reply' | 'appointment_booked' | 'sale_closed' | 'renewal_due';
  config?: Record<string, unknown>;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: unknown;
  logic?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'send_sms' | 'send_email' | 'create_task' | 'move_stage' | 'add_tag' | 'remove_tag' | 'emma_ai';
  template?: string;
  title?: string;
  priority?: string;
  stageId?: string;
  tag?: string;
  config?: Record<string, unknown>;
}

export interface WorkflowDelay {
  duration: number;
  unit: 'minutes' | 'hours' | 'days';
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  config: WorkflowTrigger | WorkflowCondition | WorkflowAction | WorkflowDelay;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  isActive: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  effectivenessScore?: number;
  totalRuns?: number;
  successfulRuns?: number;
  createdAt: number;
  updatedAt: number;
}

// ============ Discussions Entities ============

export interface DiscussionChannel {
  id: string;
  workspaceId: string;
  type: 'channel' | 'dm';
  name: string;
  participants?: string[];
  unreadCount: number;
  lastMessageAt?: number;
  createdAt: number;
}

export interface DiscussionMessage {
  id: string;
  channelId: string;
  authorId: string;
  type: 'text' | 'voice_note';
  content: string;
  voiceNoteUrl?: string;
  voiceNoteDuration?: number;
  mentions: string[];
  threadId?: string;
  reactions: Record<string, string[]>;
  createdAt: number;
}

// ============ AI Entities ============

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AIContext {
  agentId: string;
  agentName: string;
  workspaceId: string;
  currentTab: string;
  currentLeadId?: string;
  pipelineStats?: Record<string, number>;
  todayAppointments?: number;
}

export interface MorningBriefingSection {
  summary: string;
  items: BriefingItem[];
  color: string;
  icon: string;
}

export interface BriefingItem {
  leadId?: string;
  leadName: string;
  score?: number;
  stage?: string;
  coverageType?: CoverageType;
  lastActivity?: string;
  daysOverdue?: number;
  actionLabel?: string;
  appointmentId?: string;
  appointmentTitle?: string;
  appointmentTime?: string;
  aiSuggestion?: string;
  priority?: string;
}

export interface MorningBriefing {
  id: string;
  agentId: string;
  date: string;
  generatedAt: number;
  sections: {
    newLeads: MorningBriefingSection;
    overdueFollowUps: MorningBriefingSection;
    dueToday: MorningBriefingSection;
    hotLeads: MorningBriefingSection;
    appointmentsToday: MorningBriefingSection;
    renewalsThisMonth: MorningBriefingSection;
    aiSuggestions: MorningBriefingSection;
  };
}

export interface SMSDraft {
  draft: string;
  tone: 'friendly' | 'professional' | 'urgent';
  confidence: number;
  leadId: string;
}

export interface LeadScoreResult {
  score: number;
  tier: 'hot' | 'warm' | 'cold';
  factors: ScoreFactor[];
}

export interface PreCallBrief {
  talkingPoints: string[];
  keyQuestions: string[];
  anticipatedObjections: string[];
  coverageRecommendation: string;
  leadSummary: string;
}

export interface PostCallSummary {
  summary: string;
  keyOutcomes: string[];
  recommendedNextAction: string;
}

export interface ColumnMapping {
  csvHeader: string;
  sampleValue: string;
  revraField: string;
  confidence: number;
  status: 'high' | 'medium' | 'low' | 'unmapped' | 'ignored';
}

// ============ Subscription & Billing ============

export interface Plan {
  id: string;
  name: string;
  weeklyPrice: number;
  monthlyPrice: number;
  weeklyLeadLimit: number;
  monthlyAiCredits: number;
  features: string[];
  isActive: boolean;
}

export interface Subscription {
  id: string;
  workspaceId: string;
  planId: string;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export interface AICreditTransaction {
  action: string;
  amount: number;
  timestamp: number;
  description?: string;
}

// ============ Emma AI Entities ============

export interface EmmaCampaign {
  id: string;
  workspaceId: string;
  name: string;
  coverageType: CoverageType;
  targetStages: string[];
  targetAgentIds: string[];
  script?: string;
  maxRetries: number;
  voicemailBehavior: 'leave' | 'skip';
  isActive: boolean;
  createdAt: number;
}

export interface EmmaQueueItem {
  id: string;
  leadId: string;
  campaignId: string;
  status: 'queued' | 'calling' | 'completed' | 'voicemail' | 'no_answer' | 'failed';
  scheduledAt?: number;
  resultSummary?: string;
  transcript?: string;
  createdAt: number;
}

// ============ Lead Share ============

export interface LeadShare {
  id: string;
  leadId: string;
  grantorId: string;
  granteeId: string;
  accessLevel: 'view' | 'edit';
  expiresAt: number;
  createdAt: number;
}

// ============ Notifications ============

export type NotificationType = 'lead_assigned' | 'message_received' | 'appointment_reminder' | 'ai_suggestion' | 'workflow_triggered';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: number;
}

// ============ Activity Log ============

export type ActivityType =
  | 'lead_created'
  | 'lead_updated'
  | 'stage_changed'
  | 'note_added'
  | 'call_completed'
  | 'sms_sent'
  | 'sms_received'
  | 'email_sent'
  | 'appointment_booked'
  | 'appointment_completed'
  | 'ai_summary'
  | 'share_created'
  | 'share_expired';

export interface Activity {
  id: string;
  leadId: string;
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

// ============ API Response Types ============

export interface APIResponse<T> {
  data: T;
  meta?: { total?: number; page?: number; pageSize?: number };
}

export interface APIError {
  error: string;
  code: string;
  details?: unknown;
}

// ============ Utility Types ============

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Factory function helpers
export function createId(): string {
  return uuid();
}

export function now(): number {
  return Date.now();
}

export function daysFromNow(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

export function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}
