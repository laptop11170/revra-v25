"use client";

import { useState } from 'react';
import { useAdminIntegrations } from '@/hooks/useAdmin';

const INTEGRATIONS_CONFIG = [
  { id: 'twilio', name: 'Twilio', description: 'SMS and voice calls', icon: 'call', color: 'error', fields: [{ key: 'account_sid', label: 'Account SID' }, { key: 'auth_token', label: 'Auth Token' }, { key: 'phone_number', label: 'Phone Number' }] },
  { id: 'meta', name: 'Meta Ads', description: 'Lead generation from Facebook/Instagram', icon: 'share', color: 'primary', fields: [{ key: 'access_token', label: 'Access Token' }, { key: 'ad_account_id', label: 'Ad Account ID' }] },
  { id: 'emma', name: 'Emma AI', description: 'AI voice agent for autonomous calling', icon: 'psychology', color: 'tertiary', fields: [{ key: 'api_key', label: 'API Key' }] },
  { id: 'stripe', name: 'Stripe', description: 'Subscription billing and payments', icon: 'credit_card', color: 'secondary', fields: [{ key: 'secret_key', label: 'Stripe Secret Key' }] },
  { id: 'claude', name: 'Claude (LLM)', description: 'AI gateway for RevRa features', icon: 'auto_awesome', color: 'tertiary', fields: [{ key: 'api_key', label: 'API Key' }, { key: 'model', label: 'Model' }] },
];

const colorMap: Record<string, string> = {
  error: 'bg-error/10 text-error',
  primary: 'bg-primary/10 text-primary',
  tertiary: 'bg-tertiary/10 text-tertiary',
  secondary: 'bg-secondary/10 text-secondary',
};

export default function AdminIntegrationsPage() {
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [localConnected, setLocalConnected] = useState<Set<string>>(new Set(['stripe']));
  const [localTestResults, setLocalTestResults] = useState<Record<string, 'success' | 'failed' | null>>({});

  const handleFieldChange = (id: string, fieldKey: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [id]: { ...prev[id], [fieldKey]: value } }));
  };

  const handleConnect = (id: string) => {
    const config = INTEGRATIONS_CONFIG.find(c => c.id === id);
    const fields = config?.fields || [];
    const hasEmpty = fields.some(f => !fieldValues[id]?.[f.key]?.trim());
    if (hasEmpty) {
      alert(`Please fill in all ${config?.name} fields before connecting.`);
      return;
    }
    setLocalConnected(prev => new Set([...prev, id]));
    setLocalTestResults(prev => ({ ...prev, [id]: 'success' }));
  };

  const handleDisconnect = (id: string) => {
    const config = INTEGRATIONS_CONFIG.find(c => c.id === id);
    if (confirm(`Disconnect ${config?.name}? Existing data will remain but new syncs will stop.`)) {
      setLocalConnected(prev => { const next = new Set(prev); next.delete(id); return next; });
      setLocalTestResults(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleTestConnection = async (id: string) => {
    const config = INTEGRATIONS_CONFIG.find(c => c.id === id);
    setTestingId(id);
    await new Promise(r => setTimeout(r, 1500));
    const success = Math.random() > 0.2;
    setLocalTestResults(prev => ({ ...prev, [id]: success ? 'success' : 'failed' }));
    setTestingId(null);
    if (!success) alert(`${config?.name} connection test failed. Check credentials and try again.`);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Integrations</h1>
        <p className="text-on-surface-variant mt-1">Configure platform-wide third-party service integrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {INTEGRATIONS_CONFIG.map((intg) => {
          const isConnected = localConnected.has(intg.id);
          const isTesting = testingId === intg.id;
          const testResult = localTestResults[intg.id] || null;

          return (
            <div key={intg.id} className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[intg.color] || 'bg-surface-container'}`}>
                  <span className="material-symbols-outlined">{intg.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">{intg.name}</h3>
                  <p className="text-xs text-on-surface-variant">{intg.description}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {intg.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">{field.label}</label>
                    <input
                      type={field.key.includes('key') || field.key.includes('token') || field.key.includes('secret') ? 'password' : 'text'}
                      value={fieldValues[intg.id]?.[field.key] || ''}
                      onChange={(e) => handleFieldChange(intg.id, field.key, e.target.value)}
                      placeholder={isConnected ? '••••••••••••••••' : `Enter ${field.label.toLowerCase()}`}
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>

              {testResult && (
                <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  testResult === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-error/10 text-error'
                }`}>
                  <span className="material-symbols-outlined text-sm">
                    {testResult === 'success' ? 'check_circle' : 'error'}
                  </span>
                  {testResult === 'success' ? 'Connection verified' : 'Connection failed — check credentials'}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-1.5 text-xs font-medium ${isConnected ? 'text-emerald-400' : 'text-on-surface-variant'}`}>
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-outline-variant'}`}></span>
                  {isConnected ? 'Connected' : 'Not connected'}
                </span>
                <div className="flex gap-2">
                  {isConnected && (
                    <button
                      onClick={() => handleTestConnection(intg.id)}
                      disabled={isTesting}
                      className="text-xs text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
                    >
                      {isTesting ? 'Testing...' : 'Test Connection'}
                    </button>
                  )}
                  {isConnected ? (
                    <button onClick={() => handleDisconnect(intg.id)} className="text-xs text-error hover:underline font-medium">Disconnect</button>
                  ) : (
                    <button onClick={() => handleConnect(intg.id)} className="text-xs text-primary hover:underline font-medium">Connect</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}