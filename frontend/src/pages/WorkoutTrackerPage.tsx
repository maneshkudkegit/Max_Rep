import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Navbar } from '../components/Navbar';
import { SaveStatus } from '../components/SaveStatus';
import { api } from '../lib/api';
import type { AdvancedAnalysis, AnalyticsPoint, TrackingSummary, WorkoutLogItem } from '../types';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

const PERIOD_DAYS: Record<Period, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

const WORKOUT_OPTIONS = [
  'running',
  'walking',
  'cycling',
  'swimming',
  'jump rope',
  'treadmill',
  'elliptical',
  'rowing',
  'stair climber',
  'hiit',
  'squat',
  'deadlift',
  'bench press',
  'overhead press',
  'barbell row',
  'pull up',
  'push up',
  'lunges',
  'leg press',
  'plank',
  'yoga',
  'mobility',
];

function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function periodStartIso(period: Period): string {
  const start = new Date();
  start.setDate(start.getDate() - (PERIOD_DAYS[period] - 1));
  const year = start.getFullYear();
  const month = String(start.getMonth() + 1).padStart(2, '0');
  const day = String(start.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function inPeriod(dateStr: string, period: Period): boolean {
  const startIso = periodStartIso(period);
  const endIso = todayIso();
  return dateStr >= startIso && dateStr <= endIso;
}

function scoreLabel(percent: number): 'good' | 'moderate' | 'low' {
  if (percent >= 90) return 'good';
  if (percent >= 60) return 'moderate';
  return 'low';
}

export default function WorkoutTrackerPage() {
  const [period, setPeriod] = useState<Period>('daily');
  const [logs, setLogs] = useState<WorkoutLogItem[]>([]);
  const [summary, setSummary] = useState<TrackingSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsPoint[]>([]);
  const [advanced, setAdvanced] = useState<AdvancedAnalysis | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [lastDeleted, setLastDeleted] = useState<WorkoutLogItem | null>(null);
  const [draft, setDraft] = useState({
    date: todayIso(),
    category: 'cardio',
    name: '',
    sets: 3,
    reps: 10,
    duration_minutes: 20,
    calories_burned_kcal: 0,
    notes: '',
  });

  const loadBaseData = async () => {
    const [w, s] = await Promise.all([
      api.get<WorkoutLogItem[]>('/tracking/workouts/logs?period=yearly'),
      api.get<TrackingSummary>('/tracking/summary'),
    ]);
    setLogs(w.data);
    setSummary(s.data);
    setLastSyncedAt(new Date().toLocaleString());
  };

  const loadPeriodData = async (activePeriod: Period) => {
    const [a, adv] = await Promise.all([
      api.get<AnalyticsPoint[]>(`/tracking/analytics?period=${activePeriod}`),
      api.get<AdvancedAnalysis>(`/tracking/advanced-analysis?period=${activePeriod}`),
    ]);
    setAnalytics(a.data);
    setAdvanced(adv.data);
    setLastSyncedAt(new Date().toLocaleString());
  };

  useEffect(() => {
    void (async () => {
      await loadBaseData();
      await loadPeriodData(period);
    })();
  }, []);

  useEffect(() => {
    void loadPeriodData(period);
  }, [period]);

  const filteredLogs = useMemo(() => logs.filter((x) => inPeriod(x.date, period)), [logs, period]);
  const todayLogs = useMemo(() => logs.filter((x) => x.date === todayIso()), [logs]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, { burn: number; minutes: number; sessions: number }>();
    for (const log of filteredLogs) {
      const prev = map.get(log.date) ?? { burn: 0, minutes: 0, sessions: 0 };
      map.set(log.date, {
        burn: prev.burn + (log.calories_burned_kcal || 0),
        minutes: prev.minutes + (log.duration_minutes || 0),
        sessions: prev.sessions + 1,
      });
    }
    return Array.from(map.entries())
      .map(([date, val]) => ({ date, shortDate: date.slice(5), ...val }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [filteredLogs]);

  const totals = useMemo(() => {
    return filteredLogs.reduce(
      (acc, item) => {
        acc.burn += item.calories_burned_kcal || 0;
        acc.minutes += item.duration_minutes || 0;
        acc.sessions += 1;
        if (item.category === 'cardio') acc.cardioMinutes += item.duration_minutes || 0;
        if (item.category === 'strength') acc.strengthSessions += 1;
        return acc;
      },
      { burn: 0, minutes: 0, sessions: 0, cardioMinutes: 0, strengthSessions: 0 },
    );
  }, [filteredLogs]);

  const loggedDays = useMemo(() => new Set(filteredLogs.map((x) => x.date)).size, [filteredLogs]);
  const cardioTarget = loggedDays * 30;
  const cardioPercent = cardioTarget > 0 ? (totals.cardioMinutes / cardioTarget) * 100 : 0;
  const quality = scoreLabel(cardioPercent);

  const trendData = useMemo(() => {
    const consistencyMap = new Map(analytics.map((x) => [x.date, x.consistency_score]));
    const points = groupedByDate.map((x) => ({
      ...x,
      consistency: consistencyMap.get(x.date) ?? 0,
    }));
    const today = todayIso();
    const hasTodayPoint = points.some((p) => p.date === today);
    if (!hasTodayPoint && todayLogs.length > 0) {
      const agg = todayLogs.reduce(
        (acc, item) => {
          acc.burn += item.calories_burned_kcal || 0;
          acc.minutes += item.duration_minutes || 0;
          acc.sessions += 1;
          return acc;
        },
        { burn: 0, minutes: 0, sessions: 0 },
      );
      points.push({
        date: today,
        shortDate: today.slice(5),
        burn: agg.burn,
        minutes: agg.minutes,
        sessions: agg.sessions,
        consistency: summary?.consistency_score ?? 0,
      });
    }
    return points.sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [groupedByDate, analytics, todayLogs, summary?.consistency_score]);

  const toneClass = quality === 'good' ? 'bg-emerald-100 text-emerald-800' : quality === 'moderate' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800';

  const estimatedBurn = useMemo(() => {
    if (draft.calories_burned_kcal > 0) return draft.calories_burned_kcal;
    return Math.round((draft.duration_minutes || 0) * 7);
  }, [draft.calories_burned_kcal, draft.duration_minutes]);

  const saveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatus('saving');
      const payload = {
        ...draft,
        name: draft.name.trim().toLowerCase(),
        sets: draft.category === 'strength' ? draft.sets : null,
        reps: draft.category === 'strength' ? draft.reps : null,
        duration_minutes: draft.duration_minutes || null,
        calories_burned_kcal: draft.calories_burned_kcal > 0 ? draft.calories_burned_kcal : estimatedBurn,
        notes: draft.notes || null,
      };
      if (editingId) {
        await api.put(`/tracking/workouts/logs/${editingId}`, payload);
      } else {
        await api.post('/tracking/workouts/logs', payload);
      }
      setStatus('saved');
      window.dispatchEvent(new Event('maxrep-tracking-updated'));
      setEditingId(null);
      setDraft((p) => ({ ...p, date: todayIso(), name: '', sets: 3, reps: 10, duration_minutes: 20, calories_burned_kcal: 0, notes: '' }));
      await loadBaseData();
      await loadPeriodData(period);
    } catch {
      setStatus('error');
    }
  };

  const editLog = (item: WorkoutLogItem) => {
    setEditingId(item.id);
    setDraft({
      date: item.date,
      category: item.category,
      name: item.name,
      sets: item.sets ?? 3,
      reps: item.reps ?? 10,
      duration_minutes: item.duration_minutes ?? 20,
      calories_burned_kcal: item.calories_burned_kcal ?? 0,
      notes: item.notes ?? '',
    });
  };

  const deleteLog = async (id: number) => {
    const target = logs.find((x) => x.id === id) ?? null;
    await api.delete(`/tracking/workouts/logs/${id}`);
    setLastDeleted(target);
    window.dispatchEvent(new Event('maxrep-tracking-updated'));
    await loadBaseData();
    await loadPeriodData(period);
  };

  const undoDelete = async () => {
    if (!lastDeleted) return;
    await api.post('/tracking/workouts/logs', {
      date: lastDeleted.date,
      category: lastDeleted.category,
      name: lastDeleted.name,
      sets: lastDeleted.sets,
      reps: lastDeleted.reps,
      duration_minutes: lastDeleted.duration_minutes,
      calories_burned_kcal: lastDeleted.calories_burned_kcal,
      notes: lastDeleted.notes,
    });
    setLastDeleted(null);
    window.dispatchEvent(new Event('maxrep-tracking-updated'));
    await loadBaseData();
    await loadPeriodData(period);
  };

  return (
    <div>
      <Navbar />
      <div className="md:pl-0">
        <main className="main-with-sidebar">
          <section className="mb-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-[#86efac] via-[#67e8f9] to-[#c4b5fd] p-4">
            <h1 className="text-2xl font-black text-slate-900">Yeeh Please Enter Today's Workout</h1>
            <p className="text-sm text-slate-700">Track your workout calories, minutes, and progress for day/week/month/year.</p>
          </section>

          <section className="panel mb-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-black">Workout Analysis Center</h2>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
                  <button key={p} type="button" className={`rounded-full px-3 py-1 text-xs font-semibold ${period === p ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`} onClick={() => setPeriod(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Last Updated: {summary?.last_updated_at ? new Date(summary.last_updated_at).toLocaleString() : 'No update'}
              {' | '}
              Last Recorded Date: {summary?.last_recorded_date ?? 'No records'}
            </p>
            <p className="mb-3 text-xs text-slate-500">Latest Data Synced: {lastSyncedAt ?? 'Not synced yet'}</p>

            <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-6">
              <div className="rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 p-3"><p className="text-xs text-rose-700">Calories Burned</p><p className="text-2xl font-black text-rose-900">{totals.burn.toFixed(0)}</p></div>
              <div className="rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 p-3"><p className="text-xs text-amber-700">Workout Minutes</p><p className="text-2xl font-black text-amber-900">{totals.minutes.toFixed(0)}</p></div>
              <div className="rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 p-3"><p className="text-xs text-sky-700">Sessions</p><p className="text-2xl font-black text-sky-900">{totals.sessions}</p></div>
              <div className="rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 p-3"><p className="text-xs text-violet-700">Cardio Minutes</p><p className="text-2xl font-black text-violet-900">{totals.cardioMinutes.toFixed(0)}</p></div>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 p-3"><p className="text-xs text-emerald-700">Strength Sessions</p><p className="text-2xl font-black text-emerald-900">{totals.strengthSessions}</p></div>
              <div className="rounded-2xl bg-slate-100 p-3">
                <p className="text-xs text-slate-600">Cardio Quality</p>
                <p className="text-2xl font-black text-slate-900">{Math.round(cardioPercent)}%</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold uppercase ${toneClass}`}>{quality}</span>
              </div>
            </div>

            {period !== 'daily' ? (
              <p className="mb-2 text-xs text-slate-500">Quality is calculated only on logged days in this period: <b>{loggedDays}</b> (target 30 cardio mins/day)</p>
            ) : null}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="h-72 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="mb-2 text-sm font-bold text-slate-800">Burn & Consistency Trend</p>
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="burn" stroke="#ef4444" strokeWidth={3} />
                    <Line type="monotone" dataKey="consistency" stroke="#16a34a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="h-72 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="mb-2 text-sm font-bold text-slate-800">Workout Volume</p>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="minutes" fill="#0ea5e9" />
                    <Bar dataKey="sessions" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-900">Personal Suggestions</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {(advanced?.suggestions ?? []).map((item) => (
                  <li key={item} className="rounded-xl bg-white p-2">{item}</li>
                ))}
                {(advanced?.suggestions ?? []).length === 0 ? <li className="rounded-xl bg-white p-2">Add workouts to get better suggestions.</li> : null}
              </ul>
            </div>
          </section>

          <form onSubmit={saveWorkout} className="panel mb-4">
            <h2 className="mb-3 text-lg font-black">Workouts</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <label className="text-xs font-semibold text-slate-600">
                Date
                <input className="input-field mt-1" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Workout Type
                <select className="input-field mt-1" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                  <option value="cardio">cardio</option>
                  <option value="strength">strength</option>
                  <option value="custom">custom</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600 md:col-span-2">
                Workout Name
                <input className="input-field mt-1" list="workout-name-options" placeholder="e.g. running, squat" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                <datalist id="workout-name-options">
                  {WORKOUT_OPTIONS.map((name) => <option key={name} value={name} />)}
                </datalist>
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Duration (min)
                <input className="input-field mt-1" type="number" min={0} value={draft.duration_minutes} onChange={(e) => setDraft({ ...draft, duration_minutes: Number(e.target.value) })} />
              </label>

              <label className="text-xs font-semibold text-slate-600">
                Sets
                <input className="input-field mt-1" type="number" min={0} value={draft.sets} onChange={(e) => setDraft({ ...draft, sets: Number(e.target.value) })} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Reps
                <input className="input-field mt-1" type="number" min={0} value={draft.reps} onChange={(e) => setDraft({ ...draft, reps: Number(e.target.value) })} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Calories Burned
                <input className="input-field mt-1" type="number" min={0} value={draft.calories_burned_kcal} onChange={(e) => setDraft({ ...draft, calories_burned_kcal: Number(e.target.value) })} />
                <span className="mt-1 block text-[11px] font-medium text-slate-500">Auto estimate if left 0: {estimatedBurn} kcal</span>
              </label>
              <label className="text-xs font-semibold text-slate-600 md:col-span-2">
                Notes
                <input className="input-field mt-1" placeholder="Optional notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-primary">{editingId ? 'Update Workout' : 'Add Workout'}</button>
              {editingId ? <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>Undo Edit</button> : null}
              {lastDeleted ? <button type="button" className="btn-secondary" onClick={() => void undoDelete()}>Undo Remove</button> : null}
            </div>
            <div className="mt-2"><SaveStatus status={status} successText="Workout saved and dashboard updated." /></div>
          </form>

          <section className="panel">
            <h2 className="mb-2 text-lg font-black">Today's Workouts ({todayIso()})</h2>
            {todayLogs.length === 0 ? (
              <p className="text-sm text-slate-500">No workout logged today.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {todayLogs.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p><b>{item.category}</b> | {item.name} | {item.duration_minutes ?? 0} min | burn {item.calories_burned_kcal} kcal</p>
                        <p className="text-xs text-slate-500">Date: {item.date} | Updated: {new Date(item.updated_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="text-xs text-slate-700" onClick={() => editLog(item)}>Edit</button>
                        <button type="button" className="text-xs text-rose-700" onClick={() => void deleteLog(item.id)}>Delete</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}


