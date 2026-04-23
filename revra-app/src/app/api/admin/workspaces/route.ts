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

  // Verify super admin
  const { data: profile } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await adminClient
    .from('workspaces')
    .select(`
      *,
      agents:users(count),
      leads:leads(count),
      subscription:subscriptions(*)
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const workspaces = (data || []).map((ws: any) => ({
    id: ws.id,
    name: ws.name,
    plan: ws.plan || 'starter',
    aiCredits: ws.ai_credits,
    agentCount: ws.agents?.[0]?.count || 0,
    leadCount: ws.leads?.[0]?.count || 0,
    subscription: ws.subscription?.[0] || null,
    createdAt: new Date(ws.created_at).getTime(),
    status: ws.status || 'active',
  }));

  return NextResponse.json({ data: workspaces });
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getServerSupabase();
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, plan } = body;

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const { data, error } = await adminClient
    .from('workspaces')
    .insert({ name, plan: plan || 'starter', ai_credits: plan === 'starter' ? 1000 : plan === 'growth' ? 5000 : 15000 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: { id: data.id, name: data.name, plan: data.plan, aiCredits: data.ai_credits, status: 'active', createdAt: new Date(data.created_at).getTime() } }, { status: 201 });
}
