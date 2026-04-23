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
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await adminClient
    .from('platform_integrations')
    .select('*')
    .order('provider', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const integrations = (data || []).map((i: any) => ({
    id: i.id,
    provider: i.provider,
    status: i.status || 'disconnected',
    configuredAt: i.configured_at ? new Date(i.configured_at).getTime() : null,
    lastSync: i.last_sync ? new Date(i.last_sync).getTime() : null,
  }));

  return NextResponse.json({ data: integrations });
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
  const { provider, credentials } = body;

  if (!provider) return NextResponse.json({ error: 'Provider required' }, { status: 400 });

  const { data, error } = await adminClient
    .from('platform_integrations')
    .upsert({
      provider,
      credentials,
      status: 'connected',
      configured_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: { id: data.id, provider: data.provider, status: data.status } });
}
