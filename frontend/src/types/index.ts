export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  tenant_id: number;
  tenant_slug: string;
  role: 'superadmin' | 'gym_admin' | 'trainer' | 'member';
  tier: 'free' | 'pro' | 'premium';
}

export interface Plan {
  bmr: number;
  tdee: number;
  calorie_target: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
  water_ml: number;
  bmi: number;
  body_fat_percent: number;
  roadmap: string;
  workout_schedule: string;
  meals_plan: string;
  estimated_days_to_goal: number;
  target_weight_assumption_kg: number;
}

export interface TrackingSummary {
  calories_consumed: number;
  calorie_target: number;
  deficit_or_surplus: number;
  nutrient_completion_percent: number;
  water_completion_percent: number;
  workout_completed: boolean;
  consistency_score: number;
  streak_count: number;
}

export interface AnalyticsPoint {
  date: string;
  consistency_score: number;
  calories_consumed: number;
  water_ml: number;
}

export interface Notification {
  id: number;
  kind: string;
  title: string;
  message: string;
  status: string;
}

export interface PerformanceAnalysisRequest {
  entry_text: string;
  maintenance_kcal?: number;
  goal?: 'fat_loss' | 'muscle_gain' | 'maintain';
  body_weight_kg?: number;
  save_to_daily_log?: boolean;
}

export interface MealMacroBreakdown {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

export interface MealReportItem {
  meal: string;
  detected_items: string[];
  estimated_portions: string[];
  macros: MealMacroBreakdown;
}

export interface DailyNutritionReport {
  meals: MealReportItem[];
  total_calories_kcal: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fats_g: number;
  macro_distribution_percent: Record<string, number>;
  calorie_balance_kcal: number;
  calorie_balance_label: string;
  protein_target_range_g: {
    min: number;
    max: number;
  };
  protein_adequacy_status: 'below_optimal' | 'optimal' | 'above_optimal';
  nutrient_gaps_or_excess: {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
  };
  goal_calorie_comparison: Record<
    'fat_loss' | 'maintenance' | 'muscle_gain',
    {
      target_kcal: number;
      difference_kcal: number;
      status: 'on_target' | 'over_target' | 'under_target';
    }
  >;
  nutrition_quality_score: number;
  nutrition_performance_score: number;
}

export interface WorkoutExerciseItem {
  exercise: string;
  sets: number;
  reps: number;
  muscle_groups: string[];
}

export interface CardioItem {
  activity: string;
  duration_minutes: number;
  calories_burned_kcal: number;
}

export interface WorkoutPerformanceReport {
  exercises: WorkoutExerciseItem[];
  cardio: CardioItem[];
  training_volume: number;
  intensity: 'low' | 'moderate' | 'high';
  muscle_groups_trained: string[];
  estimated_calories_burned_kcal: number;
  calories_from_steps_kcal: number;
  total_activity_burn_kcal: number;
  effort_analysis: string;
  workout_score: number;
  recovery_insights: string[];
  recommended_post_workout_protein_g: number;
}

export interface HydrationReport {
  consumed_liters: number;
  target_liters: number;
  completion_percent: number;
  dehydration_risk: 'low' | 'moderate' | 'high';
  status: 'Optimal' | 'Moderate' | 'Low' | 'Dehydration Risk';
}

export interface DailyPerformanceDashboard {
  total_calories_consumed_kcal: number;
  total_calories_burned_kcal: number;
  net_calories_kcal: number;
  macro_balance: Record<string, number>;
  hydration_level_percent: number;
  hydration_status: HydrationReport['status'];
  activity_level: WorkoutPerformanceReport['intensity'];
  recovery_status: string;
  estimated_days_to_goal: number;
  target_weight_assumption_kg: number;
  overall_max_rep_performance_score: number;
}

export interface PerformanceAnalysisResponse {
  nutrition_report: DailyNutritionReport;
  workout_report: WorkoutPerformanceReport;
  hydration_report: HydrationReport;
  dashboard: DailyPerformanceDashboard;
}
