import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sb-access-token')?.value;

  if (!token) {
    return NextResponse.json({ session: null });
  }

  const adminClient = await getServerSupabase();
  const { data: { user }, error } = await adminClient.auth.getUser(token);

  if (error || !user) {
    const response = NextResponse.json({ session: null });
    response.cookies.delete('sb-access-token');
    return response;
  }

  const { data: profile } = await adminClient
    .from('users')
    .select('*, workspaces(*)')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({ user, profile, session: { user, access_token: token } });
}
