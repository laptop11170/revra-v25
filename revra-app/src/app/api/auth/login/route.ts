import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const adminClient = await getServerSupabase();
  const { data, error } = await adminClient.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || 'Invalid credentials' }, { status: 401 });
  }

  // Fetch user profile with service role client (bypasses RLS so we can always read the profile)
  const { data: profile } = await adminClient
    .from('users')
    .select('*, workspaces(*)')
    .eq('id', data.user.id)
    .maybeSingle();

  const response = NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    profile,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  });

  // Set session cookie
  response.cookies.set('sb-access-token', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.set('sb-refresh-token', data.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  // CORS headers for browser clients
  response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || 'http://localhost:3000');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
