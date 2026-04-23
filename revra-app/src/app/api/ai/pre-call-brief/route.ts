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

  const { leadId } = await request.json();
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

  const { data: lead } = await adminClient
    .from('leads').select('*').eq('id', leadId).eq('workspace_id', profile.workspace_id).maybeSingle();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  // Get recent calls
  const { data: calls } = await adminClient
    .from('calls').select('*').eq('lead_id', leadId).eq('agent_id', user.id)
    .order('created_at', { ascending: false }).limit(3);

  // Get last conversation
  const { data: convs } = await adminClient
    .from('conversations').select('*').eq('lead_id', leadId)
    .eq('workspace_id', profile.workspace_id)
    .order('updated_at', { ascending: false }).limit(1);

  let lastCallNote = 'No prior calls';
  if (calls?.length) {
    const last = calls[0];
    lastCallNote = `Last call: ${last.duration ? Math.round(last.duration / 60) + 'min' : 'short'} — ${last.outcome || 'no outcome recorded'}`;
  }

  const lastMessage = convs?.[0] ? `Last message: ${convs[0].last_message?.slice(0, 80) || 'none'}` : '';

  const apiKey = process.env.AI_API_KEY;
  let brief = '';

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
        system: 'You are RevRa\'s pre-call briefing assistant. Generate a concise pre-call brief for an insurance agent about to call a lead. Include: key talking points, lead priority indicators, suggested opening, and recommended outcome. Keep it structured and actionable. Return plain text, not markdown.',
        messages: [{
          role: 'user',
          content: `Prepare a pre-call brief for calling lead: ${lead.full_name}\nPhone: ${lead.phone_number || 'N/A'}\nCoverage Interest: ${lead.coverage_type || 'N/A'}\nScore: ${lead.score}/100\nStage: ${lead.pipeline_stage_id || 'unknown'}\n${lastCallNote}\n${lastMessage}`,
        }],
        stream: false,
      }),
    });

    if (upstream.ok) {
      const result = await upstream.json();
      brief = result.content?.[0]?.text || '';
    }
  }

  if (!brief) {
    const stageMap: Record<string, string> = { 'stage-1': 'New Lead', 'stage-2': 'Contacted', 'stage-3': 'Qualified', 'stage-4': 'Meeting Scheduled', 'stage-5': 'Proposal', 'stage-6': 'Negotiation', 'stage-7': 'Pending Decision', 'stage-8': 'Won' };
    brief = `PRE-CALL BRIEF: ${lead.full_name}\n\n` +
      `Opening: "Hi ${lead.full_name?.split(' ')[0]}, this is ${profile.name} from RevRa. I'm following up on your ${lead.coverage_type || 'insurance'} inquiry — do you have a few minutes?"\n\n` +
      `Key Points:\n- Interest: ${lead.coverage_type || 'Insurance'}\n- Score: ${lead.score}/100 ${lead.score >= 70 ? '(High Priority)' : '(Standard)'}\n- Stage: ${stageMap[lead.pipeline_stage_id || ''] || 'Unknown'}\n` +
      `${lastCallNote}\n${lastMessage ? '\n' + lastMessage : ''}\n\n` +
      `Recommended Outcome: ${lead.score >= 80 ? 'Schedule consultation appointment' : 'Gather requirements, schedule follow-up call'}`;
  }

  return NextResponse.json({ data: { brief, leadId, leadName: lead.full_name } });
}