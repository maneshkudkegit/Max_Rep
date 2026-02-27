import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Navbar } from '../components/Navbar';
import { SaveStatus } from '../components/SaveStatus';
import { api } from '../lib/api';
import type { PerformanceAnalysisResponse } from '../types';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'evening_snacks' | 'pre_workout' | 'post_workout';
type PortionUnit = 'g' | 'piece' | 'cup' | 'bowl' | 'slice' | 'scoop' | 'serving';

interface MealEntry {
  id: string;
  mealType: MealType;
  foodName: string;
  quantity: number;
  unit: PortionUnit;
}

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'evening_snacks', label: 'Evening Snacks' },
  { value: 'pre_workout', label: 'Pre-Workout' },
  { value: 'post_workout', label: 'Post-Workout' },
];

const FOOD_OPTIONS = [
  'egg',
  'chicken breast',
  'rice',
  'oats',
  'banana',
  'apple',
  'whole wheat bread',
  'paneer',
  'greek yogurt',
  'milk',
  'whey protein',
  'almonds',
  'peanut butter',
  'salad',
  'potato',
  'fish',
  'lentils',
  'pasta',
  'roti',
  'cheese',
];

const FOOD_SET = new Set(FOOD_OPTIONS);

function entryToText(entry: MealEntry): string {
  return `${entry.quantity} ${entry.unit} ${entry.foodName}`;
}

export default function MealTrackerPage() {
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [draft, setDraft] = useState<MealEntry>({
    id: 'draft',
    mealType: 'breakfast',
    foodName: '',
    quantity: 1,
    unit: 'piece',
  });
  const [payload, setPayload] = useState({ calories_consumed: 0, protein_g: 0, carbs_g: 0, fats_g: 0, meals_completed: 0 });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<PerformanceAnalysisResponse | null>(null);

  const groupedSummary = useMemo(() => {
    const grouped = new Map<MealType, string[]>();
    for (const e of entries) {
      const prev = grouped.get(e.mealType) ?? [];
      prev.push(entryToText(e));
      grouped.set(e.mealType, prev);
    }
    return MEAL_OPTIONS.map((m) => ({ ...m, items: grouped.get(m.value) ?? [] })).filter((m) => m.items.length > 0);
  }, [entries]);

  const addEntry = () => {
    setError('');
    const name = draft.foodName.trim().toLowerCase();
    if (!FOOD_SET.has(name)) {
      setError(`No food found: "${draft.foodName}". Choose a valid meal keyword from the list.`);
      return;
    }
    if (draft.quantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    setEntries((prev) => [...prev, { ...draft, id: `${Date.now()}-${prev.length}`, foodName: name }]);
    setDraft((prev) => ({ ...prev, foodName: '', quantity: 1 }));
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const analyzeEntries = async () => {
    setError('');
    if (entries.length === 0) {
      setError('Add at least one valid meal item before analysis.');
      return;
    }
    try {
      setAnalyzing(true);
      const grouped: Record<string, string[]> = {};
      for (const entry of entries) {
        const key = entry.mealType;
        grouped[key] = grouped[key] ?? [];
        grouped[key].push(entryToText(entry));
      }
      const entryText = Object.entries(grouped)
        .map(([meal, items]) => `${meal.replace(/_/g, ' ')}: ${items.join(', ')}`)
        .join('. ');

      const response = await api.post<PerformanceAnalysisResponse>('/tracking/performance-report', {
        entry_text: entryText,
        save_to_daily_log: false,
      });
      setAnalysis(response.data);
      setPayload({
        calories_consumed: response.data.nutrition_report.total_calories_kcal,
        protein_g: response.data.nutrition_report.total_protein_g,
        carbs_g: response.data.nutrition_report.total_carbs_g,
        fats_g: response.data.nutrition_report.total_fats_g,
        meals_completed: Math.min(response.data.nutrition_report.meals.length, 6),
      });
      if (status !== 'idle') setStatus('idle');
    } catch {
      setError('Unable to analyze meals right now.');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMeals = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setStatus('saving');
      await api.put('/tracking/meals', payload);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div>
      <Navbar />
      <main className="w-full px-4 py-8 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-black text-left">Meal Tracker</h1>
          <Link to="/ai-performance" className="btn-secondary text-xs">Open Full AI Dashboard</Link>
        </div>

        <section className="panel mb-4">
          <h2 className="mb-3 text-lg font-black text-left">Add Meal Item</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <select
              className="input-field"
              value={draft.mealType}
              onChange={(e) => setDraft((p) => ({ ...p, mealType: e.target.value as MealType }))}
            >
              {MEAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              className="input-field md:col-span-2"
              list="food-options"
              placeholder="Food name (only valid keywords)"
              value={draft.foodName}
              onChange={(e) => setDraft((p) => ({ ...p, foodName: e.target.value }))}
            />
            <datalist id="food-options">
              {FOOD_OPTIONS.map((food) => <option key={food} value={food} />)}
            </datalist>
            <input
              className="input-field"
              type="number"
              min={1}
              value={draft.quantity}
              onChange={(e) => setDraft((p) => ({ ...p, quantity: Number(e.target.value) }))}
            />
            <select
              className="input-field"
              value={draft.unit}
              onChange={(e) => setDraft((p) => ({ ...p, unit: e.target.value as PortionUnit }))}
            >
              <option value="g">g</option>
              <option value="piece">piece</option>
              <option value="cup">cup</option>
              <option value="bowl">bowl</option>
              <option value="slice">slice</option>
              <option value="scoop">scoop</option>
              <option value="serving">serving</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={addEntry}>Add Meal Item</button>
            <button type="button" className="btn-secondary" onClick={() => void analyzeEntries()} disabled={analyzing}>
              {analyzing ? 'Analyzing...' : 'Analyze Meals'}
            </button>
          </div>
          {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
        </section>

        <section className="panel mb-4">
          <h2 className="mb-3 text-lg font-black text-left">Meal Entries</h2>
          {entries.length === 0 ? (
            <p className="text-sm text-slate-500">No meal entries added yet.</p>
          ) : (
            <div className="space-y-3">
              {groupedSummary.map((group) => (
                <div key={group.value} className="rounded-xl bg-slate-50 p-3">
                  <p className="mb-1 text-sm font-semibold">{group.label}</p>
                  <ul className="space-y-1 text-sm text-slate-700">
                    {entries.filter((e) => e.mealType === group.value).map((item) => (
                      <li key={item.id} className="flex items-center justify-between">
                        <span>{entryToText(item)}</span>
                        <button type="button" className="text-xs text-rose-600" onClick={() => removeEntry(item.id)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <form className="panel" onSubmit={saveMeals}>
          <h2 className="mb-3 text-lg font-black text-left">Save Daily Meal Totals</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block">Calories Consumed</span>
              <input className="input-field" type="number" value={payload.calories_consumed} onChange={(e) => setPayload((p) => ({ ...p, calories_consumed: Number(e.target.value) }))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block">Protein (g)</span>
              <input className="input-field" type="number" value={payload.protein_g} onChange={(e) => setPayload((p) => ({ ...p, protein_g: Number(e.target.value) }))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block">Carbs (g)</span>
              <input className="input-field" type="number" value={payload.carbs_g} onChange={(e) => setPayload((p) => ({ ...p, carbs_g: Number(e.target.value) }))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block">Fats (g)</span>
              <input className="input-field" type="number" value={payload.fats_g} onChange={(e) => setPayload((p) => ({ ...p, fats_g: Number(e.target.value) }))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block">Meals Completed</span>
              <input className="input-field" type="number" value={payload.meals_completed} onChange={(e) => setPayload((p) => ({ ...p, meals_completed: Number(e.target.value) }))} />
            </label>
          </div>
          {analysis ? (
            <p className="mt-3 text-xs text-slate-600">
              Last analysis: nutrition score <b>{analysis.nutrition_report.nutrition_quality_score}</b>, calorie status{' '}
              <b className="capitalize">{analysis.nutrition_report.calorie_balance_label}</b>.
            </p>
          ) : null}
          <div className="mt-3">
            <SaveStatus status={status} successText="Meals saved successfully." />
          </div>
          <button className="btn-primary mt-3">Save Meals</button>
        </form>
      </main>
    </div>
  );
}
