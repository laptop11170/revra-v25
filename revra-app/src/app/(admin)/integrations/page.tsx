"use client";

export default function AdminIntegrationsPage() {
  const integrations = [
    {
      name: 'Twilio',
      description: 'SMS and voice calls',
      icon: 'call',
      color: 'error',
      fields: ['Account SID', 'Auth Token', 'Phone Number'],
      connected: true,
    },
    {
      name: 'Meta Ads',
      description: 'Lead generation from Facebook/Instagram',
      icon: 'share',
      color: 'primary',
      fields: ['Access Token', 'Ad Account ID'],
      connected: true,
    },
    {
      name: 'Emma AI',
      description: 'AI voice agent for autonomous calling',
      icon: 'psychology',
      color: 'tertiary',
      fields: ['API Key'],
      connected: true,
    },
    {
      name: 'Stripe',
      description: 'Subscription billing and payments',
      icon: 'credit_card',
      color: 'secondary',
      fields: ['Stripe Secret Key'],
      connected: true,
    },
    {
      name: 'Claude (LLM)',
      description: 'AI gateway for RevRa features',
      icon: 'auto_awesome',
      color: 'tertiary',
      fields: ['API Key', 'Model'],
      connected: false,
    },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Integrations</h1>
        <p className="text-on-surface-variant mt-1">Configure platform-wide third-party service integrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((intg) => (
          <div key={intg.name} className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg bg-${intg.color}/10 flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-${intg.color}`}>{intg.icon}</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface">{intg.name}</h3>
                <p className="text-xs text-on-surface-variant">{intg.description}</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {intg.fields.map((field) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">{field}</label>
                  <input
                    type="password"
                    defaultValue="••••••••••••••••"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded px-3 py-2 text-sm text-on-surface"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1.5 text-xs font-medium ${intg.connected ? 'text-emerald-400' : 'text-on-surface-variant'}`}>
                <span className={`w-2 h-2 rounded-full ${intg.connected ? 'bg-emerald-400' : 'bg-outline-variant'}`}></span>
                {intg.connected ? 'Connected' : 'Not connected'}
              </span>
              <button className="text-xs text-primary hover:underline font-medium">
                {intg.connected ? 'Update' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
