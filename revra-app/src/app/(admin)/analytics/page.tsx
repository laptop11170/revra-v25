"use client";

export default function AdminAnalyticsPage() {
  const topAgents = [
    { name: 'Alex Mercer', workspace: 'San Diego', leads: 142, closed: 28, revenue: 14200 },
    { name: 'Sarah Jenkins', workspace: 'San Diego', leads: 118, closed: 22, revenue: 11000 },
    { name: 'Emily Chen', workspace: 'Texas', leads: 95, closed: 18, revenue: 9000 },
    { name: 'Marcus Torres', workspace: 'San Diego', leads: 87, closed: 15, revenue: 7500 },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Analytics</h1>
        <p className="text-on-surface-variant mt-1">Platform-wide performance metrics</p>
      </div>

      {/* Lead Funnel */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 mb-6">
        <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide mb-6">Lead Funnel</h3>
        <div className="space-y-4">
          {[
            { stage: 'Captured', count: 4829, color: 'bg-primary-container' },
            { stage: 'Qualified', count: 2140, color: 'bg-tertiary-container' },
            { stage: 'Quoted', count: 890, color: 'bg-secondary-container' },
            { stage: 'Converted', count: 342, color: 'bg-emerald-500' },
            { stage: 'Lapsed', count: 89, color: 'bg-error' },
          ].map((item, i) => (
            <div key={item.stage} className="flex items-center gap-4">
              <div className="w-24 text-sm text-on-surface-variant">{item.stage}</div>
              <div className="flex-1 bg-surface-container-highest rounded-full h-6 overflow-hidden">
                <div className={`h-full ${item.color} rounded-full flex items-center justify-end pr-3`} style={{ width: `${(item.count / 4829) * 100}%` }}>
                  <span className="text-xs font-bold text-on-surface">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Agents */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-outline-variant/15">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide">Top Performing Agents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr className="text-[10px] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Workspace</th>
                <th className="py-3 px-4">Total Leads</th>
                <th className="py-3 px-4">Policies Closed</th>
                <th className="py-3 px-4">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5 text-sm text-on-surface">
              {topAgents.map((agent, i) => (
                <tr key={i} className="hover:bg-surface-bright transition-colors">
                  <td className="py-3 px-4 font-medium">{agent.name}</td>
                  <td className="py-3 px-4 text-on-surface-variant">{agent.workspace}</td>
                  <td className="py-3 px-4">{agent.leads}</td>
                  <td className="py-3 px-4">{agent.closed}</td>
                  <td className="py-3 px-4 font-medium text-emerald-400">${agent.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Mix */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide mb-4">Subscription Mix</h3>
        <div className="flex items-end gap-3 h-32">
          {[
            { label: 'Starter', value: 3, percent: 25 },
            { label: 'Growth', value: 6, percent: 50, highlight: true },
            { label: 'Scale', value: 2, percent: 17 },
            { label: 'Enterprise', value: 1, percent: 8 },
          ].map((plan) => (
            <div key={plan.label} className="flex-1 flex flex-col items-center gap-2">
              <div className={`w-full rounded-t-lg ${plan.highlight ? 'bg-primary-container' : 'bg-surface-container-high'}`} style={{ height: `${plan.percent}%` }}>
                <span className="text-xs font-bold text-on-surface flex justify-center mt-2">{plan.value}</span>
              </div>
              <span className="text-xs text-on-surface-variant">{plan.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
