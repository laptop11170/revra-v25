-- ============================================================
-- RevRa CRM — Supabase Database Schema
-- Run this in: Supabase SQL Editor > New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- WORKSACES
-- NOTE: id is text (e.g. 'ws-1') for readability, not UUID
-- ============================================================
create table if not exists workspaces (
  id text primary key,
  name text not null,
  plan text not null default 'growth' check (plan in ('starter', 'growth', 'scale', 'enterprise')),
  ai_credits integer not null default 1000,
  integrations jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- USERS (extends Supabase auth.users)
-- workspace_id is text to match workspaces.id
-- ============================================================
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  workspace_id text references workspaces(id) on delete set null,
  name text not null,
  role text not null default 'agent' check (role in ('agent', 'admin', 'viewer', 'super_admin')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create user profile when Supabase auth user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- PLANS (reference table — no workspace FK)
-- ============================================================
create table if not exists plans (
  id text primary key,
  name text not null,
  weekly_price numeric(10,2) not null,
  monthly_price numeric(10,2) not null,
  weekly_lead_limit integer not null,
  monthly_ai_credits integer not null,
  features text[] not null default '{}',
  is_active boolean default true,
  created_at timestamptz default now()
);

insert into plans (id, name, weekly_price, monthly_price, weekly_lead_limit, monthly_ai_credits, features) values
  ('plan-starter', 'Starter', 57.50, 250, 10, 1000, array['Leads', 'Pipeline', 'Inbox', 'Calendar', 'Basic AI']),
  ('plan-growth',  'Growth',  103.75, 450, 20, 5000, array['Everything in Starter', 'AI Command Center', 'Workflows', 'Emma AI', 'Advanced Analytics']),
  ('plan-scale',   'Scale',   184.00, 799, 40, 15000, array['Everything in Growth', 'Priority Support', 'Custom Integrations', 'API Access']),
  ('plan-enterprise','Enterprise', 0, 0, 0, 0, array['Everything in Scale', 'Dedicated Support', 'Custom Development', 'SLA'])
on conflict (id) do nothing;

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id text not null references workspaces(id) on delete cascade,
  plan_id text references plans(id),
  status text not null default 'active' check (status in ('trialing', 'active', 'past_due', 'cancelled', 'paused')),
  current_period_start timestamptz default now(),
  current_period_end timestamptz default now(),
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- AI CREDIT TRANSACTIONS
-- ============================================================
create table if not exists ai_credit_transactions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id text not null references workspaces(id) on delete cascade,
  action text not null,
  amount integer not null,
  description text,
  created_at timestamptz default now()
);

-- ============================================================
-- PIPELINE STAGES
-- workspace_id is nullable — null = platform-wide (all workspaces)
-- ============================================================
create table if not exists pipeline_stages (
  id text primary key,
  workspace_id text references workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  color text not null default '#b8c3ff',
  position integer not null default 0,
  created_at timestamptz default now()
);

insert into pipeline_stages (id, workspace_id, name, slug, color, position) values
  ('stage-1', null, 'New Lead', 'new_lead', '#b8c3ff', 1),
  ('stage-2', null, 'Attempting Contact', 'attempting_contact', '#b8c3ff', 2),
  ('stage-3', null, 'Contacted', 'contacted', '#eaddff', 3),
  ('stage-4', null, 'Needs Analysis', 'needs_analysis', '#8342f4', 4),
  ('stage-5', null, 'Quote Sent', 'quote_sent', '#b8c3ff', 5),
  ('stage-6', null, 'Application Submitted', 'application_submitted', '#dde1ff', 6),
  ('stage-7', null, 'In Underwriting', 'in_underwriting', '#d2bbff', 7),
  ('stage-8', null, 'Bound / Policy Active', 'bound', '#10b981', 8),
  ('stage-9', null, 'Closed Lost', 'closed_lost', '#ffb4ab', 9),
  ('stage-10', null, 'Renewal Due', 'renewal_due', '#fbbf24', 10),
  ('stage-11', null, 'Lapsed', 'lapsed', '#6b7280', 11)
on conflict (id) do nothing;

-- ============================================================
-- LEADS
-- ============================================================
create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  workspace_id text not null references workspaces(id) on delete cascade,
  assigned_agent_id uuid references users(id) on delete set null,
  full_name text not null,
  phone_primary text,
  phone_secondary text,
  email text,
  date_of_birth date,
  age integer,
  state text,
  county text,
  home_address text,
  coverage_type text check (coverage_type in ('ACA', 'Medicare', 'Final Expense', 'Life', 'Group Health')),
  current_carrier text,
  policy_renewal_date date,
  pre_existing_conditions text,
  monthly_budget numeric(10,2),
  household_size integer,
  dependents integer,
  income_range text,
  score integer default 50,
  score_factors jsonb default '[]',
  source text default 'manual' check (source in ('meta_ads', 'manual', 'csv_import', 'referral')),
  exclusivity text default 'shared' check (exclusivity in ('exclusive', 'shared')),
  outcome text default 'pending' check (outcome in ('pending', 'won', 'lost', 'lapsed')),
  tags text[] default '{}',
  stage_id text references pipeline_stages(id),
  entered_stage_at timestamptz default now(),
  days_in_stage integer default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  workspace_id text not null references workspaces(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  channel text not null default 'sms' check (channel in ('sms', 'email')),
  ai_active boolean default true,
  status text default 'active' check (status in ('active', 'paused', 'closed', 'agent_takeover')),
  last_message text,
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  channel text not null default 'sms' check (channel in ('sms', 'email', 'emma_ai')),
  sender_type text not null check (sender_type in ('agent', 'ai', 'lead')),
  content text not null,
  status text default 'sent' check (status in ('sent', 'delivered', 'read', 'failed')),
  created_at timestamptz default now()
);

-- ============================================================
-- CALLS
-- ============================================================
create table if not exists calls (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  agent_id uuid references users(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  status text not null default 'initiated' check (status in ('initiated', 'in_progress', 'completed', 'failed')),
  outcome text check (outcome in ('contacted', 'no_answer', 'voicemail', 'not_interested', 'wrong_number', 'dead_line', 'callback_requested')),
  duration integer,
  recording_url text,
  transcript text,
  ai_summary text,
  notes text,
  emma_ai boolean default false,
  created_at timestamptz default now(),
  ended_at timestamptz
);

-- ============================================================
-- APPOINTMENTS
-- (no direct workspace_id — accessed via lead)
-- ============================================================
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  agent_id uuid references users(id) on delete set null,
  title text not null,
  scheduled_at timestamptz not null,
  duration integer not null default 30 check (duration in (15, 30, 45, 60)),
  type text not null default 'phone' check (type in ('phone', 'video', 'in_person')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'no_show', 'cancelled')),
  meeting_link text,
  notes text,
  ai_pre_meeting_brief text,
  reminder_24h_sent boolean default false,
  reminder_1h_sent boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TASKS
-- (no direct workspace_id — accessed via agent)
-- ============================================================
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete set null,
  agent_id uuid references users(id) on delete set null,
  title text not null,
  description text,
  type text not null default 'follow_up' check (type in ('follow_up', 'callback', 'send_info', 'reactivation', 'custom')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- WORKFLOWS
-- ============================================================
create table if not exists workflows (
  id uuid primary key default uuid_generate_v4(),
  workspace_id text not null references workspaces(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean default true,
  nodes jsonb default '[]',
  edges jsonb default '[]',
  effectiveness_score numeric(5,4),
  total_runs integer default 0,
  successful_runs integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- DISCUSSION CHANNELS & MESSAGES
-- ============================================================
create table if not exists discussion_channels (
  id uuid primary key default uuid_generate_v4(),
  workspace_id text not null references workspaces(id) on delete cascade,
  type text not null check (type in ('channel', 'dm')),
  name text not null,
  participants uuid[] default '{}',
  unread_count integer default 0,
  last_message_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists discussion_messages (
  id uuid primary key default uuid_generate_v4(),
  channel_id uuid not null references discussion_channels(id) on delete cascade,
  author_id uuid references users(id) on delete set null,
  type text not null default 'text' check (type in ('text', 'voice_note')),
  content text not null,
  voice_note_url text,
  voice_note_duration integer,
  mentions uuid[] default '{}',
  thread_id uuid,
  reactions jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- EMMA AI CAMPAIGNS & QUEUE
-- ============================================================
create table if not exists emma_campaigns (
  id uuid primary key default uuid_generate_v4(),
  workspace_id text not null references workspaces(id) on delete cascade,
  name text not null,
  coverage_type text check (coverage_type in ('ACA', 'Medicare', 'Final Expense', 'Life', 'Group Health')),
  target_stages text[] default '{}',
  target_agent_ids uuid[] default '{}',
  script text,
  max_retries integer default 2,
  voicemail_behavior text default 'leave' check (voicemail_behavior in ('leave', 'skip')),
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists emma_queue (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  campaign_id uuid references emma_campaigns(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'calling', 'completed', 'voicemail', 'no_answer', 'failed')),
  scheduled_at timestamptz,
  result_summary text,
  transcript text,
  created_at timestamptz default now()
);

-- ============================================================
-- ACTIVITIES & NOTIFICATIONS
-- ============================================================
create table if not exists activities (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  type text not null,
  title text not null,
  description text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read boolean default false,
  data jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- LEAD ACTIVITIES (activity log per lead)
-- ============================================================
create table if not exists lead_activities (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  type text not null,
  description text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- EMMA AI EVENTS LOG
-- ============================================================
create table if not exists emma_events (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete set null,
  campaign_id uuid references emma_campaigns(id) on delete set null,
  event_type text not null,
  status text,
  duration integer,
  recording_url text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- PLATFORM INTEGRATIONS (admin-level credentials)
-- ============================================================
create table if not exists platform_integrations (
  id text primary key,
  name text not null,
  description text,
  credentials jsonb default '{}',
  is_active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- MIGRATION: add missing columns to existing tables
-- These ALTER statements handle columns added after initial schema creation
-- Run individually if table already exists without these columns
-- ============================================================

-- Add workspace_id to conversations (was missing from initial schema)
-- Note: conversations already created above, this is a migration add-on
-- alter table conversations add column if not exists workspace_id text references workspaces(id);
-- alter table conversations add column if not exists channel text default 'sms';
-- alter table conversations add column if not exists last_message text;

-- Add status column to users (for agent status tracking)
-- alter table users add column if not exists status text default 'active';

-- Add days_in_stage to leads (for overdue tracking)
-- alter table leads add column if not exists days_in_stage integer default 0;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Workspaces: users see their own workspace
alter table workspaces enable row level security;
create policy "Users can view own workspace" on workspaces
  for select using (id in (select workspace_id from users where id = auth.uid()));
create policy "Admins can manage workspaces" on workspaces
  for all using (id in (select workspace_id from users where id = auth.uid() and role in ('admin', 'super_admin')));

-- Users: see users in same workspace
alter table users enable row level security;
create policy "Users viewable in workspace" on users
  for select using (workspace_id = (select workspace_id from users where id = auth.uid()));

-- Leads: workspace isolation via workspace_id
alter table leads enable row level security;
create policy "Leads visible to workspace" on leads
  for select using (workspace_id in (select workspace_id from users where id = auth.uid()));
create policy "Agents can insert leads" on leads
  for insert with check (workspace_id in (select workspace_id from users where id = auth.uid()));
create policy "Agents can update own leads" on leads
  for update using (assigned_agent_id = auth.uid() or exists (select 1 from users where id = auth.uid() and role in ('admin', 'super_admin')));
create policy "Admins can delete leads" on leads
  for delete using (workspace_id in (select workspace_id from users where id = auth.uid() and role in ('admin', 'super_admin')));

-- Conversations: accessed via lead's workspace
alter table conversations enable row level security;
create policy "Conversations visible via lead workspace" on conversations
  for select using (lead_id in (select id from leads where workspace_id in (select workspace_id from users where id = auth.uid())));

-- Messages: accessed via conversation
alter table messages enable row level security;
create policy "Messages visible via conversation" on messages
  for select using (conversation_id in (select id from conversations));

-- Calls: accessed via lead's workspace
alter table calls enable row level security;
create policy "Calls workspace access" on calls
  for all using (lead_id in (select id from leads where workspace_id in (select workspace_id from users where id = auth.uid())));

-- Appointments: accessed via lead's workspace
alter table appointments enable row level security;
create policy "Appointments workspace access" on appointments
  for all using (lead_id in (select id from leads where workspace_id in (select workspace_id from users where id = auth.uid())));

-- Tasks: accessible by assigned agent or admins
alter table tasks enable row level security;
create policy "Tasks workspace access" on tasks
  for all using (agent_id = auth.uid() or exists (select 1 from users where id = auth.uid() and role in ('admin', 'super_admin')));

-- Workflows: workspace isolation
alter table workflows enable row level security;
create policy "Workflows workspace access" on workflows
  for all using (workspace_id in (select workspace_id from users where id = auth.uid()));

-- Discussion Channels: workspace isolation
alter table discussion_channels enable row level security;
create policy "Channels workspace access" on discussion_channels
  for all using (workspace_id in (select workspace_id from users where id = auth.uid()));

-- Discussion Messages: via channel's workspace
alter table discussion_messages enable row level security;
create policy "Messages via channel workspace" on discussion_messages
  for select using (channel_id in (select id from discussion_channels where workspace_id in (select workspace_id from users where id = auth.uid())));

-- Emma Campaigns: workspace isolation
alter table emma_campaigns enable row level security;
create policy "Emma campaigns workspace access" on emma_campaigns
  for all using (workspace_id in (select workspace_id from users where id = auth.uid()));

-- Emma Queue: accessed via lead's workspace
alter table emma_queue enable row level security;
create policy "Emma queue workspace access" on emma_queue
  for all using (lead_id in (select id from leads where workspace_id in (select workspace_id from users where id = auth.uid())));

-- Activities: accessed via lead's workspace
alter table activities enable row level security;
create policy "Activities visible via lead" on activities
  for select using (lead_id in (select id from leads where workspace_id in (select workspace_id from users where id = auth.uid())));

-- Notifications: user-specific
alter table notifications enable row level security;
create policy "Notifications for user" on notifications
  for all using (user_id = auth.uid());

-- Subscriptions: workspace isolation
alter table subscriptions enable row level security;
create policy "Subscriptions workspace access" on subscriptions
  for select using (workspace_id in (select workspace_id from users where id = auth.uid()));

-- AI Credit Transactions: workspace isolation
alter table ai_credit_transactions enable row level security;
create policy "AI credits workspace access" on ai_credit_transactions
  for all using (workspace_id in (select workspace_id from users where id = auth.uid()));

-- Plans: readable by all authenticated users
alter table plans enable row level security;
create policy "Plans readable by all" on plans
  for select to authenticated using (true);

-- Pipeline Stages: readable by all authenticated users
alter table pipeline_stages enable row level security;
create policy "Pipeline stages readable" on pipeline_stages
  for select to authenticated using (true);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_leads_workspace on leads(workspace_id);
create index if not exists idx_leads_stage on leads(stage_id);
create index if not exists idx_leads_agent on leads(assigned_agent_id);
create index if not exists idx_leads_created on leads(created_at desc);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_activities_lead on activities(lead_id);
create index if not exists idx_appointments_lead on appointments(lead_id);
create index if not exists idx_appointments_scheduled on appointments(scheduled_at);
create index if not exists idx_notifications_user on notifications(user_id, read);
create index if not exists idx_discussion_messages_channel on discussion_messages(channel_id);
create index if not exists idx_emma_queue_lead on emma_queue(lead_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger workspaces_updated before update on workspaces for each row execute procedure update_updated_at();
create trigger users_updated before update on users for each row execute procedure update_updated_at();
create trigger leads_updated before update on leads for each row execute procedure update_updated_at();
create trigger appointments_updated before update on appointments for each row execute procedure update_updated_at();
create trigger tasks_updated before update on tasks for each row execute procedure update_updated_at();
create trigger workflows_updated before update on workflows for each row execute procedure update_updated_at();
create trigger subscriptions_updated before update on subscriptions for each row execute procedure update_updated_at();
