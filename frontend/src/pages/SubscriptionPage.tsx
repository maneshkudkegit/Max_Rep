import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Navbar } from '../components/Navbar';
import { SaveStatus } from '../components/SaveStatus';
import { api } from '../lib/api';

const tiers = [
  { key: 'free', title: 'Free', perks: ['Basic dashboard', 'Basic tracking'] },
  { key: 'pro', title: 'Pro', perks: ['Advanced analytics', 'Custom workout splits', 'PDF reports'] },
  { key: 'premium', title: 'Premium', perks: ['Trainer chat', 'AI-ready recommendations', 'All Pro features'] },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const selectTier = async (tier: string) => {
    try {
      setStatus('saving');
      const res = await api.post('/billing/checkout-session', { tier });
      setStatus('saved');
      window.location.href = res.data.checkout_url;
    } catch {
      setStatus('error');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="md:pl-0">
      <main className="main-with-sidebar">
        <h1 className="mb-2 text-3xl font-black">Choose your Max Rep plan</h1>
        <p className="mb-4 text-sm text-slate-600">Select a tier to continue to secure checkout.</p>
        <SaveStatus status={status} successText="Redirecting to checkout..." savingText="Preparing checkout..." errorText="Unable to open checkout." />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {tiers.map((tier) => (
            <div key={tier.key} className="panel">
              <h2 className="text-xl font-bold">{tier.title}</h2>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {tier.perks.map((p) => <li key={p}>- {p}</li>)}
              </ul>
              <button className="btn-primary mt-4" onClick={() => void selectTier(tier.key)}>Select</button>
            </div>
          ))}
        </div>
        <button className="mt-5 text-sm underline" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
      </main>
      </div>
    </div>
  );
}


