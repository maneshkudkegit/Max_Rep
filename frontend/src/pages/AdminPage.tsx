import { useEffect, useState } from 'react';

import { Navbar } from '../components/Navbar';
import { api } from '../lib/api';

interface MemberRow {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  tier: string;
  average_consistency: number;
}

export default function AdminPage() {
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [tier, setTier] = useState('');

  useEffect(() => {
    void (async () => {
      const url = tier ? `/admin/members?tier=${tier}` : '/admin/members';
      const res = await api.get(url);
      setRows(res.data);
    })();
  }, [tier]);

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="panel-hero mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-black">Gym Admin Panel</h1>
          <select className="input-field w-auto" value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="">All tiers</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div className="panel overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Name</th>
                <th className="py-2 text-left">Email</th>
                <th className="py-2 text-left">Role</th>
                <th className="py-2 text-left">Tier</th>
                <th className="py-2 text-left">Avg Consistency</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr className="border-b" key={r.user_id}>
                  <td className="py-2">{r.full_name}</td>
                  <td className="py-2">{r.email}</td>
                  <td className="py-2">{r.role}</td>
                  <td className="py-2">{r.tier}</td>
                  <td className="py-2">{r.average_consistency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
