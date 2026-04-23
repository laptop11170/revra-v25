import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  // Supabase check
  try {
    const adminClient = await getServerSupabase();
    const t0 = Date.now();
    const { error } = await adminClient.from('workspaces').select('id').limit(1);
    checks.supabase = {
      status: error ? 'degraded' : 'healthy',
      latency: Date.now() - t0,
      ...(error && { error: error.message }),
    };
  } catch (e: any) {
    checks.supabase = { status: 'unhealthy', error: e.message };
  }

  // AI Gateway check
  try {
    const t0 = Date.now();
    const res = await fetch(`${process.env.AI_API_BASE_URL || 'https://api.opusmax.pro'}/v1/models`, {
      method: 'GET',
      headers: { 'x-api-key': process.env.AI_API_KEY || '' },
    });
    checks.aiGateway = {
      status: res.ok ? 'healthy' : 'degraded',
      latency: Date.now() - t0,
    };
  } catch (e: any) {
    checks.aiGateway = { status: 'unhealthy', error: e.message };
  }

  // Overall
  const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');
  const allUnhealthy = Object.values(checks).every((c) => c.status === 'unhealthy');

  return NextResponse.json({
    data: {
      status: allHealthy ? 'healthy' : allUnhealthy ? 'unhealthy' : 'degraded',
      uptime: process.uptime(),
      responseTime: Date.now() - start,
      checks,
      version: '1.0.0',
      timestamp: Date.now(),
    },
  });
}
