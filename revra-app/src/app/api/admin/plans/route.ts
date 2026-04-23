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
    .from('plans')
    .select('*')
    .order('monthly_price', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const plans = (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    weeklyPrice: p.weekly_price,
    monthlyPrice: p.monthly_price,
    weeklyLeadLimit: p.weekly_lead_limit,
    monthlyAiCredits: p.monthly_ai_credits,
    features: p.features || [],
    isActive: p.is_active ?? true,
  }));

  return NextResponse.json({ data: plans });
}
