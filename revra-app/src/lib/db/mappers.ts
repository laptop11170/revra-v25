// Map Supabase snake_case DB rows → TypeScript camelCase types
import type { Lead, PipelineStage, Conversation, Message, Call, Appointment, Task, User, Workflow, DiscussionChannel, DiscussionMessage } from '@/types';

export function mapPipelineStage(row: Record<string, unknown>): PipelineStage {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    color: row.color as string,
    position: row.position as number,
    triggerConfig: row.trigger_config as Record<string, unknown> | undefined,
  };
}

export function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    assignedAgentId: row.assigned_agent_id as string | null,
    fullName: row.full_name as string,
    phonePrimary: row.phone_primary as string,
    phoneSecondary: row.phone_secondary as string | undefined,
    email: row.email as string | undefined,
    dateOfBirth: row.date_of_birth as string | undefined,
    age: row.age as number | undefined,
    state: row.state as string,
    county: row.county as string | undefined,
    homeAddress: row.home_address as string | undefined,
    coverageType: row.coverage_type as Lead['coverageType'],
    currentCarrier: row.current_carrier as string | undefined,
    policyRenewalDate: row.policy_renewal_date as string | undefined,
    preExistingConditions: row.pre_existing_conditions as string | undefined,
    monthlyBudget: row.monthly_budget as number | undefined,
    householdSize: row.household_size as number | undefined,
    dependents: row.dependents as number | undefined,
    incomeRange: row.income_range as string | undefined,
    score: row.score as number,
    scoreFactors: (row.score_factors as Lead['scoreFactors']) || [],
    source: row.source as Lead['source'],
    exclusivity: row.exclusivity as Lead['exclusivity'],
    outcome: row.outcome as Lead['outcome'],
    tags: (row.tags as string[]) || [],
    pipeline: {
      stageId: row.stage_id as string,
      enteredStageAt: new Date(row.entered_stage_at as string).getTime(),
    },
    notes: row.notes as string | undefined,
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
    deletedAt: row.deleted_at ? new Date(row.deleted_at as string).getTime() : undefined,
  };
}

// Convert Lead (camelCase) → DB row (snake_case) for INSERT/UPDATE
export function leadToDb(lead: Partial<Lead>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (lead.fullName !== undefined) out.full_name = lead.fullName;
  if (lead.phonePrimary !== undefined) out.phone_primary = lead.phonePrimary;
  if (lead.phoneSecondary !== undefined) out.phone_secondary = lead.phoneSecondary;
  if (lead.email !== undefined) out.email = lead.email;
  if (lead.dateOfBirth !== undefined) out.date_of_birth = lead.dateOfBirth;
  if (lead.state !== undefined) out.state = lead.state;
  if (lead.county !== undefined) out.county = lead.county;
  if (lead.homeAddress !== undefined) out.home_address = lead.homeAddress;
  if (lead.coverageType !== undefined) out.coverage_type = lead.coverageType;
  if (lead.currentCarrier !== undefined) out.current_carrier = lead.currentCarrier;
  if (lead.policyRenewalDate !== undefined) out.policy_renewal_date = lead.policyRenewalDate;
  if (lead.preExistingConditions !== undefined) out.pre_existing_conditions = lead.preExistingConditions;
  if (lead.monthlyBudget !== undefined) out.monthly_budget = lead.monthlyBudget;
  if (lead.householdSize !== undefined) out.household_size = lead.householdSize;
  if (lead.dependents !== undefined) out.dependents = lead.dependents;
  if (lead.incomeRange !== undefined) out.income_range = lead.incomeRange;
  if (lead.score !== undefined) out.score = lead.score;
  if (lead.scoreFactors !== undefined) out.score_factors = lead.scoreFactors;
  if (lead.source !== undefined) out.source = lead.source;
  if (lead.exclusivity !== undefined) out.exclusivity = lead.exclusivity;
  if (lead.outcome !== undefined) out.outcome = lead.outcome;
  if (lead.tags !== undefined) out.tags = lead.tags;
  if (lead.pipeline?.stageId !== undefined) out.stage_id = lead.pipeline.stageId;
  if (lead.pipeline?.enteredStageAt !== undefined) out.entered_stage_at = new Date(lead.pipeline.enteredStageAt).toISOString();
  if (lead.notes !== undefined) out.notes = lead.notes;
  if (lead.assignedAgentId !== undefined) out.assigned_agent_id = lead.assignedAgentId;
  return out;
}
