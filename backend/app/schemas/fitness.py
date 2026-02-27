from pydantic import BaseModel, Field


class PlanResponse(BaseModel):
    bmr: float
    tdee: float
    calorie_target: float
    protein_g: float
    carbs_g: float
    fats_g: float
    fiber_g: float
    water_ml: float
    bmi: float
    body_fat_percent: float
    roadmap: str
    workout_schedule: str
    meals_plan: str
    estimated_days_to_goal: int
    target_weight_assumption_kg: float


class TrackingUpsertRequest(BaseModel):
    calories_consumed: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fats_g: float = 0
    water_ml: float = 0
    meals_completed: int = 0
    workout_completed: bool = False
    weight_kg: float | None = None
    sleep_hours: float = 0


class TrackingSummaryResponse(BaseModel):
    calories_consumed: float
    calorie_target: float
    deficit_or_surplus: float
    nutrient_completion_percent: float
    water_completion_percent: float
    workout_completed: bool
    consistency_score: float
    streak_count: int


class AnalyticsPoint(BaseModel):
    date: str
    consistency_score: float
    calories_consumed: float
    water_ml: float


class NotificationResponse(BaseModel):
    id: int
    kind: str
    title: str
    message: str
    status: str


class PerformanceAnalysisRequest(BaseModel):
    entry_text: str = Field(
        min_length=3,
        description='Free-form daily entry containing meals, workouts, hydration, and activity details.',
    )
    maintenance_kcal: float = Field(default=2000, gt=800, lt=6000)
    goal: str | None = Field(default=None, description='Optional goal context: fat_loss, muscle_gain, or maintain.')
    body_weight_kg: float = Field(default=70, gt=30, lt=300)
    save_to_daily_log: bool = Field(default=False)


class MealMacroBreakdown(BaseModel):
    calories_kcal: float
    protein_g: float
    carbs_g: float
    fats_g: float


class MealReportItem(BaseModel):
    meal: str
    detected_items: list[str]
    estimated_portions: list[str]
    macros: MealMacroBreakdown


class DailyNutritionReport(BaseModel):
    meals: list[MealReportItem]
    total_calories_kcal: float
    total_protein_g: float
    total_carbs_g: float
    total_fats_g: float
    macro_distribution_percent: dict[str, float]
    calorie_balance_kcal: float
    calorie_balance_label: str
    protein_target_range_g: dict[str, float]
    protein_adequacy_status: str
    nutrient_gaps_or_excess: dict[str, float]
    goal_calorie_comparison: dict[str, dict[str, float | str]]
    nutrition_quality_score: float
    nutrition_performance_score: float


class WorkoutExerciseItem(BaseModel):
    exercise: str
    sets: int
    reps: int
    muscle_groups: list[str]


class CardioItem(BaseModel):
    activity: str
    duration_minutes: float
    calories_burned_kcal: float


class WorkoutPerformanceReport(BaseModel):
    exercises: list[WorkoutExerciseItem]
    cardio: list[CardioItem]
    training_volume: int
    intensity: str
    muscle_groups_trained: list[str]
    estimated_calories_burned_kcal: float
    calories_from_steps_kcal: float
    total_activity_burn_kcal: float
    effort_analysis: str
    workout_score: float
    recovery_insights: list[str]
    recommended_post_workout_protein_g: float


class HydrationReport(BaseModel):
    consumed_liters: float
    target_liters: float
    completion_percent: float
    dehydration_risk: str
    status: str


class DailyPerformanceDashboard(BaseModel):
    total_calories_consumed_kcal: float
    total_calories_burned_kcal: float
    net_calories_kcal: float
    macro_balance: dict[str, float]
    hydration_level_percent: float
    hydration_status: str
    activity_level: str
    recovery_status: str
    estimated_days_to_goal: int
    target_weight_assumption_kg: float
    overall_max_rep_performance_score: float


class PerformanceAnalysisResponse(BaseModel):
    nutrition_report: DailyNutritionReport
    workout_report: WorkoutPerformanceReport
    hydration_report: HydrationReport
    dashboard: DailyPerformanceDashboard
