import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { AnalyticsChart } from '../components/AnalyticsChart';
import { Navbar } from '../components/Navbar';
import { ProgressRing } from '../components/ProgressRing';
import { StatCard } from '../components/StatCard';
import { api } from '../lib/api';
import { useAppSelector } from '../store/hooks';
import type { AnalyticsPoint, Notification, Plan, TrackingSummary } from '../types';

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [summary, setSummary] = useState<TrackingSummary | null>(null);
  const [series, setSeries] = useState<AnalyticsPoint[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');

  const loadDashboard = async () => {
    const [p, s, a, n] = await Promise.all([
      api.get('/plan/today'),
      api.get('/tracking/summary'),
      api.get(`/tracking/analytics?period=${period}`),
      api.get('/tracking/notifications'),
    ]);
    setPlan(p.data);
    setSummary(s.data);
    setSeries(a.data);
    setNotifs(n.data);
    setLoading(false);
  };

  useEffect(() => {
    void (async () => {
      await loadDashboard();
    })();
    const onTrackingUpdate = () => {
      void loadDashboard();
    };
    window.addEventListener('maxrep-tracking-updated', onTrackingUpdate);
    const timer = window.setInterval(() => {
      void loadDashboard();
    }, 30000);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('maxrep-tracking-updated', onTrackingUpdate);
    };
  }, [period]);

  return (
    <div>
      <Navbar />
      <div className="md:pl-0">
        <main className="main-with-sidebar">
          <section className="panel-hero mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="chip mb-2">Daily command center</p>
              <h1 className="text-3xl font-black text-slate-900 md:text-4xl">Max Rep Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Track your nutrition, workout, hydration, and consistency in one place. Use the AI coach for automatic daily analysis.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Last updated: {summary?.last_updated_at ? new Date(summary.last_updated_at).toLocaleString() : 'No update yet'}
                {' | '}
                Last recorded date: {summary?.last_recorded_date ?? 'No records'}
              </p>
            </div>
            <Link to="/ai-performance" className="btn-primary">
              Open AI Coach
            </Link>
          </div>
        </section>

          {user?.profile_completion_tips?.length ? (
            <section className="panel mb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">Finish your Settings</h2>
                  <p className="text-sm text-slate-600">Complete profile for better personalized recommendations.</p>
                </div>
                <Link to="/settings" className="btn-secondary">Open Settings</Link>
              </div>
            </section>
          ) : null}

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
            <div>
              <div className="mb-2 flex gap-2">
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
                  <button key={p} className={`rounded px-3 py-1 text-xs ${period === p ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`} onClick={() => setPeriod(p)}>
                    {p}
                  </button>
                ))}
              </div>
              <AnalyticsChart data={series} title={`${period[0].toUpperCase()}${period.slice(1)} Trend Snapshot`} />
            </div>
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
    </div>
  );
}


