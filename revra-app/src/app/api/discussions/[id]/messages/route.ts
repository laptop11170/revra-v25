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
    .from('discussion_messages')
    .select('*, author:users!discussion_messages_author_id_fkey(name, id)')
    .eq('channel_id', id)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const messages = (data || []).map((m: any) => ({
    id: m.id,
    channelId: m.channel_id,
    authorId: m.author_id,
    authorName: m.author?.name || 'Unknown',
    content: m.content,
    type: m.type || 'text',
    createdAt: new Date(m.created_at).getTime(),
    reactions: m.reactions || {},
  }));

  return NextResponse.json({ data: messages });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getServerSupabase();
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await adminClient
    .from('users')
    .select('name')
    .eq('id', user.id)
    .maybeSingle();

  const { id } = await params;
  const body = await request.json();
  const { content, type } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from('discussion_messages')
    .insert({
      channel_id: id,
      author_id: user.id,
      content: content.trim(),
      type: type || 'text',
    })
    .select('*, author:users!discussion_messages_author_id_fkey(name, id)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: {
      id: data.id,
      channelId: data.channel_id,
      authorId: data.author_id,
      authorName: profile?.name || 'Unknown',
      content: data.content,
      type: data.type || 'text',
      createdAt: new Date(data.created_at).getTime(),
      reactions: {},
    },
  }, { status: 201 });
}
