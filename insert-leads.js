const https = require('https');
const states = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
const coverages = ['Medicare', 'ACA', 'Final Expense', 'Life', 'Group Health'];
const sources = ['meta_ads', 'manual', 'csv_import', 'referral'];
const firstNames = ['Michael', 'Sarah', 'Emily', 'Marcus', 'Jennifer', 'David', 'Lisa', 'James', 'Robert', 'Patricia'];
const lastNames = ['Roberts', 'Williams', 'Chen', 'Torres', 'Smith', 'Johnson', 'Brown', 'Garcia', 'Miller', 'Davis'];
const stageDistribution = { 'stage-1': 8, 'stage-2': 5, 'stage-3': 6, 'stage-4': 4, 'stage-5': 5, 'stage-6': 4, 'stage-7': 3, 'stage-8': 8, 'stage-9': 3, 'stage-10': 4, 'stage-11': 2 };
const now = Date.now();
let leadIdx = 1;
const leads = [];
for (const [stageId, count] of Object.entries(stageDistribution)) {
  for (let i = 0; i < count; i++) {
    const fn = firstNames[(leadIdx - 1) % firstNames.length];
    const ln = lastNames[(leadIdx - 1) * 3 % lastNames.length];
    const state = states[(leadIdx - 1) % states.length];
    const coverage = coverages[(leadIdx - 1) % coverages.length];
    const source = sources[(leadIdx - 1) % sources.length];
    const daysInStage = Math.floor(Math.random() * 14) + 1;
    let score = Math.floor(Math.random() * 40) + 60;
    if (stageId === 'stage-8') score = Math.floor(Math.random() * 20) + 80;
    if (stageId === 'stage-9') score = Math.floor(Math.random() * 30) + 20;
    const outcome = stageId === 'stage-8' ? 'won' : stageId === 'stage-9' ? 'lost' : stageId === 'stage-11' ? 'lapsed' : 'pending';
    leads.push({
      workspace_id: 'ws-1',
      full_name: fn + ' ' + ln,
      phone_primary: `(555) ${String(100 + leadIdx).padStart(3, '0')}-${String(1000 + leadIdx * 7).slice(-4)}`,
      email: fn.toLowerCase() + '.' + ln.toLowerCase() + leadIdx + '@example.com',
      age: 50 + (leadIdx % 35),
      state,
      coverage_type: coverage,
      current_carrier: leadIdx % 3 === 0 ? 'UnitedHealthcare' : leadIdx % 3 === 1 ? 'Blue Cross' : null,
      monthly_budget: [150, 200, 250, 300, 400, 500][leadIdx % 6],
      score,
      score_factors: score >= 80 ? [{factor:'Medicare coverage',impact:'+20 pts',points:20}] : [{factor:'Active coverage',impact:'+10 pts',points:10}],
      source,
      exclusivity: source === 'meta_ads' ? 'exclusive' : 'shared',
      outcome,
      tags: source === 'meta_ads' ? [`meta_${coverage.toLowerCase()}`] : [],
      stage_id: stageId,
      entered_stage_at: new Date(now - daysInStage * 86400000).toISOString(),
      created_at: new Date(now - (60 + leadIdx) * 86400000).toISOString(),
      updated_at: new Date(now - daysInStage * 86400000).toISOString()
    });
    leadIdx++;
  }
}
const body = JSON.stringify(leads);
const req = https.request({
  hostname: 'kqovuenmqdpmtqdraquz.supabase.co',
  path: '/rest/v1/leads',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb3Z1ZW5tcWRwbXRxZHJhcXV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg4NjU4NywiZXhwIjoyMDkyNDYyNTg3fQ.B-1HOrrIgejEJyhLxUp9WgyKocHNhsCIv-M-BAfggms',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb3Z1ZW5tcWRwbXRxZHJhcXV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg4NjU4NywiZXhwIjoyMDkyNDYyNTg3fQ.B-1HOrrIgejEJyhLxUp9WgyKocHNhsCIv-M-BAfggms'
  }
}, res => {
  console.log('Headers:', JSON.stringify(res.headers));
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode, 'Body len:', d.length);
    try {
      const j = JSON.parse(d);
      console.log('Inserted:', j.length, 'leads');
      if (j.length > 0) console.log('Sample:', j[0].full_name, j[0].workspace_id);
    } catch(e) {
      console.log('Non-JSON response:', d.substring(0, 500));
    }
  });
});
req.on('error', e => console.log('Error:', e.message));
req.write(body);
req.end();
