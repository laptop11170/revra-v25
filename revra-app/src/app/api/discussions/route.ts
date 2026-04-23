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
    .select('workspace_id, name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.workspace_id) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const { data, error } = await adminClient
    .from('discussion_channels')
    .select(`
      *,
      messages:discussion_messages(count)
    `)
    .eq('workspace_id', profile.workspace_id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const channels = (data || []).map((c: any) => ({
    id: c.id,
    workspaceId: c.workspace_id,
    type: c.type,
    name: c.name,
    createdAt: new Date(c.created_at).getTime(),
    messageCount: c.messages?.[0]?.count || 0,
  }));

  return NextResponse.json({ data: channels });
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
  const { type, name, participantId } = body;

  if (!type || !name) {
    return NextResponse.json({ error: 'type and name are required' }, { status: 400 });
  }

  const dbRow: Record<string, unknown> = {
    workspace_id: profile.workspace_id,
    type,
    name,
  };

  if (type === 'dm' && participantId) {
    dbRow.participants = [user.id, participantId];
  }

  const { data, error } = await adminClient
    .from('discussion_channels')
    .insert(dbRow)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: {
      id: data.id,
      workspaceId: data.workspace_id,
      type: data.type,
      name: data.name,
      createdAt: new Date(data.created_at).getTime(),
    },
  }, { status: 201 });
}
