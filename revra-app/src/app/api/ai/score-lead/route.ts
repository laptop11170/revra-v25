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

  const { leadId } = await request.json();
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

  const { data: lead } = await adminClient
    .from('leads').select('*').eq('id', leadId).eq('workspace_id', profile.workspace_id).maybeSingle();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const apiKey = process.env.AI_API_KEY;
  let score = 50;
  let factors: string[] = [];

  if (apiKey) {
    try {
      const upstream = await fetch('https://api.opusmax.pro/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: 'You are RevRa\'s AI lead scoring assistant. Return a JSON object with fields: score (integer 0-100), factors (array of strings describing what drove the score). Output only valid JSON, no markdown.',
          messages: [{
            role: 'user',
            content: `Score this insurance lead from 0-100. Consider: name, phone (${lead.phone_number || 'N/A'}), email (${lead.email || 'N/A'}), coverage_type (${lead.coverage_type || 'N/A'}), source (${lead.source || 'N/A'}), any notes about intent or engagement. Return JSON: {"score": number, "factors": ["reason1", "reason2"]}`,
          }],
          stream: false,
        }),
      });
      if (upstream.ok) {
        const result = await upstream.json();
        try {
          const parsed = JSON.parse(result.content?.[0]?.text || '{"score":50,"factors":[]}');
          score = parsed.score ?? 50;
          factors = parsed.factors || [];
        } catch {}
      }
    } catch {}
  } else {
    // Smart mock scoring
    score = Math.min(99, Math.max(10, Math.floor(
      (Math.random() * 40) +
      (lead.coverage_type ? 15 : 0) +
      (lead.phone_number ? 10 : 0) +
      (lead.source === 'referral' ? 20 : 0) +
      (lead.email ? 5 : 0)
    )));
    factors = [
      lead.coverage_type ? 'Coverage type identified' : 'No coverage type set',
      lead.phone_number ? 'Phone number available' : 'Missing phone number',
      lead.source === 'referral' ? 'Referral source — high intent' : 'Non-referral source',
      score >= 70 ? 'High score — prioritize outreach' : 'Medium score — standard follow-up',
    ];
  }

  // Update lead score in DB
  await adminClient.from('leads').update({ score, updated_at: new Date().toISOString(), days_in_stage: 0 })
    .eq('id', leadId).eq('workspace_id', profile.workspace_id);

  return NextResponse.json({ data: { leadId, score, factors } });
}