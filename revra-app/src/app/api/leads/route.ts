import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mapLead } from '@/lib/db/mappers';

function getToken(request: NextRequest) {
  return request.cookies.get('sb-access-token')?.value;
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Use service role for auth check (bypasses RLS)
  const adminClient = await getServerSupabase();
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await adminClient
    .from('users')
    .select('workspace_id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.workspace_id) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const stageId = searchParams.get('stageId');
  const agentId = searchParams.get('agentId');
  const search = searchParams.get('search');

  let query = adminClient
    .from('leads')
    .select('*, assigned_agent:users!leads_assigned_agent_id_fkey(name, id)')
    .eq('workspace_id', profile.workspace_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (stageId) query = query.eq('stage_id', stageId);
  if (agentId) query = query.eq('assigned_agent_id', agentId);
  if (search) query = query.ilike('full_name', `%${search}%`);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data?.map(mapLead) || [], meta: { total: count } });
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getServerSupabase();
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await adminClient
    .from('users')
    .select('workspace_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.workspace_id) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const body = await request.json();

  const dbRow: Record<string, unknown> = {
    workspace_id: profile.workspace_id,
    full_name: body.fullName,
    phone_primary: body.phonePrimary,
    phone_secondary: body.phoneSecondary || null,
    email: body.email || null,
    date_of_birth: body.dateOfBirth || null,
    state: body.state,
    county: body.county || null,
    home_address: body.homeAddress || null,
    coverage_type: body.coverageType || 'Medicare',
    current_carrier: body.currentCarrier || null,
    policy_renewal_date: body.policyRenewalDate || null,
    pre_existing_conditions: body.preExistingConditions || null,
    monthly_budget: body.monthlyBudget || null,
    household_size: body.householdSize || null,
    dependents: body.dependents || null,
    income_range: body.incomeRange || null,
    score: body.score ?? 50,
    score_factors: body.scoreFactors || [],
    source: body.source || 'manual',
    exclusivity: body.exclusivity || 'shared',
    outcome: body.outcome || 'pending',
    tags: body.tags || [],
    stage_id: body.pipeline?.stageId || 'stage-1',
    entered_stage_at: body.pipeline?.enteredStageAt
      ? new Date(body.pipeline.enteredStageAt).toISOString()
      : new Date().toISOString(),
    assigned_agent_id: body.assignedAgentId || null,
    notes: body.notes || null,
  };

  const { data, error } = await adminClient
    .from('leads')
    .insert(dbRow)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: mapLead(data) }, { status: 201 });
}
