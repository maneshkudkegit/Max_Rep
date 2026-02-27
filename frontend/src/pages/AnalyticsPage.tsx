import { useEffect, useMemo, useState } from 'react';

import { AnalyticsChart } from '../components/AnalyticsChart';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/StatCard';
import { api } from '../lib/api';
import type { AnalyticsPoint } from '../types';

export default function AnalyticsPage() {
  const [weekly, setWeekly] = useState<AnalyticsPoint[]>([]);
  const [monthly, setMonthly] = useState<AnalyticsPoint[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    void (async () => {
      const [w, m] = await Promise.all([
        api.get('/tracking/analytics/weekly'),
        api.get('/tracking/analytics/monthly'),
      ]);
      setWeekly(w.data);
      setMonthly(m.data);
    })();
  }, []);

  const active = period === 'weekly' ? weekly : monthly;

  const summary = useMemo(() => {
    if (active.length === 0) {
      return { avgConsistency: 0, avgCalories: 0, avgWater: 0 };
    }
    const totalConsistency = active.reduce((sum, p) => sum + p.consistency_score, 0);
    const totalCalories = active.reduce((sum, p) => sum + p.calories_consumed, 0);
    const totalWater = active.reduce((sum, p) => sum + p.water_ml, 0);
    return {
      avgConsistency: Math.round((totalConsistency / active.length) * 100) / 100,
      avgCalories: Math.round((totalCalories / active.length) * 100) / 100,
      avgWater: Math.round((totalWater / active.length) * 100) / 100,
    };
  }, [active]);

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="panel-hero mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="chip mb-2">Data intelligence</p>
            <h1 className="text-3xl font-black">Progress Analytics</h1>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              className={`rounded px-3 py-1 text-sm ${period === 'weekly' ? 'bg-brand text-white' : 'text-slate-600'}`}
              onClick={() => setPeriod('weekly')}
            >
              Weekly
            </button>
            <button
              className={`rounded px-3 py-1 text-sm ${period === 'monthly' ? 'bg-brand text-white' : 'text-slate-600'}`}
              onClick={() => setPeriod('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard title="Average Consistency" value={summary.avgConsistency} hint={period} />
          <StatCard title="Average Calories" value={summary.avgCalories} hint={period} />
          <StatCard title="Average Water (ml)" value={summary.avgWater} hint={period} />
        </div>

        <AnalyticsChart data={active} title={period === 'weekly' ? 'Weekly performance' : 'Monthly performance'} />
      </main>
    </div>
  );
}
