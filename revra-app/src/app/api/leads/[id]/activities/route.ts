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

  const { id } = await params;

  const { data, error } = await adminClient
    .from('lead_activities')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const activities = (data || []).map((a) => ({
    id: a.id,
    leadId: a.lead_id,
    type: a.type,
    description: a.description,
    metadata: a.metadata || {},
    createdAt: new Date(a.created_at).getTime(),
  }));

  return NextResponse.json({ data: activities });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getServerSupabase();
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: leadId } = await params;
  const body = await request.json();

  const { data, error } = await adminClient
    .from('lead_activities')
    .insert({
      lead_id: leadId,
      type: body.type,
      description: body.description,
      metadata: body.metadata || {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: {
      id: data.id,
      leadId: data.lead_id,
      type: data.type,
      description: data.description,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at).getTime(),
    },
  }, { status: 201 });
}
