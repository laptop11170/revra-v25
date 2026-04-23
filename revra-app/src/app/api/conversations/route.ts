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

  // Get leads in this workspace
  const { data: leads } = await adminClient
    .from('leads')
    .select('id')
    .eq('workspace_id', profile.workspace_id)
    .is('deleted_at', null);

  const leadIds = (leads || []).map((l: any) => l.id);
  if (leadIds.length === 0) return NextResponse.json({ data: [] });

  // Get conversations for this workspace
  const { data, error } = await adminClient
    .from('conversations')
    .select('*, lead:leads(id, full_name, phone_primary)')
    .eq('workspace_id', profile.workspace_id)
    .order('last_message_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
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

  // Verify lead is in this workspace
  const { data: lead } = await adminClient
    .from('leads')
    .select('id')
    .eq('id', body.leadId)
    .eq('workspace_id', profile.workspace_id)
    .maybeSingle();

  if (!lead) return NextResponse.json({ error: 'Lead not found or access denied' }, { status: 404 });

  const dbRow = {
    workspace_id: profile.workspace_id,
    lead_id: body.leadId,
    channel: body.channel || 'sms',
    ai_active: body.aiActive ?? true,
    status: body.status ?? 'active',
  };

  const { data, error } = await adminClient
    .from('conversations')
    .insert(dbRow)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}