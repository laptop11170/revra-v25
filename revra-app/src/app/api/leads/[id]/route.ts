import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mapLead } from '@/lib/db/mappers';

function getToken(request: NextRequest) {
  return request.cookies.get('sb-access-token')?.value;
}

async function getProfile(token: string | undefined) {
  if (!token) return null;
  const adminClient = await getServerSupabase();
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) return null;
  const { data } = await adminClient
    .from('users')
    .select('workspace_id, role')
    .eq('id', user.id)
    .maybeSingle();
  return { userId: user.id, ...data };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getToken(request);
  const profile = await getProfile(token);
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getServerSupabase();
  const { id } = await params;
  const { data, error } = await adminClient
    .from('leads')
    .select('*, assigned_agent:users!leads_assigned_agent_id_fkey(name, id)')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  if (data.workspace_id !== profile.workspace_id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data: mapLead(data) });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getToken(request);
  const profile = await getProfile(token);
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getServerSupabase();
  const { id } = await params;
  const body = await request.json();

  const dbRow: Record<string, unknown> = {};
  if (body.fullName !== undefined) dbRow.full_name = body.fullName;
  if (body.phonePrimary !== undefined) dbRow.phone_primary = body.phonePrimary;
  if (body.phoneSecondary !== undefined) dbRow.phone_secondary = body.phoneSecondary;
  if (body.email !== undefined) dbRow.email = body.email;
  if (body.dateOfBirth !== undefined) dbRow.date_of_birth = body.dateOfBirth;
  if (body.state !== undefined) dbRow.state = body.state;
  if (body.county !== undefined) dbRow.county = body.county;
  if (body.homeAddress !== undefined) dbRow.home_address = body.homeAddress;
  if (body.coverageType !== undefined) dbRow.coverage_type = body.coverageType;
  if (body.currentCarrier !== undefined) dbRow.current_carrier = body.currentCarrier;
  if (body.policyRenewalDate !== undefined) dbRow.policy_renewal_date = body.policyRenewalDate;
  if (body.preExistingConditions !== undefined) dbRow.pre_existing_conditions = body.preExistingConditions;
  if (body.monthlyBudget !== undefined) dbRow.monthly_budget = body.monthlyBudget;
  if (body.householdSize !== undefined) dbRow.household_size = body.householdSize;
  if (body.dependents !== undefined) dbRow.dependents = body.dependents;
  if (body.incomeRange !== undefined) dbRow.income_range = body.incomeRange;
  if (body.score !== undefined) dbRow.score = body.score;
  if (body.scoreFactors !== undefined) dbRow.score_factors = body.scoreFactors;
  if (body.source !== undefined) dbRow.source = body.source;
  if (body.exclusivity !== undefined) dbRow.exclusivity = body.exclusivity;
  if (body.outcome !== undefined) dbRow.outcome = body.outcome;
  if (body.tags !== undefined) dbRow.tags = body.tags;
  if (body.notes !== undefined) dbRow.notes = body.notes;
  if (body.assignedAgentId !== undefined) dbRow.assigned_agent_id = body.assignedAgentId;
  if (body.pipeline?.stageId !== undefined) {
    dbRow.stage_id = body.pipeline.stageId;
    dbRow.entered_stage_at = new Date().toISOString();
  }

  const { data, error } = await adminClient
    .from('leads')
    .update({ ...dbRow, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace_id', profile.workspace_id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  return NextResponse.json({ data: mapLead(data) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getToken(request);
  const profile = await getProfile(token);
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const adminClient = await getServerSupabase();
  const { id } = await params;
  const { error } = await adminClient
    .from('leads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace_id', profile.workspace_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
