import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

function getToken(request: NextRequest) {
  return request.cookies.get('sb-access-token')?.value;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getServerSupabase();
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await adminClient
    .from('users').select('workspace_id').eq('id', user.id).maybeSingle();

  if (!profile?.workspace_id) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const { id } = await params;

  const { data, error } = await adminClient
    .from('workflows').select('*')
    .eq('id', id).eq('workspace_id', profile.workspace_id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data: {
    id: data.id,
    workspaceId: data.workspace_id,
    name: data.name,
    description: data.description,
    isActive: data.is_active,
    nodes: data.nodes || [],
    edges: data.edges || [],
    totalRuns: data.total_runs || 0,
    effectivenessScore: data.effectiveness_score || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getServerSupabase();
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await adminClient
    .from('users').select('workspace_id').eq('id', user.id).maybeSingle();

  if (!profile?.workspace_id) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.isActive !== undefined) updateData.is_active = body.isActive;
  if (body.nodes !== undefined) updateData.nodes = body.nodes;
  if (body.edges !== undefined) updateData.edges = body.edges;
  if (body.totalRuns !== undefined) updateData.total_runs = body.totalRuns;
  if (body.effectivenessScore !== undefined) updateData.effectiveness_score = body.effectivenessScore;

  const { data, error } = await adminClient
    .from('workflows').update(updateData)
    .eq('id', id).eq('workspace_id', profile.workspace_id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: {
    id: data.id,
    workspaceId: data.workspace_id,
    name: data.name,
    description: data.description,
    isActive: data.is_active,
    nodes: data.nodes || [],
    edges: data.edges || [],
    totalRuns: data.total_runs || 0,
    effectivenessScore: data.effectiveness_score || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getServerSupabase();
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await adminClient
    .from('users').select('workspace_id').eq('id', user.id).maybeSingle();

  if (!profile?.workspace_id) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const { id } = await params;

  const { error } = await adminClient
    .from('workflows').delete()
    .eq('id', id).eq('workspace_id', profile.workspace_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { id } });
}