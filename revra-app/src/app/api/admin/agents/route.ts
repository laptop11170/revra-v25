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
    .from('users')
    .select(`
      *,
      workspace:workspaces!users_workspace_id_fkey(name),
      lead_count:leads(count)
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const agents = (data || []).map((a: any) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    workspaceId: a.workspace_id,
    workspaceName: a.workspace?.name || 'Unknown',
    leadCount: a.lead_count?.[0]?.count || 0,
    lastActive: a.last_active ? new Date(a.last_active).getTime() : null,
    status: a.status || 'active',
    createdAt: new Date(a.created_at).getTime(),
  }));

  return NextResponse.json({ data: agents });
}
