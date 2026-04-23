import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client bypasses RLS — only for admin seed operations
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST() {
  try {
    const supabase = getServiceClient();

    // 1. Create workspaces
    const { error: wsErr1 } = await supabase
      .from('workspaces')
      .upsert({ id: 'ws-1', name: 'San Diego Health Agents', plan: 'growth', ai_credits: 4120 }, { onConflict: 'id' });

    const { error: wsErr2 } = await supabase
      .from('workspaces')
      .upsert({ id: 'ws-2', name: 'Texas Insurance Group', plan: 'starter', ai_credits: 2500 }, { onConflict: 'id' });

    if (wsErr1 || wsErr2) {
      return NextResponse.json({ error: 'Failed to create workspaces', detail: wsErr1?.message || wsErr2?.message }, { status: 500 });
    }

    // 2. Create auth users (demo accounts) via Admin API
    // NOTE: auth.users.id must be a valid UUID v4 — we can't use 'u-1' style IDs
    const demoUsers = [
      { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', email: 'agent1@revra.test', password: 'password', name: 'Alex Mercer', role: 'agent', workspace_id: 'ws-1' },
      { id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', email: 'agent2@revra.test', password: 'password', name: 'Sarah Jenkins', role: 'agent', workspace_id: 'ws-1' },
      { id: 'f4b3c8a1-2d5e-4f6a-9c1b-8e2d3c4e5f6a', email: 'agent3@revra.test', password: 'password', name: 'Marcus Torres', role: 'agent', workspace_id: 'ws-1' },
      { id: 'a1b2c3d4-5e6f-7a8b-9c0d-e1f2a3b4c5d6', email: 'admin1@revra.test', password: 'password', name: 'David Wu', role: 'admin', workspace_id: 'ws-1' },
      { id: '1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d7', email: 'agent4@revra.test', password: 'password', name: 'Emily Chen', role: 'agent', workspace_id: 'ws-2' },
      { id: '2b3c4d5e-6f7a-8b9c-0d1e-f2a3b4c5d6e7', email: 'agent5@revra.test', password: 'password', name: 'Michael Chang', role: 'agent', workspace_id: 'ws-2' },
      { id: '3c4d5e6f-7a8b-9c0d-1e2f-a3b4c5d6e7f8', email: 'agent6@revra.test', password: 'password', name: 'Lisa Park', role: 'agent', workspace_id: 'ws-2' },
      { id: '4d5e6f7a-8b9c-0d1e-2f3a-b4c5d6e7f8a9', email: 'admin2@revra.test', password: 'password', name: 'James Rodriguez', role: 'admin', workspace_id: 'ws-2' },
      { id: '5e6f7a8b-9c0d-1e2f-3a4b-c5d6e7f8a9b0', email: 'super@revra.test', password: 'password', name: 'Platform Admin', role: 'super_admin', workspace_id: null },
    ];

    for (const u of demoUsers) {
      // Use Supabase Admin API — createOrUpdate pattern to handle existing users
      // (Supabase admin API doesn't have a true upsert, so we try create first,
      //  then update password if user already exists)
      const { data: signUpData, error: signUpErr } = await supabase.auth.admin.createUser({
        id: u.id,
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name },
      });

      if (signUpErr) {
        // If create fails because user exists, update password + metadata
        if (signUpErr.message.includes('already exists') || signUpErr.message.includes('already been taken')) {
          const { error: updateErr } = await supabase.auth.admin.updateUserById(u.id, {
            password: u.password,
            email_confirm: true,
            user_metadata: { name: u.name },
          });
          if (updateErr) {
            console.error(`Password update failed for ${u.email}:`, updateErr.message);
          } else {
            console.log(`Updated auth user: ${u.email}`);
          }
        } else {
          console.error(`Auth user error for ${u.email}:`, JSON.stringify(signUpErr));
        }
      } else {
        console.log(`Created auth user: ${u.email} (${signUpData?.user?.id || 'existing'})`);
      }

      // Upsert user profile
      const { error: profileErr } = await supabase
        .from('users')
        .upsert({
          id: u.id,
          name: u.name,
          role: u.role,
          workspace_id: u.workspace_id,
          is_active: true,
        }, { onConflict: 'id' });

      if (profileErr) {
        console.error(`Profile error for ${u.email}:`, profileErr.message);
      }
    }

    // 3. Create subscriptions
    await supabase.from('subscriptions').upsert([
      { workspace_id: 'ws-1', plan_id: 'plan-growth', status: 'active' },
      { workspace_id: 'ws-2', plan_id: 'plan-starter', status: 'active' },
    ], { onConflict: 'workspace_id' });

    // 4. Pipeline stages (idempotent — only inserts if not exists)
    const stages = [
      { id: 'stage-1', name: 'New Lead', slug: 'new_lead', color: '#b8c3ff', position: 1 },
      { id: 'stage-2', name: 'Attempting Contact', slug: 'attempting_contact', color: '#b8c3ff', position: 2 },
      { id: 'stage-3', name: 'Contacted', slug: 'contacted', color: '#eaddff', position: 3 },
      { id: 'stage-4', name: 'Needs Analysis', slug: 'needs_analysis', color: '#8342f4', position: 4 },
      { id: 'stage-5', name: 'Quote Sent', slug: 'quote_sent', color: '#b8c3ff', position: 5 },
      { id: 'stage-6', name: 'Application Submitted', slug: 'application_submitted', color: '#dde1ff', position: 6 },
      { id: 'stage-7', name: 'In Underwriting', slug: 'in_underwriting', color: '#d2bbff', position: 7 },
      { id: 'stage-8', name: 'Bound / Policy Active', slug: 'bound', color: '#10b981', position: 8 },
      { id: 'stage-9', name: 'Closed Lost', slug: 'closed_lost', color: '#ffb4ab', position: 9 },
      { id: 'stage-10', name: 'Renewal Due', slug: 'renewal_due', color: '#fbbf24', position: 10 },
      { id: 'stage-11', name: 'Lapsed', slug: 'lapsed', color: '#6b7280', position: 11 },
    ];

    for (const s of stages) {
      await supabase.from('pipeline_stages').upsert(s, { onConflict: 'id' });
    }

    // 5. Generate and insert leads (workspace 1)
    const states = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
    const coverages = ['Medicare', 'ACA', 'Final Expense', 'Life', 'Group Health'];
    const sources = ['meta_ads', 'manual', 'csv_import', 'referral'];
    const firstNames = ['Michael', 'Sarah', 'Emily', 'Marcus', 'Jennifer', 'David', 'Lisa', 'James', 'Robert', 'Patricia', 'William', 'Linda', 'Thomas', 'Barbara', 'Christopher', 'Elizabeth', 'Daniel', 'Susan', 'Matthew', 'Jessica'];
    const lastNames = ['Roberts', 'Williams', 'Chen', 'Torres', 'Smith', 'Johnson', 'Brown', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson'];

    const stageDistribution: Record<string, number> = {
      'stage-1': 8, 'stage-2': 5, 'stage-3': 6, 'stage-4': 4, 'stage-5': 5,
      'stage-6': 4, 'stage-7': 3, 'stage-8': 8, 'stage-9': 3, 'stage-10': 4, 'stage-11': 2,
    };

    const leads: Record<string, unknown>[] = [];
    let leadIdx = 1;
    const now = Date.now();

    for (const [stageId, count] of Object.entries(stageDistribution)) {
      for (let i = 0; i < count; i++) {
        const firstName = firstNames[(leadIdx - 1) % firstNames.length];
        const lastName = lastNames[(leadIdx - 1) * 3 % lastNames.length];
        const state = states[(leadIdx - 1) % states.length];
        const coverage = coverages[(leadIdx - 1) % coverages.length];
        const source = sources[(leadIdx - 1) % sources.length];
        const daysInStage = Math.floor(Math.random() * 14) + 1;

        let score = Math.floor(Math.random() * 40) + 60;
        if (stageId === 'stage-8') score = Math.floor(Math.random() * 20) + 80;
        if (stageId === 'stage-9') score = Math.floor(Math.random() * 30) + 20;

        const stageOrder: Record<string, number> = { 'stage-8': 8, 'stage-9': 9, 'stage-10': 10, 'stage-11': 11, 'stage-1': 1, 'stage-2': 2, 'stage-3': 3, 'stage-4': 4, 'stage-5': 5, 'stage-6': 6, 'stage-7': 7 };
        const position = stageOrder[stageId] || 1;
        const enteredStageAt = new Date(now - daysInStage * 24 * 60 * 60 * 1000).toISOString();

        leads.push({
          workspace_id: 'ws-1',
          full_name: `${firstName} ${lastName}`,
          phone_primary: `(555) ${String(100 + leadIdx).padStart(3, '0')}-${String(1000 + leadIdx * 7).slice(-4)}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${leadIdx}@example.com`,
          date_of_birth: `${1950 + (leadIdx % 35)}-${String((leadIdx % 12) + 1).padStart(2, '0')}-${String((leadIdx % 28) + 1).padStart(2, '0')}`,
          age: 50 + (leadIdx % 35),
          state,
          coverage_type: coverage,
          current_carrier: leadIdx % 3 === 0 ? 'UnitedHealthcare' : leadIdx % 3 === 1 ? 'Blue Cross' : null,
          policy_renewal_date: coverage === 'Medicare' ? '2026-10-01' : null,
          monthly_budget: [150, 200, 250, 300, 400, 500][leadIdx % 6],
          score,
          score_factors: score >= 80
            ? [{ factor: 'Medicare coverage in high-demand state', impact: '+20 pts', points: 20 }, { factor: 'Budget $300+/month', impact: '+15 pts', points: 15 }]
            : score >= 50
            ? [{ factor: 'Active coverage interest', impact: '+8 pts', points: 8 }, { factor: 'Medicare lead', impact: '+12 pts', points: 12 }]
            : [{ factor: 'Limited budget', impact: '-10 pts', points: -10 }],
          source,
          exclusivity: source === 'meta_ads' ? 'exclusive' : 'shared',
          outcome: stageId === 'stage-8' ? 'won' : stageId === 'stage-9' ? 'lost' : stageId === 'stage-11' ? 'lapsed' : 'pending',
          tags: source === 'meta_ads' ? [`meta_${coverage.toLowerCase()}`] : source === 'referral' ? ['referral'] : [],
          stage_id: stageId,
          entered_stage_at: enteredStageAt,
          notes: leadIdx % 5 === 0 ? 'Interested in comprehensive coverage. Callback requested.' : null,
          created_at: new Date(now - (60 + leadIdx) * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(now - daysInStage * 24 * 60 * 60 * 1000).toISOString(),
        });
        leadIdx++;
      }
    }

    // Insert leads in batches of 50
    let totalInserted = 0;
    for (let i = 0; i < leads.length; i += 50) {
      const batch = leads.slice(i, i + 50);
      const { data, error: leadErr } = await supabase.from('leads').upsert(batch, { onConflict: 'id' }).select('id');
      if (leadErr) {
        console.error('Lead batch error:', leadErr.message);
      } else {
        totalInserted += (data?.length || 0);
        console.log(`Inserted batch ${Math.floor(i/50)+1}: ${data?.length || 0} leads`);
      }
    }
    console.log(`Total leads inserted: ${totalInserted}`);

    return NextResponse.json({
      success: true,
      message: `Seeded: 2 workspaces, ${demoUsers.length} users, ${leads.length} leads, ${stages.length} pipeline stages`,
    });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: 'Seed failed', detail: String(err) }, { status: 500 });
  }
}
