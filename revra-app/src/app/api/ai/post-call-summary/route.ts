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
    .from('users').select('workspace_id, name').eq('id', user.id).maybeSingle();

  if (!profile?.workspace_id) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const { callId, leadId, duration, outcome, notes } = await request.json();
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

  const { data: lead } = await adminClient
    .from('leads').select('*').eq('id', leadId).eq('workspace_id', profile.workspace_id).maybeSingle();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const apiKey = process.env.AI_API_KEY;
  let summary = '';

  if (apiKey) {
    const upstream = await fetch('https://api.opusmax.pro/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: 'You are RevRa\'s post-call summary assistant. Generate a concise post-call summary for an insurance agent. Include: call outcome, key discussion points, next recommended action, and follow-up timing. Keep it under 200 words. Return plain text.',
        messages: [{
          role: 'user',
          content: `Generate a post-call summary for lead ${lead.full_name} (score: ${lead.score}/100, interest: ${lead.coverage_type || 'N/A'}). Call duration: ${duration || 'unknown'} seconds. Outcome: ${outcome || 'unknown'}. Agent notes: ${notes || 'none'}.`,
        }],
        stream: false,
      }),
    });

    if (upstream.ok) {
      const result = await upstream.json();
      summary = result.content?.[0]?.text || '';
    }
  }

  if (!summary) {
    const outcomeLabel = outcome || 'unknown';
    summary = `Call Summary for ${lead.full_name}\n\n` +
      `Outcome: ${outcomeLabel}\n` +
      `Duration: ${duration ? Math.round(duration / 60) + ' min' : 'Not recorded'}\n` +
      `Next Action: ${outcomeLabel === 'interested' ? 'Schedule follow-up within 24 hours' : outcomeLabel === 'callback' ? 'Log callback request — follow up in 2-3 days' : 'Standard 7-day follow-up'}\n` +
      `Notes: ${notes || 'No additional notes recorded'}`;
  }

  return NextResponse.json({ data: { summary, callId, leadId } });
}