import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Navbar } from '../components/Navbar';
import { SaveStatus } from '../components/SaveStatus';
import { api } from '../lib/api';
import type { AdvancedAnalysis, AnalyticsPoint, CustomFoodItem, MealLogItem, PerformanceAnalysisResponse, TrackingSummary } from '../types';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

type FoodPreset = {
  name: string;
  unit: string;
  calories_per_unit: number;
  protein_per_unit: number;
  carbs_per_unit: number;
  fats_per_unit: number;
  meals: string[];
};

type QuantityConfig = {
  min: number;
  step: number;
  label: string;
};

const ALL_MEALS = ['breakfast', 'lunch', 'dinner', 'evening_snacks', 'mid_morning_snack', 'pre_workout', 'post_workout'];

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'evening_snacks', label: 'Evening Snacks' },
  { value: 'mid_morning_snack', label: 'Mid Morning Snack' },
  { value: 'pre_workout', label: 'Pre Workout' },
  { value: 'post_workout', label: 'Post Workout' },
];

const UNIT_OPTIONS = ['g', '10g', 'ml', 'piece', 'cup', 'bowl', 'tbsp', 'tsp', 'slice', 'plate', 'serving', 'scoop'];

const FOOD_PRESETS: FoodPreset[] = [
  { name: 'oats', unit: '50g', calories_per_unit: 194, protein_per_unit: 8.4, carbs_per_unit: 33, fats_per_unit: 3.5, meals: ALL_MEALS },
  { name: 'muesli', unit: '50g', calories_per_unit: 190, protein_per_unit: 6, carbs_per_unit: 33, fats_per_unit: 4, meals: ALL_MEALS },
  { name: 'cornflakes', unit: '30g', calories_per_unit: 114, protein_per_unit: 2.4, carbs_per_unit: 25, fats_per_unit: 0.3, meals: ALL_MEALS },
  { name: 'egg', unit: 'piece', calories_per_unit: 78, protein_per_unit: 6.3, carbs_per_unit: 0.6, fats_per_unit: 5.3, meals: ALL_MEALS },
  { name: 'milk', unit: '250ml', calories_per_unit: 155, protein_per_unit: 8, carbs_per_unit: 12, fats_per_unit: 8, meals: ALL_MEALS },
  { name: 'banana', unit: 'piece', calories_per_unit: 105, protein_per_unit: 1.3, carbs_per_unit: 27, fats_per_unit: 0.4, meals: ALL_MEALS },
  { name: 'apple', unit: 'piece', calories_per_unit: 95, protein_per_unit: 0.5, carbs_per_unit: 25, fats_per_unit: 0.3, meals: ALL_MEALS },
  { name: 'orange', unit: 'piece', calories_per_unit: 62, protein_per_unit: 1.2, carbs_per_unit: 15, fats_per_unit: 0.2, meals: ALL_MEALS },
  { name: 'bread', unit: 'slice', calories_per_unit: 70, protein_per_unit: 2.5, carbs_per_unit: 12, fats_per_unit: 1, meals: ALL_MEALS },
  { name: 'peanut butter', unit: 'tbsp', calories_per_unit: 95, protein_per_unit: 4, carbs_per_unit: 3, fats_per_unit: 8, meals: ALL_MEALS },
  { name: 'greek yogurt', unit: '100g', calories_per_unit: 97, protein_per_unit: 9, carbs_per_unit: 3.6, fats_per_unit: 5, meals: ALL_MEALS },
  { name: 'paneer', unit: '100g', calories_per_unit: 265, protein_per_unit: 18, carbs_per_unit: 6, fats_per_unit: 20, meals: ALL_MEALS },
  { name: 'tofu', unit: '100g', calories_per_unit: 144, protein_per_unit: 17, carbs_per_unit: 3, fats_per_unit: 8, meals: ALL_MEALS },
  { name: 'chicken breast', unit: '100g', calories_per_unit: 165, protein_per_unit: 31, carbs_per_unit: 0, fats_per_unit: 3.6, meals: ALL_MEALS },
  { name: 'fish', unit: '100g', calories_per_unit: 206, protein_per_unit: 22, carbs_per_unit: 0, fats_per_unit: 12, meals: ALL_MEALS },
  { name: 'rice', unit: 'cup', calories_per_unit: 205, protein_per_unit: 4.3, carbs_per_unit: 45, fats_per_unit: 0.4, meals: ALL_MEALS },
  { name: 'brown rice', unit: 'cup', calories_per_unit: 216, protein_per_unit: 5, carbs_per_unit: 45, fats_per_unit: 1.8, meals: ALL_MEALS },
  { name: 'quinoa', unit: 'cup', calories_per_unit: 222, protein_per_unit: 8, carbs_per_unit: 39, fats_per_unit: 3.6, meals: ALL_MEALS },
  { name: 'roti', unit: 'piece', calories_per_unit: 120, protein_per_unit: 3, carbs_per_unit: 20, fats_per_unit: 2.5, meals: ALL_MEALS },
  { name: 'lentils', unit: 'cup', calories_per_unit: 230, protein_per_unit: 18, carbs_per_unit: 40, fats_per_unit: 0.8, meals: ALL_MEALS },
  { name: 'chickpeas', unit: 'cup', calories_per_unit: 269, protein_per_unit: 14.5, carbs_per_unit: 45, fats_per_unit: 4, meals: ALL_MEALS },
  { name: 'kidney beans', unit: 'cup', calories_per_unit: 225, protein_per_unit: 15, carbs_per_unit: 40, fats_per_unit: 0.9, meals: ALL_MEALS },
  { name: 'potato', unit: '100g', calories_per_unit: 77, protein_per_unit: 2, carbs_per_unit: 17, fats_per_unit: 0.1, meals: ALL_MEALS },
  { name: 'sweet potato', unit: '100g', calories_per_unit: 86, protein_per_unit: 1.6, carbs_per_unit: 20, fats_per_unit: 0.1, meals: ALL_MEALS },
  { name: 'almonds', unit: '10g', calories_per_unit: 58, protein_per_unit: 2, carbs_per_unit: 2, fats_per_unit: 5, meals: ALL_MEALS },
  { name: 'walnuts', unit: '10g', calories_per_unit: 65, protein_per_unit: 1.5, carbs_per_unit: 1.3, fats_per_unit: 6.5, meals: ALL_MEALS },
  { name: 'whey protein', unit: 'scoop', calories_per_unit: 120, protein_per_unit: 24, carbs_per_unit: 3, fats_per_unit: 1.5, meals: ALL_MEALS },
  { name: 'salad', unit: 'bowl', calories_per_unit: 80, protein_per_unit: 2.5, carbs_per_unit: 12, fats_per_unit: 2, meals: ALL_MEALS },
  { name: 'mixed vegetables', unit: 'bowl', calories_per_unit: 120, protein_per_unit: 4, carbs_per_unit: 20, fats_per_unit: 2.5, meals: ALL_MEALS },
  { name: 'avocado', unit: '100g', calories_per_unit: 160, protein_per_unit: 2, carbs_per_unit: 9, fats_per_unit: 15, meals: ALL_MEALS },
  { name: 'cheese', unit: '30g', calories_per_unit: 120, protein_per_unit: 7, carbs_per_unit: 1, fats_per_unit: 10, meals: ALL_MEALS },
];

const PERIOD_DAYS: Record<Period, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

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

function scoreLabel(deltaPercent: number): 'good' | 'moderate' | 'low' {
  const abs = Math.abs(deltaPercent);
  if (abs <= 5) return 'good';
  if (abs <= 15) return 'moderate';
  return 'low';
}

function quantityConfigFor(foodName: string, unit: string): QuantityConfig {
  const name = foodName.trim().toLowerCase();
  if (unit === '10g' || name === 'almonds' || name === 'walnuts') {
    return { min: 1, step: 1, label: '1 = 10g' };
  }
  if (unit === 'g' || unit === 'ml') {
    return { min: 10, step: 10, label: '10 step' };
  }
  return { min: 0.5, step: 0.5, label: '0.5 step' };
}

export default function MealTrackerPage() {
  const [defaultFoods, setDefaultFoods] = useState<CustomFoodItem[]>([]);
  const [customFoods, setCustomFoods] = useState<CustomFoodItem[]>([]);
  const [logs, setLogs] = useState<MealLogItem[]>([]);
  const [period, setPeriod] = useState<Period>('daily');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [summary, setSummary] = useState<TrackingSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsPoint[]>([]);
  const [advanced, setAdvanced] = useState<AdvancedAnalysis | null>(null);
  const [analysis, setAnalysis] = useState<PerformanceAnalysisResponse | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [lastDeleted, setLastDeleted] = useState<MealLogItem | null>(null);
  const [lastPromptedFood, setLastPromptedFood] = useState('');
  const [draft, setDraft] = useState({
    date: todayIso(),
    meal_type: 'breakfast',
    food_name: '',
    quantity: 1,
    unit: 'serving',
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0,
    source: 'default',
  });

  const loadBaseData = async () => {
    const [defaults, custom, mealLogs, s] = await Promise.all([
      api.get<CustomFoodItem[]>('/tracking/foods/default'),
      api.get<CustomFoodItem[]>('/tracking/foods/custom'),
      api.get<MealLogItem[]>('/tracking/meals/logs?period=yearly'),
      api.get<TrackingSummary>('/tracking/summary'),
    ]);
    setDefaultFoods(defaults.data);
    setCustomFoods(custom.data);
    setLogs(mealLogs.data);
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

  const presetMap = useMemo(() => {
    const map = new Map<string, FoodPreset>();
    for (const item of FOOD_PRESETS) {
      map.set(item.name.toLowerCase(), item);
    }
    return map;
  }, []);

  const customMap = useMemo(() => {
    const map = new Map<string, CustomFoodItem>();
    for (const item of customFoods) {
      map.set(item.name.toLowerCase(), item);
    }
    return map;
  }, [customFoods]);

  const filteredLogs = useMemo(() => logs.filter((x) => inPeriod(x.date, period)), [logs, period]);
  const todayLogs = useMemo(() => logs.filter((x) => x.date === todayIso()), [logs]);

  const mealFoodOptions = useMemo(() => {
    const presetNames = FOOD_PRESETS.filter((x) => x.meals.includes(draft.meal_type)).map((x) => x.name.toLowerCase());
    const customNames = customFoods.map((x) => x.name.toLowerCase());
    return Array.from(new Set([...presetNames, ...customNames])).sort();
  }, [draft.meal_type, customFoods]);

  const totals = useMemo(() => {
    return filteredLogs.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein_g;
        acc.carbs += item.carbs_g;
        acc.fats += item.fats_g;
        acc.entries += 1;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0, entries: 0 },
    );
  }, [filteredLogs]);

  const loggedDays = useMemo(() => {
    return new Set(filteredLogs.map((x) => x.date)).size;
  }, [filteredLogs]);

  const expectedCalories = useMemo(() => {
    const target = summary?.calorie_target ?? 0;
    if (period === 'daily') return target;
    return target * loggedDays;
  }, [summary?.calorie_target, period, loggedDays]);

  const calorieDelta = totals.calories - expectedCalories;
  const deltaPercent = expectedCalories > 0 ? (calorieDelta / expectedCalories) * 100 : 0;
  const qualityScore = scoreLabel(deltaPercent);
  const quantityConfig = useMemo(() => quantityConfigFor(draft.food_name, draft.unit), [draft.food_name, draft.unit]);

  const chartData = useMemo(() => {
    const points = analytics.map((x) => ({
      date: x.date,
      shortDate: x.date.slice(5),
      calories: x.calories_consumed,
      protein: x.protein_g,
      carbs: x.carbs_g,
      fats: x.fats_g,
      consistency: x.consistency_score,
    }));
    const today = todayIso();
    const hasTodayPoint = points.some((p) => p.date === today);
    if (!hasTodayPoint && todayLogs.length > 0) {
      const agg = todayLogs.reduce(
        (acc, item) => {
          acc.calories += item.calories;
          acc.protein += item.protein_g;
          acc.carbs += item.carbs_g;
          acc.fats += item.fats_g;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fats: 0 },
      );
      points.push({
        date: today,
        shortDate: today.slice(5),
        calories: agg.calories,
        protein: agg.protein,
        carbs: agg.carbs,
        fats: agg.fats,
        consistency: summary?.consistency_score ?? 0,
      });
    }
    return points.sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [analytics, todayLogs, summary?.consistency_score]);

  const applyFoodMacros = (name: string, quantityValue: number) => {
    const key = name.trim().toLowerCase();
    const preset = presetMap.get(key);
    const custom = customMap.get(key);
    if (!preset && !custom) return;
    const base = custom
      ? {
          unit: custom.unit,
          calories_per_unit: custom.calories_per_unit,
          protein_per_unit: custom.protein_per_unit,
          carbs_per_unit: custom.carbs_per_unit,
          fats_per_unit: custom.fats_per_unit,
          source: 'custom',
        }
      : {
          unit: preset!.unit,
          calories_per_unit: preset!.calories_per_unit,
          protein_per_unit: preset!.protein_per_unit,
          carbs_per_unit: preset!.carbs_per_unit,
          fats_per_unit: preset!.fats_per_unit,
          source: 'default',
        };
    const cfg = quantityConfigFor(key, base.unit);
    const qtyRaw = quantityValue > 0 ? quantityValue : cfg.min;
    const qty = Math.max(qtyRaw, cfg.min);
    setDraft((p) => ({
      ...p,
      food_name: key,
      quantity: qty,
      unit: base.unit,
      calories: Number((base.calories_per_unit * qty).toFixed(2)),
      protein_g: Number((base.protein_per_unit * qty).toFixed(2)),
      carbs_g: Number((base.carbs_per_unit * qty).toFixed(2)),
      fats_g: Number((base.fats_per_unit * qty).toFixed(2)),
      source: base.source,
    }));
  };

  const promptAndAddUnknownFood = async (): Promise<boolean> => {
    const typed = draft.food_name.trim().toLowerCase();
    if (!typed) return false;
    if (presetMap.has(typed) || customMap.has(typed)) return true;
    if (typed === lastPromptedFood) return false;
    setLastPromptedFood(typed);
    const shouldAdd = window.confirm(`"${typed}" is not in the list. Do you want to add it?`);
    if (!shouldAdd) return false;
    const qty = draft.quantity > 0 ? draft.quantity : 1;
    await api.post('/tracking/foods/custom', {
      name: typed,
      unit: draft.unit || 'serving',
      calories_per_unit: Number((draft.calories / qty).toFixed(2)),
      protein_per_unit: Number((draft.protein_g / qty).toFixed(2)),
      carbs_per_unit: Number((draft.carbs_g / qty).toFixed(2)),
      fats_per_unit: Number((draft.fats_g / qty).toFixed(2)),
    });
    await loadBaseData();
    return true;
  };

  const saveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatus('saving');
      if (!draft.food_name.trim()) {
        setStatus('error');
        return;
      }
      if (draft.quantity < quantityConfig.min) {
        setStatus('error');
        return;
      }
      const exists = presetMap.has(draft.food_name.toLowerCase()) || customMap.has(draft.food_name.toLowerCase());
      if (!exists) {
        const added = await promptAndAddUnknownFood();
        if (!added) {
          setStatus('error');
          return;
        }
      }
      if (editingId) {
        await api.put(`/tracking/meals/logs/${editingId}`, draft);
      } else {
        await api.post('/tracking/meals/logs', draft);
      }
      setStatus('saved');
      window.dispatchEvent(new Event('maxrep-tracking-updated'));
      setEditingId(null);
      setDraft((p) => ({ ...p, date: todayIso(), food_name: '', quantity: 1, calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0, source: 'default' }));
      await loadBaseData();
      await loadPeriodData(period);
    } catch {
      setStatus('error');
    }
  };

  const editLog = (item: MealLogItem) => {
    setEditingId(item.id);
    setDraft({
      date: item.date,
      meal_type: item.meal_type,
      food_name: item.food_name,
      quantity: item.quantity,
      unit: item.unit,
      calories: item.calories,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fats_g: item.fats_g,
      source: item.source,
    });
  };

  const deleteLog = async (id: number) => {
    const target = logs.find((x) => x.id === id) ?? null;
    await api.delete(`/tracking/meals/logs/${id}`);
    setLastDeleted(target);
    window.dispatchEvent(new Event('maxrep-tracking-updated'));
    await loadBaseData();
    await loadPeriodData(period);
  };

  const undoDelete = async () => {
    if (!lastDeleted) return;
    await api.post('/tracking/meals/logs', {
      date: lastDeleted.date,
      meal_type: lastDeleted.meal_type,
      food_name: lastDeleted.food_name,
      quantity: lastDeleted.quantity,
      unit: lastDeleted.unit,
      calories: lastDeleted.calories,
      protein_g: lastDeleted.protein_g,
      carbs_g: lastDeleted.carbs_g,
      fats_g: lastDeleted.fats_g,
      source: lastDeleted.source,
    });
    setLastDeleted(null);
    window.dispatchEvent(new Event('maxrep-tracking-updated'));
    await loadBaseData();
    await loadPeriodData(period);
  };

  const analyzeMeals = async () => {
    const sourceLogs = period === 'daily' ? todayLogs : filteredLogs;
    const entryText = sourceLogs.map((x) => `${x.date} ${x.meal_type}: ${x.quantity} ${x.unit} ${x.food_name}`).join('. ');
    if (!entryText) return;
    const res = await api.post<PerformanceAnalysisResponse>('/tracking/performance-report', {
      entry_text: entryText,
      save_to_daily_log: false,
    });
    setAnalysis(res.data);
  };

  const toneClass = qualityScore === 'good' ? 'bg-emerald-100 text-emerald-800' : qualityScore === 'moderate' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800';

  return (
    <div>
      <Navbar />
      <div className="md:pl-0">
        <main className="main-with-sidebar">
          <section className="mb-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-[#fdba74] via-[#f9a8d4] to-[#93c5fd] p-4">
            <h1 className="text-2xl font-black text-slate-900">Yeeh Please Enter Today's Meal</h1>
            <p className="text-sm text-slate-700">Complete your today meal and track whole day/week/month/year calories.</p>
          </section>

          <section className="panel mb-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-black">Meal Analysis Center</h2>
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
              <div className="rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 p-3"><p className="text-xs text-rose-700">Total Calories</p><p className="text-2xl font-black text-rose-900">{totals.calories.toFixed(0)}</p></div>
              <div className="rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 p-3"><p className="text-xs text-amber-700">Protein</p><p className="text-2xl font-black text-amber-900">{totals.protein.toFixed(1)}g</p></div>
              <div className="rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 p-3"><p className="text-xs text-sky-700">Carbs</p><p className="text-2xl font-black text-sky-900">{totals.carbs.toFixed(1)}g</p></div>
              <div className="rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 p-3"><p className="text-xs text-violet-700">Fats</p><p className="text-2xl font-black text-violet-900">{totals.fats.toFixed(1)}g</p></div>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 p-3"><p className="text-xs text-emerald-700">Target</p><p className="text-2xl font-black text-emerald-900">{expectedCalories.toFixed(0)}</p></div>
              <div className="rounded-2xl bg-slate-100 p-3">
                <p className="text-xs text-slate-600">Deficit / Surplus</p>
                <p className="text-2xl font-black text-slate-900">{calorieDelta >= 0 ? '+' : ''}{calorieDelta.toFixed(0)}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold uppercase ${toneClass}`}>{qualityScore}</span>
              </div>
            </div>
            {period !== 'daily' ? (
              <p className="mb-2 text-xs text-slate-500">Target is calculated only for logged days in this period: <b>{loggedDays}</b></p>
            ) : null}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="h-72 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="mb-2 text-sm font-bold text-slate-800">Calories Trend</p>
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={summary?.calorie_target ?? 0} stroke="#ef4444" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="calories" stroke="#0284c7" strokeWidth={3} />
                    <Line type="monotone" dataKey="consistency" stroke="#16a34a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="h-72 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="mb-2 text-sm font-bold text-slate-800">Macro Profile</p>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="protein" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="carbs" stackId="a" fill="#0ea5e9" />
                    <Bar dataKey="fats" stackId="a" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-bold text-slate-900">AI Suggestions</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  {(advanced?.suggestions ?? []).map((item) => (
                    <li key={item} className="rounded-xl bg-white p-2">{item}</li>
                  ))}
                  {(advanced?.suggestions ?? []).length === 0 ? <li className="rounded-xl bg-white p-2">Add meals to get personalized suggestions.</li> : null}
                </ul>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">Detailed Meal Analysis</p>
                  <button type="button" className="btn-secondary" onClick={() => void analyzeMeals()}>Run Analysis</button>
                </div>
                {analysis ? (
                  <div className="mt-2 space-y-2 text-sm text-slate-700">
                    <p>Nutrition score: <b>{analysis.nutrition_report.nutrition_quality_score}</b></p>
                    <p>Calorie status: <b className="capitalize">{analysis.nutrition_report.calorie_balance_label}</b></p>
                    <p>Protein adequacy: <b>{analysis.nutrition_report.protein_adequacy_status}</b></p>
                    <p>Calories: <b>{analysis.nutrition_report.total_calories_kcal}</b> | Protein: <b>{analysis.nutrition_report.total_protein_g}g</b> | Carbs: <b>{analysis.nutrition_report.total_carbs_g}g</b> | Fats: <b>{analysis.nutrition_report.total_fats_g}g</b></p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">Run analysis to see full nutrient summary.</p>
                )}
              </div>
            </div>
          </section>

          <form className="panel mb-4" onSubmit={saveMeal}>
            <h2 className="mb-3 text-lg font-black">Meals</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <label className="text-xs font-semibold text-slate-600">
                Date
                <input className="input-field mt-1" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Select Meal
                <select className="input-field mt-1" value={draft.meal_type} onChange={(e) => setDraft({ ...draft, meal_type: e.target.value })}>
                  {MEAL_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Select Food (20+)
                <select className="input-field mt-1" value={draft.food_name} onChange={(e) => applyFoodMacros(e.target.value, draft.quantity)}>
                  <option value="">Choose food</option>
                  {mealFoodOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600 md:col-span-2">
                Type New Food
                <input
                  className="input-field mt-1"
                  placeholder="Type food name if not in list"
                  value={draft.food_name}
                  onChange={(e) => setDraft({ ...draft, food_name: e.target.value })}
                />
              </label>

              <label className="text-xs font-semibold text-slate-600">
                Quantity
                <input
                  className="input-field mt-1"
                  type="number"
                  min={quantityConfig.min}
                  step={quantityConfig.step}
                  value={draft.quantity}
                  onChange={(e) => {
                    const qty = Number(e.target.value);
                    setDraft((p) => ({ ...p, quantity: qty }));
                    applyFoodMacros(draft.food_name, qty);
                  }}
                />
                <span className="mt-1 block text-[11px] font-medium text-slate-500">{quantityConfig.label}</span>
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Unit
                <select className="input-field mt-1" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })}>
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Calories
                <input className="input-field mt-1" type="number" value={draft.calories} onChange={(e) => setDraft({ ...draft, calories: Number(e.target.value) })} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Protein (g)
                <input className="input-field mt-1" type="number" value={draft.protein_g} onChange={(e) => setDraft({ ...draft, protein_g: Number(e.target.value) })} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Carbs (g)
                <input className="input-field mt-1" type="number" value={draft.carbs_g} onChange={(e) => setDraft({ ...draft, carbs_g: Number(e.target.value) })} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Fats (g)
                <input className="input-field mt-1" type="number" value={draft.fats_g} onChange={(e) => setDraft({ ...draft, fats_g: Number(e.target.value) })} />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-primary">{editingId ? 'Update Meal' : 'Add Meal'}</button>
              {editingId ? <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>Undo Edit</button> : null}
              {lastDeleted ? <button type="button" className="btn-secondary" onClick={() => void undoDelete()}>Undo Remove</button> : null}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-300" onClick={() => { void promptAndAddUnknownFood(); }} title="Add typed food">
                +
              </button>
              <span className="text-xs text-slate-500">Quick add typed food to standard meal list</span>
            </div>

            <div className="mt-2">
              <SaveStatus status={status} successText="Meal saved and dashboard updated." />
            </div>
          </form>

          <section className="panel">
            <h2 className="mb-2 text-lg font-black">Today's Meals ({todayIso()})</h2>
            {todayLogs.length === 0 ? (
              <p className="text-sm text-slate-500">No meals logged today.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {todayLogs.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p><b>{item.meal_type}</b> | {item.quantity} {item.unit} {item.food_name} | kcal {item.calories} | P {item.protein_g} C {item.carbs_g} F {item.fats_g}</p>
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


