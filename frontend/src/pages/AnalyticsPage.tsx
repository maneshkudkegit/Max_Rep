import { useEffect, useMemo, useState } from 'react';

import { AnalyticsChart } from '../components/AnalyticsChart';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/StatCard';
import { api } from '../lib/api';
import { useAppSelector } from '../store/hooks';
import type { AdvancedAnalysis, AnalyticsPoint } from '../types';

export default function AnalyticsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [series, setSeries] = useState<AnalyticsPoint[]>([]);
  const [advanced, setAdvanced] = useState<AdvancedAnalysis | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');

  useEffect(() => {
    void (async () => {
      const res = await api.get(`/tracking/analytics?period=${period}`);
      setSeries(res.data);
      if (period !== 'yearly') {
        const adv = await api.get<AdvancedAnalysis>(`/tracking/advanced-analysis?period=${period}`);
        setAdvanced(adv.data);
      } else {
        setAdvanced(null);
      }
    })();
  }, [period]);

  const summary = useMemo(() => {
    if (series.length === 0) {
      return { avgConsistency: 0, avgCalories: 0, avgWater: 0 };
    }
    const totalConsistency = series.reduce((sum, p) => sum + p.consistency_score, 0);
    const totalCalories = series.reduce((sum, p) => sum + p.calories_consumed, 0);
    const totalWater = series.reduce((sum, p) => sum + p.water_ml, 0);
    return {
      avgConsistency: Math.round((totalConsistency / series.length) * 100) / 100,
      avgCalories: Math.round((totalCalories / series.length) * 100) / 100,
      avgWater: Math.round((totalWater / series.length) * 100) / 100,
    };
  }, [series]);

  return (
    <div>
      <Navbar />
      <div className="md:pl-0">
      <main className="main-with-sidebar">
        <div className="panel-hero mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="chip mb-2">Data intelligence</p>
            <h1 className="text-3xl font-black">Progress Analytics</h1>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
              <button key={p} className={`rounded px-3 py-1 text-sm ${period === p ? 'bg-brand text-white' : 'text-slate-600'}`} onClick={() => setPeriod(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard title="Average Consistency" value={summary.avgConsistency} hint={period} />
          <StatCard title="Average Calories" value={summary.avgCalories} hint={period} />
          <StatCard title="Average Water (ml)" value={summary.avgWater} hint={period} />
        </div>

        <AnalyticsChart data={series} title={`${period[0].toUpperCase()}${period.slice(1)} performance`} />

        {advanced ? (
          <section className="panel mt-4">
            <h2 className="text-xl font-black">Advanced Analysis</h2>
            <p className="mt-1 text-xs text-slate-500">
              Last updated: {advanced.last_updated_at ? new Date(advanced.last_updated_at).toLocaleString() : 'No update yet'}
              {' | '}
              Last recorded date: {advanced.last_recorded_date ?? 'No records'}
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {advanced.suggestions.map((item) => (
                <li key={item} className="rounded-xl bg-slate-50 p-3">
                  {user?.full_name ? `${user.full_name}, ` : ''}{item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      </div>
    </div>
  );
}


