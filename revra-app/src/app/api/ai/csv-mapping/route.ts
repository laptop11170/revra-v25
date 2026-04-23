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

  const { headers, rows } = await request.json();
  if (!headers || !rows) return NextResponse.json({ error: 'headers and rows required' }, { status: 400 });

  const apiKey = process.env.AI_API_KEY;
  let mapping: Record<string, string> = {};

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
          system: 'You are RevRa\'s CSV column mapping assistant. Given a list of CSV column headers and sample row data, map each column to the best RevRa lead field. Valid fields: full_name, email, phone_number, coverage_type, source, notes, address, city, state, zip_code. Return a JSON object mapping each CSV header to the best field name (use snake_case). Output only valid JSON.',
          messages: [{
            role: 'user',
            content: `Map these CSV headers to RevRa lead fields.\n\nHeaders: ${headers.join(', ')}\n\nSample row: ${JSON.stringify(rows[0] || {})}`,
          }],
          stream: false,
        }),
      });

      if (upstream.ok) {
        const result = await upstream.json();
        try {
          mapping = JSON.parse(result.content?.[0]?.text || '{}');
        } catch {}
      }
    } catch {}
  }

  // Fallback: simple keyword-based mapping
  if (Object.keys(mapping).length === 0) {
    const fieldMap: Record<string, string[]> = {
      full_name: ['name', 'full name', 'fullname', 'contact name', 'customer name', 'lead name'],
      email: ['email', 'e-mail', 'email address', 'contact email'],
      phone_number: ['phone', 'phone number', 'telephone', 'mobile', 'cell', 'contact phone'],
      coverage_type: ['coverage', 'coverage type', 'product', 'interest', 'insurance type', 'policy type'],
      source: ['source', 'lead source', 'referral source', 'utm source', 'campaign'],
      notes: ['notes', 'comments', 'description', 'message', 'details'],
      address: ['address', 'street', 'street address', 'addr'],
      city: ['city', 'town'],
      state: ['state', 'province'],
      zip_code: ['zip', 'zipcode', 'postal', 'postal code'],
    };

    for (const csvHeader of headers) {
      const lower = csvHeader.toLowerCase().trim();
      for (const [field, keywords] of Object.entries(fieldMap)) {
        if (keywords.some(k => lower.includes(k))) {
          mapping[csvHeader] = field;
          break;
        }
      }
    }
  }

  return NextResponse.json({ data: { mapping, fieldCount: headers.length, sampleRow: rows[0] || {} } });
}