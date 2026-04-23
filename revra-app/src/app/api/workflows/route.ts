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
    .from('users').select('workspace_id').eq('id', user.id).maybeSingle();

  if (!profile?.workspace_id) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const { data, error } = await adminClient
    .from('workflows').select('*')
    .eq('workspace_id', profile.workspace_id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: (data || []).map((w: any) => ({
    id: w.id,
    workspaceId: w.workspace_id,
    name: w.name,
    description: w.description,
    isActive: w.is_active,
    nodes: w.nodes || [],
    edges: w.edges || [],
    totalRuns: w.total_runs || 0,
    effectivenessScore: w.effectiveness_score || 0,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  })) });
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getServerSupabase();
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await adminClient
    .from('users').select('workspace_id').eq('id', user.id).maybeSingle();

  if (!profile?.workspace_id) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const { name, description, isActive, nodes, edges } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const id = `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const { data, error } = await adminClient.from('workflows').insert({
    id,
    workspace_id: profile.workspace_id,
    name: name.trim(),
    description: description || null,
    is_active: isActive !== false,
    nodes: nodes || [],
    edges: edges || [],
    total_runs: 0,
    effectiveness_score: 0,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: {
    id: data.id,
    workspaceId: data.workspace_id,
    name: data.name,
    description: data.description,
    isActive: data.is_active,
    nodes: data.nodes || [],
    edges: data.edges || [],
    totalRuns: 0,
    effectivenessScore: 0,
    createdAt: data.created_at,
  } }, { status: 201 });
}