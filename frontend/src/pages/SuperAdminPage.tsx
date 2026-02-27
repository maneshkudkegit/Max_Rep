import { useEffect, useState } from 'react';

import { Navbar } from '../components/Navbar';
import { api } from '../lib/api';

interface Tenant {
  id: number;
  name: string;
  slug: string;
}

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [metrics, setMetrics] = useState({ tenants: 0, users: 0, subscriptions_active: 0 });

  useEffect(() => {
    void (async () => {
      const [t, m] = await Promise.all([
        api.get('/superadmin/tenants'),
        api.get('/superadmin/platform-metrics'),
      ]);
      setTenants(t.data);
      setMetrics(m.data);
    })();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="md:pl-64">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold">SuperAdmin Console</h1>
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded bg-white p-4 shadow-card">Tenants: {metrics.tenants}</div>
          <div className="rounded bg-white p-4 shadow-card">Users: {metrics.users}</div>
          <div className="rounded bg-white p-4 shadow-card">Active Subscriptions: {metrics.subscriptions_active}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-card">
          <h2 className="mb-2 text-xl font-semibold">Tenants</h2>
          <ul className="space-y-1 text-sm">{tenants.map((t) => <li key={t.id}>{t.name} ({t.slug})</li>)}</ul>
        </div>
      </main>
      </div>
    </div>
  );
}
