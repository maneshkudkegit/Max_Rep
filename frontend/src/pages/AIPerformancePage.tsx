import { useMemo, useState } from 'react';

import { Navbar } from '../components/Navbar';
import { ProgressRing } from '../components/ProgressRing';
import { StatCard } from '../components/StatCard';
import { api } from '../lib/api';
import type { PerformanceAnalysisRequest, PerformanceAnalysisResponse } from '../types';

const SAMPLE_ENTRY = `Breakfast: 2 eggs, oats with milk and 1 banana.
Lunch: 200g chicken breast, 1 cup rice and salad.
Dinner: paneer with roti and vegetables.
Evening snack: whey protein 1 scoop with almonds.
Workout: bench press 4x8, squat 5x5, pull up 4x10, running 20 min.
Steps: 9500 steps. Water: 2.6 liters.`;

export default function AIPerformancePage() {
  const [form, setForm] = useState<PerformanceAnalysisRequest>({
    entry_text: '',
    maintenance_kcal: 2000,
    goal: 'maintain',
    body_weight_kg: 70,
    save_to_daily_log: false,
  });
  const [report, setReport] = useState<PerformanceAnalysisResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const intensityTone = useMemo(() => {
    const intensity = report?.workout_report.intensity;
    if (intensity === 'high') return 'bg-rose-100 text-rose-700';
    if (intensity === 'moderate') return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  }, [report?.workout_report.intensity]);

  const hydrationTone = useMemo(() => {
    const status = report?.hydration_report.status;
    if (status === 'Dehydration Risk') return 'bg-rose-100 text-rose-700';
    if (status === 'Low') return 'bg-orange-100 text-orange-700';
    if (status === 'Moderate') return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  }, [report?.hydration_report.status]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.entry_text?.trim()) {
      setError('Please enter your daily food, workout, and hydration details.');
      return;
    }
    try {
      setSubmitting(true);
      const response = await api.post<PerformanceAnalysisResponse>('/tracking/performance-report', form);
      setReport(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Unable to generate performance report right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar />
      <main className="w-full px-4 py-6 lg:px-8">
        <section className="panel-hero mb-6">
          <p className="chip mb-3">Max Rep AI Coach</p>
          <h1 className="text-3xl font-black text-slate-900 md:text-4xl">AI Nutrition and Workout Performance Engine</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
            Enter your daily meals, exercises, cardio, steps, and hydration in natural language. Max Rep AI generates
            a structured nutrition report, workout performance report, hydration analysis, and an overall performance score.
          </p>
        </section>

        <section className="panel mb-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Daily Entry</label>
              <textarea
                className="input-field min-h-[210px]"
                placeholder="Example: Breakfast: oats and eggs. Lunch: chicken and rice. Workout: squat 5x5..."
                value={form.entry_text}
                onChange={(e) => setForm({ ...form, entry_text: e.target.value })}
              />
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-teal-700 hover:text-teal-600"
                onClick={() => setForm({ ...form, entry_text: SAMPLE_ENTRY })}
              >
                Use sample entry
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Maintenance kcal</span>
                <input
                  className="input-field"
                  type="number"
                  value={form.maintenance_kcal}
                  onChange={(e) => setForm({ ...form, maintenance_kcal: Number(e.target.value) })}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Goal</span>
                <select
                  className="input-field"
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value as PerformanceAnalysisRequest['goal'] })}
                >
                  <option value="maintain">maintain</option>
                  <option value="fat_loss">fat_loss</option>
                  <option value="muscle_gain">muscle_gain</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Body weight (kg)</span>
                <input
                  className="input-field"
                  type="number"
                  value={form.body_weight_kg}
                  onChange={(e) => setForm({ ...form, body_weight_kg: Number(e.target.value) })}
                />
              </label>
              <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(form.save_to_daily_log)}
                  onChange={(e) => setForm({ ...form, save_to_daily_log: e.target.checked })}
                />
                Save analyzed totals to today log
              </label>
              <button className="btn-primary w-full" disabled={submitting}>
                {submitting ? 'Analyzing...' : 'Generate AI Report'}
              </button>
              {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
            </div>
          </form>
        </section>

        {report ? (
          <>
            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Overall Score" value={`${report.dashboard.overall_max_rep_performance_score}/100`} hint="Max Rep index" />
              <StatCard title="Net Calories" value={report.dashboard.net_calories_kcal} hint="Consumed - Burned" />
              <StatCard title="Activity Burn" value={report.dashboard.total_calories_burned_kcal} hint="Workout + cardio + steps" />
              <StatCard title="Hydration Status" value={report.dashboard.hydration_status} hint={`${report.hydration_report.completion_percent}% complete`} />
            </section>
            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <StatCard
                title="Estimated Days To Goal"
                value={report.dashboard.estimated_days_to_goal}
                hint="Using 7700 kcal/kg model and current consistency"
              />
              <StatCard
                title="Assumed Target Weight"
                value={`${report.dashboard.target_weight_assumption_kg} kg`}
                hint="Auto-assumption for timeline projection"
              />
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="panel xl:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900">Daily Nutrition Report</h2>
                  <span className="chip">Nutrition Quality Score: {report.nutrition_report.nutrition_quality_score}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-600">
                        <th className="py-2 pr-2">Meal</th>
                        <th className="py-2 pr-2">Detected Food</th>
                        <th className="py-2 pr-2">Calories</th>
                        <th className="py-2 pr-2">Protein</th>
                        <th className="py-2 pr-2">Carbs</th>
                        <th className="py-2">Fats</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.nutrition_report.meals.map((meal, idx) => (
                        <tr key={`${meal.meal}-${idx}`} className="border-b border-slate-100">
                          <td className="py-2 pr-2 font-semibold capitalize">{meal.meal}</td>
                          <td className="py-2 pr-2 text-slate-600">{meal.detected_items.join(', ')}</td>
                          <td className="py-2 pr-2">{meal.macros.calories_kcal}</td>
                          <td className="py-2 pr-2">{meal.macros.protein_g}g</td>
                          <td className="py-2 pr-2">{meal.macros.carbs_g}g</td>
                          <td className="py-2">{meal.macros.fats_g}g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <StatCard title="Calories" value={report.nutrition_report.total_calories_kcal} />
                  <StatCard title="Protein" value={`${report.nutrition_report.total_protein_g} g`} />
                  <StatCard title="Carbs" value={`${report.nutrition_report.total_carbs_g} g`} />
                  <StatCard title="Fats" value={`${report.nutrition_report.total_fats_g} g`} />
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  Calorie status: <b className="capitalize">{report.nutrition_report.calorie_balance_label}</b> (
                  {report.nutrition_report.calorie_balance_kcal} kcal vs maintenance baseline).
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    Protein adequacy: <b>{report.nutrition_report.protein_adequacy_status}</b><br />
                    Optimal range: <b>{report.nutrition_report.protein_target_range_g.min}g - {report.nutrition_report.protein_target_range_g.max}g</b>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    Nutrient gap/excess vs selected goal:<br />
                    Calories: <b>{report.nutrition_report.nutrient_gaps_or_excess.calories_kcal}</b> kcal<br />
                    Protein: <b>{report.nutrition_report.nutrient_gaps_or_excess.protein_g}</b> g<br />
                    Carbs: <b>{report.nutrition_report.nutrient_gaps_or_excess.carbs_g}</b> g<br />
                    Fats: <b>{report.nutrition_report.nutrient_gaps_or_excess.fats_g}</b> g
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  Goal calorie comparison:
                  <ul className="mt-1 list-disc pl-5">
                    <li>Fat loss target: {report.nutrition_report.goal_calorie_comparison.fat_loss.target_kcal} kcal ({report.nutrition_report.goal_calorie_comparison.fat_loss.difference_kcal} diff, {report.nutrition_report.goal_calorie_comparison.fat_loss.status})</li>
                    <li>Maintenance target: {report.nutrition_report.goal_calorie_comparison.maintenance.target_kcal} kcal ({report.nutrition_report.goal_calorie_comparison.maintenance.difference_kcal} diff, {report.nutrition_report.goal_calorie_comparison.maintenance.status})</li>
                    <li>Muscle gain target: {report.nutrition_report.goal_calorie_comparison.muscle_gain.target_kcal} kcal ({report.nutrition_report.goal_calorie_comparison.muscle_gain.difference_kcal} diff, {report.nutrition_report.goal_calorie_comparison.muscle_gain.status})</li>
                  </ul>
                </div>
              </div>

              <div className="panel">
                <h3 className="mb-3 text-lg font-black text-slate-900">Macro Distribution</h3>
                <div className="grid grid-cols-1 gap-3">
                  <ProgressRing label="Protein %" percent={report.nutrition_report.macro_distribution_percent.protein_percent ?? 0} color="#b65c2d" />
                  <ProgressRing label="Carbs %" percent={report.nutrition_report.macro_distribution_percent.carbs_percent ?? 0} color="#1f6f78" />
                  <ProgressRing label="Fats %" percent={report.nutrition_report.macro_distribution_percent.fats_percent ?? 0} color="#5b7c3d" />
                </div>
              </div>
            </section>

            <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="panel xl:col-span-2">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">Workout Performance Report</h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${intensityTone}`}>
                    {report.workout_report.intensity} intensity
                  </span>
                </div>
                <p className="mb-3 text-sm text-slate-700">{report.workout_report.effort_analysis}</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-2 text-sm font-bold text-slate-900">Strength Exercises</p>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {report.workout_report.exercises.length > 0 ? (
                        report.workout_report.exercises.map((ex) => (
                          <li key={`${ex.exercise}-${ex.sets}-${ex.reps}`}>
                            {ex.exercise}: {ex.sets} x {ex.reps}
                          </li>
                        ))
                      ) : (
                        <li>No structured strength sets detected.</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-2 text-sm font-bold text-slate-900">Cardio</p>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {report.workout_report.cardio.length > 0 ? (
                        report.workout_report.cardio.map((c) => (
                          <li key={`${c.activity}-${c.duration_minutes}`}>
                            {c.activity}: {c.duration_minutes} min ({c.calories_burned_kcal} kcal)
                          </li>
                        ))
                      ) : (
                        <li>No cardio entries detected.</li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <StatCard title="Volume" value={report.workout_report.training_volume} />
                  <StatCard title="Workout Burn" value={report.workout_report.estimated_calories_burned_kcal} />
                  <StatCard title="Step Burn" value={report.workout_report.calories_from_steps_kcal} />
                  <StatCard title="Workout Score" value={`${report.workout_report.workout_score}/100`} />
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  Muscle groups trained: <b>{report.workout_report.muscle_groups_trained.join(', ') || 'Not detected'}</b>
                </div>
              </div>

              <div className="panel">
                <h3 className="mb-3 text-lg font-black text-slate-900">Hydration and Recovery</h3>
                <div className="mb-3 flex justify-center">
                  <ProgressRing label="Hydration" percent={report.hydration_report.completion_percent} color="#1f6f78" />
                </div>
                <p className={`mb-3 rounded-full px-3 py-1 text-center text-xs font-bold ${hydrationTone}`}>
                  {report.hydration_report.status}
                </p>
                <p className="text-sm text-slate-700">
                  Intake: <b>{report.hydration_report.consumed_liters} L</b> / Target: <b>{report.hydration_report.target_liters} L</b>
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Post-workout protein recommendation: <b>{report.workout_report.recommended_post_workout_protein_g} g</b>
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {report.workout_report.recovery_insights.map((insight) => (
                    <li key={insight} className="rounded-xl bg-slate-50 px-3 py-2">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
