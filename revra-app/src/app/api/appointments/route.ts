import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

function getToken(request: NextRequest) {
  return request.cookies.get('sb-access-token')?.value;
}

export async function GET(request: NextRequest) {
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

  // Get all agent IDs in this workspace
  const { data: agents } = await adminClient
    .from('users')
    .select('id')
    .eq('workspace_id', profile.workspace_id);

  const agentIds = (agents || []).map((a: any) => a.id);
  if (agentIds.length === 0) return NextResponse.json({ data: [] });

  // Fetch appointments for leads in this workspace (appointments link to leads, leads link to workspace)
  const { data, error } = await adminClient
    .from('appointments')
    .select('*, lead:leads!appointments_lead_id_fkey(full_name, phone_primary)')
    .in('agent_id', agentIds)
    .order('scheduled_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getServerSupabase();
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Validate lead belongs to user's workspace
  const { data: lead } = await adminClient
    .from('leads')
    .select('id, workspace_id')
    .eq('id', body.leadId)
    .maybeSingle();

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const { data: profile } = await adminClient
    .from('users')
    .select('workspace_id')
    .eq('id', user.id)
    .maybeSingle();

  if (lead.workspace_id !== profile?.workspace_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const dbRow = {
    lead_id: body.leadId,
    agent_id: user.id,
    title: body.title,
    scheduled_at: body.scheduledAt,
    duration: body.durationMinutes || 30,
    type: body.type || 'phone',
    meeting_link: body.meetingLink || null,
    notes: body.notes || null,
    status: 'pending',
  };

  const { data, error } = await adminClient
    .from('appointments')
    .insert(dbRow)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}