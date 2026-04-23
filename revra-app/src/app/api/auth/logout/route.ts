import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST() {
  await supabase.auth.signOut();
  const response = NextResponse.json({ success: true });
  response.cookies.delete('sb-access-token');
  return response;
}
