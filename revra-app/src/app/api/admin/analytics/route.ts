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
    .from('users').select('role').eq('id', user.id).maybeSingle();

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [
    { data: workspaces },
    { data: leads },
    { data: agents },
    { data: subs },
    { data: calls },
    { data: pipelineStages },
  ] = await Promise.all([
    adminClient.from('workspaces').select('*'),
    adminClient.from('leads').select('*').is('deleted_at', null),
    adminClient.from('users').select('*, workspace:workspaces(name)').or('role.eq.agent,role.eq.admin'),
    adminClient.from('subscriptions').select('*, workspace:workspaces(name, plan)').eq('status', 'active'),
    adminClient.from('calls').select('*'),
    adminClient.from('pipeline_stages').select('*').is('workspace_id', null).order('position', { ascending: true }),
  ]);

  const planPrices: Record<string, number> = { starter: 250, growth: 450, scale: 799 };
  const mrr = (subs || []).reduce((acc: number, s: any) => {
    const p = s.workspace?.plan || s.plan;
    return acc + (planPrices[p] || 0);
  }, 0);

  const stageName: Record<string, string> = {};
  (pipelineStages || []).forEach((s: any) => { stageName[s.id] = s.name; });

  const funnel = {
    captured: (leads || []).filter((l: any) => l.outcome === 'pending').length,
    qualified: (leads || []).filter((l: any) => ['quoted', 'application_submitted', 'in_underwriting'].includes(l.outcome)).length,
    contacted: (leads || []).filter((l: any) => l.outcome === 'contacted').length,
    converted: (leads || []).filter((l: any) => l.outcome === 'won' || l.outcome === 'bound').length,
    lapsed: (leads || []).filter((l: any) => l.outcome === 'lapsed' || l.outcome === 'lost').length,
  };

  const agentMap: Record<string, any> = {};
  (agents || []).forEach((a: any) => {
    const agentLeads = (leads || []).filter((l: any) => l.assigned_agent_id === a.id);
    const closed = agentLeads.filter((l: any) => l.outcome === 'won' || l.outcome === 'bound').length;
    agentMap[a.id] = {
      name: a.name,
      workspace: a.workspace?.name || '—',
      leads: agentLeads.length,
      closed,
      revenue: closed * 500,
    };
  });
  const topAgents = Object.values(agentMap).sort((a: any, b: any) => b.closed - a.closed).slice(0, 5);

  const planCounts: Record<string, number> = { starter: 0, growth: 0, scale: 0 };
  (subs || []).forEach((s: any) => {
    const p = s.workspace?.plan || s.plan;
    if (planCounts[p] !== undefined) planCounts[p]++;
  });
  const totalWs = (workspaces || []).length;
  const planMix = Object.entries(planCounts).map(([plan, count]) => ({
    label: plan.charAt(0).toUpperCase() + plan.slice(1),
    count,
    percent: totalWs > 0 ? Math.round((count / totalWs) * 100) : 0,
  }));

  return NextResponse.json({
    data: {
      mrr,
      workspaceCount: (workspaces || []).length,
      leadCount: (leads || []).length,
      agentCount: (agents || []).length,
      funnel,
      topAgents,
      planMix,
      activeSubscriptions: (subs || []).length,
      callCount: (calls || []).length,
      revenueBars: [40, 55, 48, 70, 65, 85, 78, 100, 92, 88, 95, 82],
    },
  });
}