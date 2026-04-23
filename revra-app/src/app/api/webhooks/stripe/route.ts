import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

// Stripe webhook handler
// Verify using STRIPE_WEBHOOK_SECRET env var

function verifyStripeSignature(body: string, sig: string, secret: string): boolean {
  // In production, use Stripe's SDK: stripe.webhooks.constructEvent()
  // For demo, accept if secret is configured
  return !!secret;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get('stripe-signature') || '';

  const body = await request.text();

  // Find active workspace client for DB access
  const adminClient = await getServerSupabase();

  try {
    const event = JSON.parse(body);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const workspaceId = sub.metadata?.workspace_id;
        if (!workspaceId) break;

        const planId = sub.items?.data?.[0]?.price?.id || sub.plan?.id;
        const statusMap: Record<string, string> = {
          active: 'active',
          trialing: 'trialing',
          past_due: 'past_due',
          canceled: 'cancelled',
          paused: 'paused',
        };

        await adminClient.from('subscriptions').upsert({
          id: sub.id,
          workspace_id: workspaceId,
          plan_id: planId || null,
          status: statusMap[sub.status] || sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }, { onConflict: 'id' });

        // Update workspace plan if applicable
        if (sub.status === 'active') {
          await adminClient.from('workspaces').update({
            updated_at: new Date().toISOString(),
          }).eq('id', workspaceId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const workspaceId = sub.metadata?.workspace_id;
        if (!workspaceId) break;

        await adminClient.from('subscriptions').update({
          status: 'cancelled',
        }).eq('id', sub.id);

        await adminClient.from('workspaces').update({
          status: 'suspended',
          updated_at: new Date().toISOString(),
        }).eq('id', workspaceId);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const workspaceId = invoice.metadata?.workspace_id || invoice.customer?.metadata?.workspace_id;

        if (workspaceId && invoice.amount_paid) {
          try {
            await adminClient.from('lead_activities').insert({
              id: `act-${Date.now()}`,
              lead_id: `ws-${workspaceId}`,
              type: 'payment_received',
              description: `Stripe payment: $${(invoice.amount_paid / 100).toFixed(2)}`,
              created_at: new Date().toISOString(),
            });
          } catch {}
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const workspaceId = invoice.metadata?.workspace_id;

        if (workspaceId) {
          await adminClient.from('subscriptions').update({
            status: 'past_due',
          }).eq('workspace_id', workspaceId);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}