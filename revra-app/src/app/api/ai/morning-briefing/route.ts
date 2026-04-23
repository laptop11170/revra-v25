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
    .from('users').select('*').eq('id', user.id).maybeSingle();

  if (!profile?.workspace_id) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const { data: workspace } = await adminClient
    .from('workspaces').select('*').eq('id', profile.workspace_id).maybeSingle();

  // Fetch today's leads and appointments for this agent
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today.getTime() + 86400000);

  const { data: leads } = await adminClient
    .from('leads').select('*')
    .eq('workspace_id', profile.workspace_id)
    .eq('assigned_agent_id', user.id)
    .is('deleted_at', null)
    .order('score', { ascending: false });

  const { data: appointments } = await adminClient
    .from('appointments').select('*')
    .eq('workspace_id', profile.workspace_id)
    .eq('agent_id', user.id)
    .gte('scheduled_at', today.toISOString())
    .lt('scheduled_at', todayEnd.toISOString());

  const { data: stages } = await adminClient
    .from('pipeline_stages').select('*')
    .eq('workspace_id', profile.workspace_id)
    .order('position', { ascending: true });

  const apiKey = process.env.AI_API_KEY;
  let briefing: any = null;

  if (apiKey) {
    try {
      const leadContext = (leads || []).slice(0, 10).map((l: any) =>
        `- ${l.full_name}: score=${l.score}, stage=${stages?.find((s: any) => s.id === l.pipeline_stage_id)?.name || 'unknown'}, days_in_stage=${l.days_in_stage || 0}`
      ).join('\n');

      const aptContext = (appointments || []).map((a: any) =>
        `- ${a.scheduled_at}: ${a.type || 'appointment'} (${a.duration}min)`
      ).join('\n');

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
          system: 'You are RevRa\'s morning briefing AI. Generate a structured briefing for an insurance agent. Return JSON with sections: overdue (array of lead names needing immediate attention), new_leads (array), hot_leads (array of names with score >= 80), appointments_today (count), ai_suggestions (array of strings). Be concise and actionable.',
          messages: [{
            role: 'user',
            content: `Generate a morning briefing for agent ${profile.name}.\n\nMy leads today:\n${leadContext || 'No leads assigned'}\n\nAppointments today:\n${aptContext || 'None scheduled'}\n\nGive me the briefing in JSON format.`,
          }],
          stream: false,
        }),
      });

      if (upstream.ok) {
        const result = await upstream.json();
        try {
          briefing = JSON.parse(result.content?.[0]?.text || '{}');
        } catch {
          briefing = { raw: result.content?.[0]?.text || '' };
        }
      }
    } catch {}
  }

  // Fallback: construct briefing from data
  if (!briefing || !briefing.overdue) {
    const overdueLeads = (leads || []).filter((l: any) => {
      const days = l.days_in_stage || 0;
      return days > 7;
    });
    const hotLeads = (leads || []).filter((l: any) => l.score >= 80);
    const newLeads = (leads || []).filter((l: any) => l.pipeline_stage_id === 'stage-1');

    briefing = {
      overdue: overdueLeads.slice(0, 3).map((l: any) => l.full_name),
      new_leads: newLeads.slice(0, 5).map((l: any) => l.full_name),
      hot_leads: hotLeads.slice(0, 3).map((l: any) => l.full_name),
      appointments_today: (appointments || []).length,
      ai_suggestions: [
        `${hotLeads.length} hot leads require immediate outreach`,
        `${overdueLeads.length} leads are overdue — recommend touchpoints today`,
        `${(appointments || []).length} appointments scheduled — prepare materials in advance`,
      ],
    };
  }

  // Deduct credit
  const { data: ws } = await adminClient.from('workspaces').select('ai_credits').eq('id', profile.workspace_id).maybeSingle();
  if (ws) {
    await adminClient.from('workspaces').update({ ai_credits: Math.max((ws.ai_credits ?? 0) - 1, 0) }).eq('id', profile.workspace_id);
  }

  return NextResponse.json({ data: { briefing, leadCount: leads?.length || 0, appointmentCount: appointments?.length || 0 } });
}