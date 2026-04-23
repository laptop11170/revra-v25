import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

// Emma AI sends webhook on campaign events
// POST: campaign completed, lead result, queue status updates

export async function POST(request: NextRequest) {
  const adminClient = await getServerSupabase();

  try {
    const event = await request.json();
    const { type, lead_id, campaign_id, status, result, duration, recording_url } = event;

    switch (type) {
      case 'call_completed': {
        // Log the completed call
        if (lead_id && campaign_id) {
          await adminClient.from('emma_events').insert({
            id: `emma-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            lead_id,
            campaign_id,
            event_type: 'call_completed',
            status: result || 'completed',
            duration: duration || null,
            recording_url: recording_url || null,
            created_at: new Date().toISOString(),
          });

          // Create activity on lead
          await adminClient.from('lead_activities').insert({
            id: `act-${Date.now()}`,
            lead_id,
            type: 'emma_call_completed',
            description: `Emma AI completed call: ${result || 'completed'}${duration ? ` (${Math.round(duration / 60)}min)` : ''}`,
            metadata: JSON.stringify({ campaign_id, result, duration, recording_url }),
            created_at: new Date().toISOString(),
          });
        }
        break;
      }

      case 'call_result': {
        // Update lead stage or score based on call outcome
        if (lead_id && result) {
          const outcomeMap: Record<string, string> = {
            interested: 'interested',
            not_interested: 'unqualified',
            voicemail: 'voicemail',
            callback: 'callback_requested',
            no_answer: 'no_answer',
          };

          const outcome = outcomeMap[result] || result;

          // Log activity with outcome
          await adminClient.from('lead_activities').insert({
            id: `act-${Date.now()}`,
            lead_id,
            type: 'emma_call_result',
            description: `Emma AI result: ${result}`,
            metadata: JSON.stringify({ campaign_id, result }),
            created_at: new Date().toISOString(),
          });

          // If interested, bump score
          if (result === 'interested') {
            try {
              const { data: lead } = await adminClient.from('leads').select('score').eq('id', lead_id).maybeSingle();
              if (lead) {
                await adminClient.from('leads').update({ score: Math.min((lead.score ?? 0) + 10, 100) }).eq('id', lead_id);
              }
            } catch {}
          }
        }
        break;
      }

      case 'campaign_completed': {
        if (campaign_id) {
          try {
            await adminClient.from('emma_events').insert({
              id: `emma-${Date.now()}`,
              campaign_id,
              event_type: 'campaign_completed',
              status: status || 'completed',
              created_at: new Date().toISOString(),
            });
          } catch {}
        }
        break;
      }

      case 'queue_update': {
        if (lead_id && status) {
          try {
            await adminClient.from('emma_events').insert({
              id: `emma-${Date.now()}`,
              lead_id,
              campaign_id: campaign_id || null,
              event_type: 'queue_update',
              status,
              created_at: new Date().toISOString(),
            });
          } catch {}
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Emma webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}

// Emma also sends GET for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'emma-webhook-active', timestamp: new Date().toISOString() });
}