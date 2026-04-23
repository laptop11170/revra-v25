import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

// Twilio sends webhook on SMS events
// Verify signature using TWILIO_AUTH_TOKEN env var

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const messageSid = formData.get('MessageSid') as string;
  const from = formData.get('From') as string;
  const to = formData.get('To') as string;
  const body = formData.get('Body') as string;
  const numMedia = parseInt(formData.get('NumMedia') as string || '0');

  // Handle incoming SMS
  if (body && from && to) {
    const adminClient = await getServerSupabase();

    // Find workspace by phone number (Twilio number mapped to workspace)
    const { data: workspaces } = await adminClient
      .from('workspaces').select('id, integrations');

    const ws = (workspaces || []).find((w: any) => {
      const integrations = typeof w.integrations === 'string' ? JSON.parse(w.integrations) : (w.integrations || {});
      return integrations.twilio_phone === to;
    });

    if (ws) {
      // Find or create lead by phone
      const cleanPhone = from.replace(/\D/g, '');

      const { data: existingLead } = await adminClient
        .from('leads').select('id').eq('phone_number', cleanPhone).eq('workspace_id', ws.id).maybeSingle();

      let leadId = existingLead?.id;

      if (!leadId) {
        const { data: newLead } = await adminClient
          .from('leads').insert({
            id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            workspace_id: ws.id,
            full_name: `SMS Contact ${cleanPhone.slice(-4)}`,
            phone_number: cleanPhone,
            source: 'sms_inbound',
            score: 40,
          }).select('id').single();
        leadId = newLead?.id;
      }

      if (leadId) {
        // Find or create conversation
        const { data: existingConv } = await adminClient
          .from('conversations').select('id').eq('lead_id', leadId).eq('channel', 'sms').eq('workspace_id', ws.id).maybeSingle();

        let convId = existingConv?.id;

        if (!convId) {
          const { data: newConv } = await adminClient
            .from('conversations').insert({
              id: `conv-${Date.now()}`,
              workspace_id: ws.id,
              lead_id: leadId,
              channel: 'sms',
              status: 'active',
            }).select('id').single();
          convId = newConv?.id;
        }

        if (convId) {
          // Create message (from lead = inbound)
          await adminClient.from('messages').insert({
            id: `msg-${Date.now()}`,
            conversation_id: convId,
            sender_type: 'lead',
            content: body,
            direction: 'inbound',
            channel: 'sms',
          });

          // Update conversation last_message
          await adminClient.from('conversations').update({
            last_message: body,
            updated_at: new Date().toISOString(),
          }).eq('id', convId);

          // Log activity
          await adminClient.from('lead_activities').insert({
            id: `act-${Date.now()}`,
            lead_id: leadId,
            type: 'sms_received',
            description: `SMS received: ${body.slice(0, 80)}`,
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  }

  // TwiML response for inbound SMS
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  );
}

// Twilio also sends status callbacks for outbound SMS
export async function PUT(request: NextRequest) {
  const formData = await request.formData();
  const messageSid = formData.get('MessageSid') as string;
  const messageStatus = formData.get('MessageStatus') as string;

  if (messageSid && messageStatus) {
    const adminClient = await getServerSupabase();

    // Find message by external sid and update status
    await adminClient.from('messages')
      .update({ status: messageStatus })
      .eq('external_sid', messageSid);
  }

  return NextResponse.json({ received: true });
}