import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { AnalyticsChart } from '../components/AnalyticsChart';
import { Navbar } from '../components/Navbar';
import { ProgressRing } from '../components/ProgressRing';
import { StatCard } from '../components/StatCard';
import { api } from '../lib/api';
import type { AnalyticsPoint, Notification, Plan, TrackingSummary } from '../types';

export default function DashboardPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [summary, setSummary] = useState<TrackingSummary | null>(null);
  const [weekly, setWeekly] = useState<AnalyticsPoint[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [p, s, w, n] = await Promise.all([
        api.get('/plan/today'),
        api.get('/tracking/summary'),
        api.get('/tracking/analytics/weekly'),
        api.get('/tracking/notifications'),
      ]);
      setPlan(p.data);
      setSummary(s.data);
      setWeekly(w.data);
      setNotifs(n.data);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <Navbar />
      <main className="w-full px-4 py-6 lg:px-8">
        <section className="panel-hero mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="chip mb-2">Daily command center</p>
              <h1 className="text-3xl font-black text-slate-900 md:text-4xl">Max Rep Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Track your nutrition, workout, hydration, and consistency in one place. Use the AI coach for automatic daily analysis.
              </p>
            </div>
            <Link to="/ai-performance" className="btn-primary">
              Open AI Coach
            </Link>
          </div>
        </section>

        {loading ? <div className="panel text-sm text-slate-500">Loading dashboard metrics...</div> : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <StatCard title="Target Calories" value={plan?.calorie_target ?? '-'} hint="Daily target" />
          <StatCard title="Calories Today" value={summary?.calories_consumed ?? 0} hint="Current logged intake" />
          <StatCard title="Deficit / Surplus" value={summary?.deficit_or_surplus ?? 0} hint="vs target" />
          <StatCard title="Consistency" value={summary?.consistency_score ?? 0} hint="Out of 100" />
          <StatCard title="Estimated Goal Days" value={plan?.estimated_days_to_goal ?? '-'} hint={`Target wt: ${plan?.target_weight_assumption_kg ?? '-'} kg`} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <ProgressRing label="Nutrients" percent={summary?.nutrient_completion_percent ?? 0} color="#b65c2d" />
          <ProgressRing label="Hydration" percent={summary?.water_completion_percent ?? 0} color="#1f6f78" />
          <ProgressRing label="Workout" percent={summary?.workout_completed ? 100 : 0} color="#5b7c3d" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AnalyticsChart data={weekly} title="Weekly Trend Snapshot" />
          <div className="panel">
            <h2 className="text-lg font-black text-slate-900">Roadmap and Alerts</h2>
            <p className="mt-2 text-sm text-slate-700">{plan?.roadmap}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {notifs.length > 0 ? (
                notifs.map((n) => (
                  <li key={n.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
                    <b>{n.title}:</b> {n.message}
                  </li>
                ))
              ) : (
                <li className="rounded-xl bg-emerald-50 p-3 text-emerald-700">No active alerts. Keep the streak going.</li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
