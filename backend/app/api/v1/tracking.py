from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_auth_payload
from app.models.fitness import DailyTracking, FitnessProfile
from app.models.notification import Notification
from app.models.tracking_log import CustomFoodItem, MealLog, WorkoutLog
from app.models.user import User
from app.schemas.fitness import (
    AICoachIngredientRequest,
    AICoachSuggestionResponse,
    AdvancedAnalysisResponse,
    AnalyticsPoint,
    CustomFoodRequest,
    CustomFoodResponse,
    MealLogRequest,
    MealLogResponse,
    NotificationResponse,
    PerformanceAnalysisRequest,
    PerformanceAnalysisResponse,
    TrackingSummaryResponse,
    TrackingUpsertRequest,
    WorkoutLogRequest,
    WorkoutLogResponse,
)
from app.services.notifications import create_alert
from app.services.performance_engine import analyze_daily_performance


router = APIRouter(prefix='/tracking', tags=['tracking'])

DEFAULT_FOODS = [
    {'name': 'egg', 'unit': 'piece', 'calories_per_unit': 78, 'protein_per_unit': 6.3, 'carbs_per_unit': 0.6, 'fats_per_unit': 5.3},
    {'name': 'rice', 'unit': 'cup', 'calories_per_unit': 205, 'protein_per_unit': 4.3, 'carbs_per_unit': 45, 'fats_per_unit': 0.4},
    {'name': 'paneer', 'unit': '100g', 'calories_per_unit': 265, 'protein_per_unit': 18, 'carbs_per_unit': 6, 'fats_per_unit': 20},
    {'name': 'chicken breast', 'unit': '100g', 'calories_per_unit': 165, 'protein_per_unit': 31, 'carbs_per_unit': 0, 'fats_per_unit': 3.6},
    {'name': 'oats', 'unit': '50g', 'calories_per_unit': 194, 'protein_per_unit': 8.4, 'carbs_per_unit': 33, 'fats_per_unit': 3.5},
    {'name': 'greek yogurt', 'unit': '100g', 'calories_per_unit': 97, 'protein_per_unit': 9, 'carbs_per_unit': 3.6, 'fats_per_unit': 5},
]


def _get_or_create(db: Session, user_id: int, tenant_id: int, for_date: date | None = None) -> DailyTracking:
    today = for_date or date.today()
    row = db.scalar(
        select(DailyTracking).where(
            and_(DailyTracking.user_id == user_id, DailyTracking.tenant_id == tenant_id, DailyTracking.date == today)
        )
    )
    if row:
        return row
    row = DailyTracking(user_id=user_id, tenant_id=tenant_id, date=today)
    db.add(row)
    db.flush()
    return row


def _has_activity(row: DailyTracking) -> bool:
    return any(
        [
            row.calories_consumed > 0,
            row.protein_g > 0,
            row.carbs_g > 0,
            row.fats_g > 0,
            row.water_ml > 0,
            row.meals_completed > 0,
            row.workout_completed,
            (row.weight_kg or 0) > 0,
            row.sleep_hours > 0,
        ]
    )


def _compute_consistency(row: DailyTracking, profile: FitnessProfile | None) -> float:
    target = profile.calorie_target if profile else 0
    return min(
        ((row.calories_consumed / target) * 30 if target else 0)
        + ((row.water_ml / profile.water_ml) * 20 if profile and profile.water_ml else 0)
        + (20 if row.workout_completed else 0)
        + (min(row.meals_completed / 4, 1) * 20)
        + (10 if row.weight_kg is not None else 0),
        100,
    )


def _refresh_daily_rollups(db: Session, user_id: int, tenant_id: int, target_date: date) -> DailyTracking:
    meal_rows = db.scalars(
        select(MealLog).where(and_(MealLog.user_id == user_id, MealLog.tenant_id == tenant_id, MealLog.date == target_date))
    ).all()
    workout_rows = db.scalars(
        select(WorkoutLog).where(
            and_(WorkoutLog.user_id == user_id, WorkoutLog.tenant_id == tenant_id, WorkoutLog.date == target_date)
        )
    ).all()
    row = _get_or_create(db, user_id, tenant_id, target_date)
    row.calories_consumed = round(sum(x.calories for x in meal_rows), 2)
    row.protein_g = round(sum(x.protein_g for x in meal_rows), 2)
    row.carbs_g = round(sum(x.carbs_g for x in meal_rows), 2)
    row.fats_g = round(sum(x.fats_g for x in meal_rows), 2)
    row.meals_completed = len({x.meal_type.lower() for x in meal_rows})
    row.workout_completed = len(workout_rows) > 0
    profile = db.scalar(
        select(FitnessProfile)
        .where(and_(FitnessProfile.user_id == user_id, FitnessProfile.tenant_id == tenant_id))
        .order_by(FitnessProfile.created_at.desc())
    )
    row.consistency_score = _compute_consistency(row, profile)
    return row


def _analytics_rows(db: Session, user_id: int, tenant_id: int, period: str) -> tuple[list[DailyTracking], dict[date, tuple[float, int]]]:
    days_map = {'daily': 1, 'weekly': 7, 'monthly': 30, 'yearly': 365}
    if period not in days_map:
        raise HTTPException(status_code=400, detail='Invalid period. Use daily, weekly, monthly, or yearly.')
    start = date.today() - timedelta(days=days_map[period] - 1)
    tracking_rows = db.scalars(
        select(DailyTracking)
        .where(and_(DailyTracking.user_id == user_id, DailyTracking.tenant_id == tenant_id, DailyTracking.date >= start))
        .order_by(DailyTracking.date.asc())
    ).all()
    workout_rows = db.scalars(
        select(WorkoutLog).where(and_(WorkoutLog.user_id == user_id, WorkoutLog.tenant_id == tenant_id, WorkoutLog.date >= start))
    ).all()
    workout_by_date: dict[date, tuple[float, int]] = {}
    for row in workout_rows:
        minutes, count = workout_by_date.get(row.date, (0.0, 0))
        workout_by_date[row.date] = (minutes + (row.duration_minutes or 0), count + 1)
    return tracking_rows, workout_by_date


def _analytics_points(rows: list[DailyTracking], workout_by_date: dict[date, tuple[float, int]]) -> list[AnalyticsPoint]:
    points: list[AnalyticsPoint] = []
    for row in rows:
        workout_minutes, workout_entries = workout_by_date.get(row.date, (0.0, 0))
        points.append(
            AnalyticsPoint(
                date=str(row.date),
                consistency_score=row.consistency_score,
                calories_consumed=row.calories_consumed,
                water_ml=row.water_ml,
                protein_g=row.protein_g,
                carbs_g=row.carbs_g,
                fats_g=row.fats_g,
                workout_minutes=round(workout_minutes, 2),
                workout_entries=workout_entries,
            )
        )
    return points


@router.put('/meals')
def upsert_meals(payload: TrackingUpsertRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = _get_or_create(db, int(auth['sub']), int(auth['tenant_id']))
    row.calories_consumed = payload.calories_consumed
    row.protein_g = payload.protein_g
    row.carbs_g = payload.carbs_g
    row.fats_g = payload.fats_g
    row.meals_completed = payload.meals_completed
    profile = db.scalar(
        select(FitnessProfile)
        .where(and_(FitnessProfile.user_id == row.user_id, FitnessProfile.tenant_id == row.tenant_id))
        .order_by(FitnessProfile.created_at.desc())
    )
    row.consistency_score = _compute_consistency(row, profile)
    db.commit()
    return {'message': 'meal tracking updated'}


@router.put('/hydration')
def upsert_hydration(payload: TrackingUpsertRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = _get_or_create(db, int(auth['sub']), int(auth['tenant_id']))
    row.water_ml = payload.water_ml

    profile = db.scalar(
        select(FitnessProfile)
        .where(and_(FitnessProfile.user_id == row.user_id, FitnessProfile.tenant_id == row.tenant_id))
        .order_by(FitnessProfile.created_at.desc())
    )
    if profile and payload.water_ml < profile.water_ml * 0.7:
        create_alert(db, row.tenant_id, row.user_id, 'hydration', 'Hydration Alert', 'Water intake below 70% target by evening.')
    row.consistency_score = _compute_consistency(row, profile)
    db.commit()
    return {'message': 'hydration updated'}


@router.put('/workout')
def upsert_workout(payload: TrackingUpsertRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = _get_or_create(db, int(auth['sub']), int(auth['tenant_id']))
    row.workout_completed = payload.workout_completed
    profile = db.scalar(
        select(FitnessProfile)
        .where(and_(FitnessProfile.user_id == row.user_id, FitnessProfile.tenant_id == row.tenant_id))
        .order_by(FitnessProfile.created_at.desc())
    )
    row.consistency_score = _compute_consistency(row, profile)
    db.commit()
    return {'message': 'workout updated'}


@router.put('/weight')
def upsert_weight(payload: TrackingUpsertRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = _get_or_create(db, int(auth['sub']), int(auth['tenant_id']))
    row.weight_kg = payload.weight_kg
    user = db.get(User, int(auth['sub']))
    if payload.weight_kg is not None:
        user.weight_kg = payload.weight_kg
    profile = db.scalar(
        select(FitnessProfile)
        .where(and_(FitnessProfile.user_id == row.user_id, FitnessProfile.tenant_id == row.tenant_id))
        .order_by(FitnessProfile.created_at.desc())
    )
    row.consistency_score = _compute_consistency(row, profile)
    db.commit()
    return {'message': 'weight updated'}


@router.put('/sleep')
def upsert_sleep(payload: TrackingUpsertRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = _get_or_create(db, int(auth['sub']), int(auth['tenant_id']))
    row.sleep_hours = payload.sleep_hours
    db.commit()
    return {'message': 'sleep updated'}


@router.get('/summary', response_model=TrackingSummaryResponse)
def summary(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    user_id = int(auth['sub'])
    tenant_id = int(auth['tenant_id'])
    today_row = db.scalar(
        select(DailyTracking).where(
            and_(DailyTracking.user_id == user_id, DailyTracking.tenant_id == tenant_id, DailyTracking.date == date.today())
        )
    )
    latest_rows = db.scalars(
        select(DailyTracking)
        .where(and_(DailyTracking.user_id == user_id, DailyTracking.tenant_id == tenant_id))
        .order_by(DailyTracking.date.desc())
    ).all()
    last_recorded = next((x for x in latest_rows if _has_activity(x)), None)
    row = today_row or DailyTracking(
        user_id=user_id,
        tenant_id=tenant_id,
        date=date.today(),
        calories_consumed=0,
        protein_g=0,
        carbs_g=0,
        fats_g=0,
        water_ml=0,
        meals_completed=0,
        workout_completed=False,
        sleep_hours=0,
        consistency_score=0,
        streak_count=0,
    )
    profile = db.scalar(
        select(FitnessProfile)
        .where(and_(FitnessProfile.user_id == user_id, FitnessProfile.tenant_id == tenant_id))
        .order_by(FitnessProfile.created_at.desc())
    )
    target = profile.calorie_target if profile else 0
    nutrient_target = (profile.protein_g + profile.carbs_g + profile.fats_g) if profile else 1
    nutrient_done = row.protein_g + row.carbs_g + row.fats_g
    consistency = _compute_consistency(row, profile)
    if today_row:
        today_row.consistency_score = consistency
        db.commit()

    return TrackingSummaryResponse(
        calories_consumed=row.calories_consumed,
        calorie_target=target,
        deficit_or_surplus=round(row.calories_consumed - target, 2),
        nutrient_completion_percent=round(min((nutrient_done / nutrient_target) * 100, 100), 2),
        water_completion_percent=round(min((row.water_ml / profile.water_ml) * 100 if profile and profile.water_ml else 0, 100), 2),
        workout_completed=row.workout_completed,
        consistency_score=round(consistency, 2),
        streak_count=row.streak_count,
        protein_g=row.protein_g,
        carbs_g=row.carbs_g,
        fats_g=row.fats_g,
        last_updated_at=last_recorded.updated_at if last_recorded else None,
        last_recorded_date=last_recorded.date if last_recorded else None,
    )


@router.get('/notifications', response_model=list[NotificationResponse])
def notifications(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    rows = db.scalars(
        select(Notification)
        .where(and_(Notification.user_id == int(auth['sub']), Notification.tenant_id == int(auth['tenant_id'])))
        .order_by(Notification.created_at.desc())
    ).all()
    return [NotificationResponse(id=r.id, kind=r.kind, title=r.title, message=r.message, status=r.status) for r in rows]


@router.get('/analytics', response_model=list[AnalyticsPoint])
def analytics(
    period: str = Query(default='weekly', pattern='^(daily|weekly|monthly|yearly)$'),
    db: Session = Depends(get_db),
    auth: dict = Depends(get_current_auth_payload),
):
    rows, workout_by_date = _analytics_rows(db, int(auth['sub']), int(auth['tenant_id']), period)
    return _analytics_points(rows, workout_by_date)


@router.get('/analytics/weekly', response_model=list[AnalyticsPoint])
def weekly(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    rows, workout_by_date = _analytics_rows(db, int(auth['sub']), int(auth['tenant_id']), 'weekly')
    return _analytics_points(rows, workout_by_date)


@router.get('/analytics/monthly', response_model=list[AnalyticsPoint])
def monthly(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    rows, workout_by_date = _analytics_rows(db, int(auth['sub']), int(auth['tenant_id']), 'monthly')
    return _analytics_points(rows, workout_by_date)


@router.get('/foods/default')
def default_foods():
    return DEFAULT_FOODS


@router.get('/foods/custom', response_model=list[CustomFoodResponse])
def custom_foods(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    rows = db.scalars(
        select(CustomFoodItem)
        .where(and_(CustomFoodItem.user_id == int(auth['sub']), CustomFoodItem.tenant_id == int(auth['tenant_id'])))
        .order_by(CustomFoodItem.updated_at.desc())
    ).all()
    return [
        CustomFoodResponse(
            id=r.id,
            name=r.name,
            unit=r.unit,
            calories_per_unit=r.calories_per_unit,
            protein_per_unit=r.protein_per_unit,
            carbs_per_unit=r.carbs_per_unit,
            fats_per_unit=r.fats_per_unit,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.post('/foods/custom', response_model=CustomFoodResponse)
def create_custom_food(payload: CustomFoodRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = CustomFoodItem(
        tenant_id=int(auth['tenant_id']),
        user_id=int(auth['sub']),
        name=payload.name.strip().lower(),
        unit=payload.unit.strip().lower(),
        calories_per_unit=payload.calories_per_unit,
        protein_per_unit=payload.protein_per_unit,
        carbs_per_unit=payload.carbs_per_unit,
        fats_per_unit=payload.fats_per_unit,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return CustomFoodResponse(
        id=row.id,
        name=row.name,
        unit=row.unit,
        calories_per_unit=row.calories_per_unit,
        protein_per_unit=row.protein_per_unit,
        carbs_per_unit=row.carbs_per_unit,
        fats_per_unit=row.fats_per_unit,
        created_at=row.created_at,
    )


@router.delete('/foods/custom/{food_id}')
def delete_custom_food(food_id: int, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = db.scalar(
        select(CustomFoodItem).where(
            and_(
                CustomFoodItem.id == food_id,
                CustomFoodItem.user_id == int(auth['sub']),
                CustomFoodItem.tenant_id == int(auth['tenant_id']),
            )
        )
    )
    if not row:
        raise HTTPException(status_code=404, detail='Custom food not found')
    db.delete(row)
    db.commit()
    return {'message': 'custom food deleted'}


@router.get('/meals/logs', response_model=list[MealLogResponse])
def list_meals(
    period: str = Query(default='daily', pattern='^(daily|weekly|monthly|yearly)$'),
    db: Session = Depends(get_db),
    auth: dict = Depends(get_current_auth_payload),
):
    days_map = {'daily': 1, 'weekly': 7, 'monthly': 30, 'yearly': 365}
    start = date.today() - timedelta(days=days_map[period] - 1)
    rows = db.scalars(
        select(MealLog)
        .where(and_(MealLog.user_id == int(auth['sub']), MealLog.tenant_id == int(auth['tenant_id']), MealLog.date >= start))
        .order_by(MealLog.date.desc(), MealLog.updated_at.desc())
    ).all()
    return [
        MealLogResponse(
            id=r.id,
            date=r.date,
            meal_type=r.meal_type,
            food_name=r.food_name,
            quantity=r.quantity,
            unit=r.unit,
            calories=r.calories,
            protein_g=r.protein_g,
            carbs_g=r.carbs_g,
            fats_g=r.fats_g,
            source=r.source,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in rows
    ]


@router.post('/meals/logs', response_model=MealLogResponse)
def create_meal_log(payload: MealLogRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = MealLog(
        tenant_id=int(auth['tenant_id']),
        user_id=int(auth['sub']),
        date=payload.date,
        meal_type=payload.meal_type.lower(),
        food_name=payload.food_name.lower(),
        quantity=payload.quantity,
        unit=payload.unit.lower(),
        calories=payload.calories,
        protein_g=payload.protein_g,
        carbs_g=payload.carbs_g,
        fats_g=payload.fats_g,
        source=payload.source.lower(),
    )
    db.add(row)
    _refresh_daily_rollups(db, int(auth['sub']), int(auth['tenant_id']), payload.date)
    db.commit()
    db.refresh(row)
    return MealLogResponse(
        id=row.id,
        date=row.date,
        meal_type=row.meal_type,
        food_name=row.food_name,
        quantity=row.quantity,
        unit=row.unit,
        calories=row.calories,
        protein_g=row.protein_g,
        carbs_g=row.carbs_g,
        fats_g=row.fats_g,
        source=row.source,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.put('/meals/logs/{log_id}', response_model=MealLogResponse)
def update_meal_log(log_id: int, payload: MealLogRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = db.scalar(
        select(MealLog).where(and_(MealLog.id == log_id, MealLog.user_id == int(auth['sub']), MealLog.tenant_id == int(auth['tenant_id'])))
    )
    if not row:
        raise HTTPException(status_code=404, detail='Meal log not found')
    original_date = row.date
    row.date = payload.date
    row.meal_type = payload.meal_type.lower()
    row.food_name = payload.food_name.lower()
    row.quantity = payload.quantity
    row.unit = payload.unit.lower()
    row.calories = payload.calories
    row.protein_g = payload.protein_g
    row.carbs_g = payload.carbs_g
    row.fats_g = payload.fats_g
    row.source = payload.source.lower()
    _refresh_daily_rollups(db, int(auth['sub']), int(auth['tenant_id']), payload.date)
    if original_date != payload.date:
        _refresh_daily_rollups(db, int(auth['sub']), int(auth['tenant_id']), original_date)
    db.commit()
    db.refresh(row)
    return MealLogResponse(
        id=row.id,
        date=row.date,
        meal_type=row.meal_type,
        food_name=row.food_name,
        quantity=row.quantity,
        unit=row.unit,
        calories=row.calories,
        protein_g=row.protein_g,
        carbs_g=row.carbs_g,
        fats_g=row.fats_g,
        source=row.source,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.delete('/meals/logs/{log_id}')
def delete_meal_log(log_id: int, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = db.scalar(
        select(MealLog).where(and_(MealLog.id == log_id, MealLog.user_id == int(auth['sub']), MealLog.tenant_id == int(auth['tenant_id'])))
    )
    if not row:
        raise HTTPException(status_code=404, detail='Meal log not found')
    target_date = row.date
    db.delete(row)
    _refresh_daily_rollups(db, int(auth['sub']), int(auth['tenant_id']), target_date)
    db.commit()
    return {'message': 'meal log deleted'}


@router.get('/workouts/logs', response_model=list[WorkoutLogResponse])
def list_workouts(
    period: str = Query(default='daily', pattern='^(daily|weekly|monthly|yearly)$'),
    db: Session = Depends(get_db),
    auth: dict = Depends(get_current_auth_payload),
):
    days_map = {'daily': 1, 'weekly': 7, 'monthly': 30, 'yearly': 365}
    start = date.today() - timedelta(days=days_map[period] - 1)
    rows = db.scalars(
        select(WorkoutLog)
        .where(and_(WorkoutLog.user_id == int(auth['sub']), WorkoutLog.tenant_id == int(auth['tenant_id']), WorkoutLog.date >= start))
        .order_by(WorkoutLog.date.desc(), WorkoutLog.updated_at.desc())
    ).all()
    return [
        WorkoutLogResponse(
            id=r.id,
            date=r.date,
            category=r.category,
            name=r.name,
            sets=r.sets,
            reps=r.reps,
            duration_minutes=r.duration_minutes,
            calories_burned_kcal=r.calories_burned_kcal,
            notes=r.notes,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in rows
    ]


@router.post('/workouts/logs', response_model=WorkoutLogResponse)
def create_workout_log(payload: WorkoutLogRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = WorkoutLog(
        tenant_id=int(auth['tenant_id']),
        user_id=int(auth['sub']),
        date=payload.date,
        category=payload.category.lower(),
        name=payload.name.lower(),
        sets=payload.sets,
        reps=payload.reps,
        duration_minutes=payload.duration_minutes,
        calories_burned_kcal=payload.calories_burned_kcal,
        notes=payload.notes,
    )
    db.add(row)
    _refresh_daily_rollups(db, int(auth['sub']), int(auth['tenant_id']), payload.date)
    db.commit()
    db.refresh(row)
    return WorkoutLogResponse(
        id=row.id,
        date=row.date,
        category=row.category,
        name=row.name,
        sets=row.sets,
        reps=row.reps,
        duration_minutes=row.duration_minutes,
        calories_burned_kcal=row.calories_burned_kcal,
        notes=row.notes,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.put('/workouts/logs/{log_id}', response_model=WorkoutLogResponse)
def update_workout_log(log_id: int, payload: WorkoutLogRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = db.scalar(
        select(WorkoutLog).where(
            and_(WorkoutLog.id == log_id, WorkoutLog.user_id == int(auth['sub']), WorkoutLog.tenant_id == int(auth['tenant_id']))
        )
    )
    if not row:
        raise HTTPException(status_code=404, detail='Workout log not found')
    original_date = row.date
    row.date = payload.date
    row.category = payload.category.lower()
    row.name = payload.name.lower()
    row.sets = payload.sets
    row.reps = payload.reps
    row.duration_minutes = payload.duration_minutes
    row.calories_burned_kcal = payload.calories_burned_kcal
    row.notes = payload.notes
    _refresh_daily_rollups(db, int(auth['sub']), int(auth['tenant_id']), payload.date)
    if original_date != payload.date:
        _refresh_daily_rollups(db, int(auth['sub']), int(auth['tenant_id']), original_date)
    db.commit()
    db.refresh(row)
    return WorkoutLogResponse(
        id=row.id,
        date=row.date,
        category=row.category,
        name=row.name,
        sets=row.sets,
        reps=row.reps,
        duration_minutes=row.duration_minutes,
        calories_burned_kcal=row.calories_burned_kcal,
        notes=row.notes,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.delete('/workouts/logs/{log_id}')
def delete_workout_log(log_id: int, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = db.scalar(
        select(WorkoutLog).where(
            and_(WorkoutLog.id == log_id, WorkoutLog.user_id == int(auth['sub']), WorkoutLog.tenant_id == int(auth['tenant_id']))
        )
    )
    if not row:
        raise HTTPException(status_code=404, detail='Workout log not found')
    target_date = row.date
    db.delete(row)
    _refresh_daily_rollups(db, int(auth['sub']), int(auth['tenant_id']), target_date)
    db.commit()
    return {'message': 'workout log deleted'}


@router.get('/advanced-analysis', response_model=AdvancedAnalysisResponse)
def advanced_analysis(
    period: str = Query(default='weekly', pattern='^(daily|weekly|monthly|yearly)$'),
    db: Session = Depends(get_db),
    auth: dict = Depends(get_current_auth_payload),
):
    user_id = int(auth['sub'])
    tenant_id = int(auth['tenant_id'])
    rows, workout_by_date = _analytics_rows(db, user_id, tenant_id, period)
    points = _analytics_points(rows, workout_by_date)
    profile = db.scalar(
        select(FitnessProfile)
        .where(and_(FitnessProfile.user_id == user_id, FitnessProfile.tenant_id == tenant_id))
        .order_by(FitnessProfile.created_at.desc())
    )
    summary_payload = summary(db=db, auth=auth)
    suggestions: list[str] = []
    if profile:
        protein_gap = round(profile.protein_g - summary_payload.protein_g, 1)
        if protein_gap > 0:
            suggestions.append(f'Increase protein by about {protein_gap} g/day to hit your target.')
        if not summary_payload.workout_completed:
            suggestions.append('Add at least 20 minutes of cardio or a short strength workout today.')
        if summary_payload.water_completion_percent < 70:
            suggestions.append('Increase hydration intake to at least 70% of your target.')
    if len(suggestions) == 0:
        suggestions.append('Current trend is stable. Keep your current meal and workout consistency.')
    return AdvancedAnalysisResponse(
        period=period,
        last_updated_at=summary_payload.last_updated_at,
        last_recorded_date=summary_payload.last_recorded_date,
        points=points,
        suggestions=suggestions,
    )


@router.post('/ai-coach/ingredient-suggestions', response_model=AICoachSuggestionResponse)
def ingredient_suggestions(
    payload: AICoachIngredientRequest,
    db: Session = Depends(get_db),
    auth: dict = Depends(get_current_auth_payload),
):
    user = db.get(User, int(auth['sub']))
    ingredients = [x.strip().lower() for x in payload.ingredients if x.strip()]
    joined = ', '.join(ingredients)
    suggestions: list[str] = []
    if {'rice', 'egg'}.issubset(set(ingredients)):
        suggestions.append('Egg fried rice with veggies and curd for a balanced carb-protein meal.')
    if {'paneer', 'rice'}.issubset(set(ingredients)):
        suggestions.append('Paneer rice bowl with salad and lemon for better micronutrient balance.')
    if 'egg' in ingredients and 'paneer' in ingredients:
        suggestions.append('Paneer bhurji + egg scramble can boost protein quickly.')
    if len(suggestions) == 0:
        suggestions.append(f'Build a bowl using {joined}: combine one protein source, one carb source, and vegetables.')
    return AICoachSuggestionResponse(
        title='Ingredient-based meal ideas',
        suggestions=suggestions,
        personalized_message=f'{user.full_name}, these options are based on ingredients you currently have.',
    )


@router.get('/ai-coach/daily-suggestions', response_model=AICoachSuggestionResponse)
def daily_suggestions(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    user = db.get(User, int(auth['sub']))
    profile = db.scalar(
        select(FitnessProfile)
        .where(and_(FitnessProfile.user_id == int(auth['sub']), FitnessProfile.tenant_id == int(auth['tenant_id'])))
        .order_by(FitnessProfile.created_at.desc())
    )
    payload = summary(db=db, auth=auth)
    suggestions: list[str] = []
    if profile:
        protein_gap = round(profile.protein_g - payload.protein_g, 1)
        carb_gap = round(profile.carbs_g - payload.carbs_g, 1)
        fat_gap = round(profile.fats_g - payload.fats_g, 1)
        if protein_gap > 0:
            suggestions.append(f'Add roughly {protein_gap} g protein (paneer, eggs, greek yogurt, or chicken).')
        if carb_gap > 0:
            suggestions.append(f'Add roughly {carb_gap} g carbs (rice, oats, fruit, or roti).')
        if fat_gap > 0:
            suggestions.append(f'Add roughly {fat_gap} g healthy fats (nuts, seeds, or peanut butter).')
    if not payload.workout_completed:
        suggestions.append('Schedule at least 20-30 minutes of cardio or a short strength session today.')
    if len(suggestions) == 0:
        suggestions.append('You are close to your target macros and activity level for today.')
    return AICoachSuggestionResponse(
        title='Personal daily recommendations',
        suggestions=suggestions,
        personalized_message=f'{user.full_name}, these suggestions use only your personal tracking data.',
    )


@router.post('/performance-report', response_model=PerformanceAnalysisResponse)
def performance_report(
    payload: PerformanceAnalysisRequest,
    db: Session = Depends(get_db),
    auth: dict = Depends(get_current_auth_payload),
):
    report = analyze_daily_performance(
        entry_text=payload.entry_text,
        maintenance_kcal=payload.maintenance_kcal,
        goal=payload.goal,
        body_weight_kg=payload.body_weight_kg,
    )

    if payload.save_to_daily_log:
        row = _get_or_create(db, int(auth['sub']), int(auth['tenant_id']))
        row.calories_consumed = report['nutrition_report']['total_calories_kcal']
        row.protein_g = report['nutrition_report']['total_protein_g']
        row.carbs_g = report['nutrition_report']['total_carbs_g']
        row.fats_g = report['nutrition_report']['total_fats_g']
        row.water_ml = report['hydration_report']['consumed_liters'] * 1000
        row.workout_completed = report['workout_report']['total_activity_burn_kcal'] > 0
        row.meals_completed = min(len(report['nutrition_report']['meals']), 4)
        profile = db.scalar(
            select(FitnessProfile)
            .where(and_(FitnessProfile.user_id == row.user_id, FitnessProfile.tenant_id == row.tenant_id))
            .order_by(FitnessProfile.created_at.desc())
        )
        row.consistency_score = _compute_consistency(row, profile)
        db.commit()

    return report
