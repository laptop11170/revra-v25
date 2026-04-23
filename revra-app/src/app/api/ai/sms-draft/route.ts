import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

function getToken(request: NextRequest) {
  return request.cookies.get('sb-access-token')?.value;
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

  const { leadId, conversationId, tone, context } = await request.json();
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

  // Get lead info
  const { data: lead } = await adminClient
    .from('leads').select('*').eq('id', leadId).eq('workspace_id', profile.workspace_id).maybeSingle();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      data: {
        draft: `Hi ${lead.full_name?.split(' ')[0] || 'there'}, I wanted to reach out regarding your insurance inquiry. Would you have time for a quick call this week? Best regards`,
      }
    });
  }

  const systemPrompt = `You are RevRa's AI assistant helping agents draft SMS messages. Generate a concise, professional SMS draft. Keep it under 160 characters. Use the tone specified (default: friendly professional). Only output the message, no explanation.`;
  const userMessage = `Draft an SMS for lead: ${lead.full_name}, phone: ${lead.phone_number || 'N/A'}, coverage interest: ${lead.coverage_type || 'insurance'}, score: ${lead.score}/100${context ? `. Additional context: ${context}` : ''}. Tone: ${tone || 'friendly_professional'}`;

  const upstream = await fetch('https://api.opusmax.pro/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      stream: false,
    }),
  });

  if (!upstream.ok) return NextResponse.json({ error: 'AI service error' }, { status: 502 });

  const result = await upstream.json();
  const draft = result.content?.[0]?.text || `Hi ${lead.full_name?.split(' ')[0] || 'there'}, wanted to follow up on your inquiry. Are you available for a quick call?`;

  // Deduct credit
  const { data: ws } = await adminClient.from('workspaces').select('ai_credits').eq('id', profile.workspace_id).maybeSingle();
  if (ws) {
    await adminClient.from('workspaces').update({ ai_credits: Math.max((ws.ai_credits ?? 0) - 1, 0) }).eq('id', profile.workspace_id);
  }

  return NextResponse.json({ data: { draft, leadId } });
}