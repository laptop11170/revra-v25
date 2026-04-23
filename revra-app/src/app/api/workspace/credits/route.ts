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
    .from('users')
    .select('workspace_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.workspace_id) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const body = await request.json();
  const { amount, action, description } = body;

  if (!amount || typeof amount !== 'number') {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // Fetch current workspace
  const { data: workspace, error: wsError } = await adminClient
    .from('workspaces')
    .select('ai_credits')
    .eq('id', profile.workspace_id)
    .maybeSingle();

  if (wsError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const currentCredits = workspace.ai_credits ?? 0;
  if (currentCredits < amount) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
  }

  const newBalance = currentCredits - amount;

  // Update workspace credits
  const { error: updateError } = await adminClient
    .from('workspaces')
    .update({ ai_credits: newBalance })
    .eq('id', profile.workspace_id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    data: {
      previousBalance: currentCredits,
      deducted: amount,
      newBalance,
      action: action || 'unknown',
      description: description || '',
    },
  });
}
