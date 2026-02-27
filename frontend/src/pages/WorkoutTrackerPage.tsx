import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Navbar } from '../components/Navbar';
import { SaveStatus } from '../components/SaveStatus';
import { api } from '../lib/api';
import type { PerformanceAnalysisResponse } from '../types';

type CardioType = 'running' | 'jogging' | 'walking' | 'cycling' | 'swimming' | 'rowing' | 'elliptical' | 'hiit' | 'jump rope';

interface StrengthEntry {
  id: string;
  exercise: string;
  sets: number;
  reps: number;
}

interface CardioEntry {
  id: string;
  activity: CardioType;
  minutes: number;
}

const EXERCISE_OPTIONS = [
  'bench press',
  'squat',
  'deadlift',
  'overhead press',
  'barbell row',
  'pull up',
  'push up',
  'bicep curl',
  'tricep extension',
  'lunges',
  'leg press',
  'plank',
  'crunches',
];

const EXERCISE_SET = new Set(EXERCISE_OPTIONS);

const CARDIO_OPTIONS: CardioType[] = [
  'running',
  'jogging',
  'walking',
  'cycling',
  'swimming',
  'rowing',
  'elliptical',
  'hiit',
  'jump rope',
];

export default function WorkoutTrackerPage() {
  const [strengthRows, setStrengthRows] = useState<StrengthEntry[]>([]);
  const [cardioRows, setCardioRows] = useState<CardioEntry[]>([]);
  const [strengthDraft, setStrengthDraft] = useState<StrengthEntry>({
    id: 'draft',
    exercise: '',
    sets: 3,
    reps: 10,
  });
  const [cardioDraft, setCardioDraft] = useState<CardioEntry>({
    id: 'draft',
    activity: 'running',
    minutes: 20,
  });
  const [steps, setSteps] = useState(0);
  const [waterMl, setWaterMl] = useState(0);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<PerformanceAnalysisResponse | null>(null);

  const trainingVolume = useMemo(
    () => strengthRows.reduce((sum, row) => sum + (row.sets * row.reps), 0),
    [strengthRows],
  );

  const addStrength = () => {
    setError('');
    const exercise = strengthDraft.exercise.trim().toLowerCase();
    if (!EXERCISE_SET.has(exercise)) {
      setError(`No workout found: "${strengthDraft.exercise}". Choose a valid exercise.`);
      return;
    }
    if (strengthDraft.sets < 1 || strengthDraft.sets > 12 || strengthDraft.reps < 1 || strengthDraft.reps > 50) {
      setError('Sets must be 1-12 and reps must be 1-50.');
      return;
    }
    setStrengthRows((prev) => [...prev, { ...strengthDraft, id: `${Date.now()}-${prev.length}`, exercise }]);
    setStrengthDraft((prev) => ({ ...prev, exercise: '', sets: 3, reps: 10 }));
  };

  const addCardio = () => {
    setError('');
    if (cardioDraft.minutes < 5 || cardioDraft.minutes > 180) {
      setError('Cardio duration must be 5-180 minutes.');
      return;
    }
    setCardioRows((prev) => [...prev, { ...cardioDraft, id: `${Date.now()}-${prev.length}` }]);
  };

  const removeStrength = (id: string) => setStrengthRows((prev) => prev.filter((x) => x.id !== id));
  const removeCardio = (id: string) => setCardioRows((prev) => prev.filter((x) => x.id !== id));

  const analyzeWorkout = async () => {
    setError('');
    if (strengthRows.length === 0 && cardioRows.length === 0 && steps <= 0) {
      setError('Add workout, cardio, or steps before analysis.');
      return;
    }
    try {
      setAnalyzing(true);
      const strengthText = strengthRows.map((r) => `${r.exercise} ${r.sets}x${r.reps}`).join(', ');
      const cardioText = cardioRows.map((c) => `${c.activity} ${c.minutes} min`).join(', ');
      const parts = [
        strengthText ? `Workout: ${strengthText}` : '',
        cardioText ? `Cardio: ${cardioText}` : '',
        steps > 0 ? `Steps: ${steps} steps` : '',
        waterMl > 0 ? `Water: ${(waterMl / 1000).toFixed(2)} liters` : '',
      ].filter(Boolean);
      const entryText = parts.join('. ');

      const response = await api.post<PerformanceAnalysisResponse>('/tracking/performance-report', {
        entry_text: entryText,
        save_to_daily_log: false,
      });
      setAnalysis(response.data);
      setWorkoutCompleted(response.data.workout_report.total_activity_burn_kcal > 0);
      if (response.data.hydration_report.consumed_liters > 0) {
        setWaterMl(response.data.hydration_report.consumed_liters * 1000);
      }
      if (status !== 'idle') setStatus('idle');
    } catch {
      setError('Unable to analyze workout right now.');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setStatus('saving');
      await api.put('/tracking/workout', { workout_completed: workoutCompleted });
      await api.put('/tracking/hydration', { water_ml: waterMl });
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="md:pl-64">
      <main className="w-full px-4 py-8 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-black text-left">Workout + Hydration Tracker</h1>
          <Link to="/ai-performance" className="btn-secondary text-xs">Open Full AI Dashboard</Link>
        </div>

        <section className="panel mb-4">
          <h2 className="mb-3 text-lg font-black text-left">Add Strength Exercise</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              className="input-field md:col-span-2"
              list="exercise-options"
              placeholder="Workout name only"
              value={strengthDraft.exercise}
              onChange={(e) => setStrengthDraft((p) => ({ ...p, exercise: e.target.value }))}
            />
            <datalist id="exercise-options">
              {EXERCISE_OPTIONS.map((ex) => <option key={ex} value={ex} />)}
            </datalist>
            <input className="input-field" type="number" min={1} max={12} value={strengthDraft.sets} onChange={(e) => setStrengthDraft((p) => ({ ...p, sets: Number(e.target.value) }))} />
            <input className="input-field" type="number" min={1} max={50} value={strengthDraft.reps} onChange={(e) => setStrengthDraft((p) => ({ ...p, reps: Number(e.target.value) }))} />
          </div>
          <button type="button" className="btn-primary mt-3" onClick={addStrength}>Add Exercise</button>
        </section>

        <section className="panel mb-4">
          <h2 className="mb-3 text-lg font-black text-left">Add Cardio</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <select className="input-field" value={cardioDraft.activity} onChange={(e) => setCardioDraft((p) => ({ ...p, activity: e.target.value as CardioType }))}>
              {CARDIO_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="input-field" type="number" min={5} max={180} value={cardioDraft.minutes} onChange={(e) => setCardioDraft((p) => ({ ...p, minutes: Number(e.target.value) }))} />
            <button type="button" className="btn-secondary" onClick={addCardio}>Add Cardio</button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block">Steps</span>
              <input className="input-field" type="number" min={0} value={steps} onChange={(e) => setSteps(Number(e.target.value))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block">Water (ml)</span>
              <input className="input-field" type="number" min={0} value={waterMl} onChange={(e) => setWaterMl(Number(e.target.value))} />
            </label>
            <label className="flex items-end gap-2 text-sm">
              <input type="checkbox" checked={workoutCompleted} onChange={(e) => setWorkoutCompleted(e.target.checked)} />
              Workout completed
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => void analyzeWorkout()} disabled={analyzing}>
              {analyzing ? 'Analyzing...' : 'Analyze Workout'}
            </button>
          </div>
          {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
        </section>

        <section className="panel mb-4">
          <h2 className="mb-3 text-lg font-black text-left">Workout Entries</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="mb-2 text-sm font-semibold">Strength</p>
              {strengthRows.length === 0 ? <p className="text-sm text-slate-500">No exercises added.</p> : (
                <ul className="space-y-1 text-sm">
                  {strengthRows.map((r) => (
                    <li key={r.id} className="flex items-center justify-between">
                      <span>{r.exercise} {r.sets}x{r.reps}</span>
                      <button type="button" className="text-xs text-rose-600" onClick={() => removeStrength(r.id)}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="mb-2 text-sm font-semibold">Cardio</p>
              {cardioRows.length === 0 ? <p className="text-sm text-slate-500">No cardio added.</p> : (
                <ul className="space-y-1 text-sm">
                  {cardioRows.map((r) => (
                    <li key={r.id} className="flex items-center justify-between">
                      <span>{r.activity} {r.minutes} min</span>
                      <button type="button" className="text-xs text-rose-600" onClick={() => removeCardio(r.id)}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">Training volume: <b>{trainingVolume}</b></p>
          {analysis ? (
            <p className="mt-1 text-sm text-slate-600">
              Last analysis: <b className="capitalize">{analysis.workout_report.intensity}</b> intensity, burn <b>{analysis.workout_report.total_activity_burn_kcal} kcal</b>.
            </p>
          ) : null}
        </section>

        <form onSubmit={saveWorkout} className="panel">
          <h2 className="mb-3 text-lg font-black text-left">Save Workout + Hydration</h2>
          <SaveStatus status={status} successText="Workout and hydration saved." />
          <button className="btn-primary mt-3">Save</button>
        </form>
      </main>
      </div>
    </div>
  );
}
