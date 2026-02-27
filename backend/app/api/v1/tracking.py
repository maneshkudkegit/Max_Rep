from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_auth_payload
from app.models.fitness import DailyTracking, FitnessProfile
from app.models.notification import Notification
from app.schemas.fitness import (
    AnalyticsPoint,
    NotificationResponse,
    PerformanceAnalysisRequest,
    PerformanceAnalysisResponse,
    TrackingSummaryResponse,
    TrackingUpsertRequest,
)
from app.services.performance_engine import analyze_daily_performance
from app.services.notifications import create_alert


router = APIRouter(prefix='/tracking', tags=['tracking'])


def _get_or_create(db: Session, user_id: int, tenant_id: int) -> DailyTracking:
    today = date.today()
    row = db.scalar(select(DailyTracking).where(and_(DailyTracking.user_id == user_id, DailyTracking.tenant_id == tenant_id, DailyTracking.date == today)))
    if row:
        return row
    row = DailyTracking(user_id=user_id, tenant_id=tenant_id, date=today)
    db.add(row)
    db.flush()
    return row


@router.put('/meals')
def upsert_meals(payload: TrackingUpsertRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = _get_or_create(db, int(auth['sub']), int(auth['tenant_id']))
    row.calories_consumed = payload.calories_consumed
    row.protein_g = payload.protein_g
    row.carbs_g = payload.carbs_g
    row.fats_g = payload.fats_g
    row.meals_completed = payload.meals_completed
    db.commit()
    return {'message': 'meal tracking updated'}


@router.put('/hydration')
def upsert_hydration(payload: TrackingUpsertRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = _get_or_create(db, int(auth['sub']), int(auth['tenant_id']))
    row.water_ml = payload.water_ml

    profile = db.scalar(select(FitnessProfile).where(and_(FitnessProfile.user_id == row.user_id, FitnessProfile.tenant_id == row.tenant_id)).order_by(FitnessProfile.created_at.desc()))
    if profile and payload.water_ml < profile.water_ml * 0.7:
        create_alert(db, row.tenant_id, row.user_id, 'hydration', 'Hydration Alert', 'Water intake below 70% target by evening.')

    db.commit()
    return {'message': 'hydration updated'}


@router.put('/workout')
def upsert_workout(payload: TrackingUpsertRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = _get_or_create(db, int(auth['sub']), int(auth['tenant_id']))
    row.workout_completed = payload.workout_completed
    db.commit()
    return {'message': 'workout updated'}


@router.put('/weight')
def upsert_weight(payload: TrackingUpsertRequest, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    row = _get_or_create(db, int(auth['sub']), int(auth['tenant_id']))
    row.weight_kg = payload.weight_kg
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
    row = _get_or_create(db, int(auth['sub']), int(auth['tenant_id']))
    profile = db.scalar(select(FitnessProfile).where(and_(FitnessProfile.user_id == row.user_id, FitnessProfile.tenant_id == row.tenant_id)).order_by(FitnessProfile.created_at.desc()))

    target = profile.calorie_target if profile else 0
    nutrient_target = (profile.protein_g + profile.carbs_g + profile.fats_g) if profile else 1
    nutrient_done = row.protein_g + row.carbs_g + row.fats_g

    row.consistency_score = min(
        ((row.calories_consumed / target) * 30 if target else 0)
        + ((row.water_ml / profile.water_ml) * 20 if profile and profile.water_ml else 0)
        + (20 if row.workout_completed else 0)
        + (min(row.meals_completed / 4, 1) * 20)
        + (10 if row.weight_kg is not None else 0),
        100,
    )
    db.commit()

    return TrackingSummaryResponse(
        calories_consumed=row.calories_consumed,
        calorie_target=target,
        deficit_or_surplus=round(row.calories_consumed - target, 2),
        nutrient_completion_percent=round(min((nutrient_done / nutrient_target) * 100, 100), 2),
        water_completion_percent=round(min((row.water_ml / profile.water_ml) * 100 if profile and profile.water_ml else 0, 100), 2),
        workout_completed=row.workout_completed,
        consistency_score=round(row.consistency_score, 2),
        streak_count=row.streak_count,
    )


@router.get('/notifications', response_model=list[NotificationResponse])
def notifications(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    rows = db.scalars(select(Notification).where(and_(Notification.user_id == int(auth['sub']), Notification.tenant_id == int(auth['tenant_id']))).order_by(Notification.created_at.desc())).all()
    return [NotificationResponse(id=r.id, kind=r.kind, title=r.title, message=r.message, status=r.status) for r in rows]


@router.get('/analytics/weekly', response_model=list[AnalyticsPoint])
def weekly(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    start = date.today() - timedelta(days=6)
    rows = db.scalars(select(DailyTracking).where(and_(DailyTracking.user_id == int(auth['sub']), DailyTracking.tenant_id == int(auth['tenant_id']), DailyTracking.date >= start)).order_by(DailyTracking.date.asc())).all()
    return [AnalyticsPoint(date=str(r.date), consistency_score=r.consistency_score, calories_consumed=r.calories_consumed, water_ml=r.water_ml) for r in rows]


@router.get('/analytics/monthly', response_model=list[AnalyticsPoint])
def monthly(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    start = date.today() - timedelta(days=29)
    rows = db.scalars(select(DailyTracking).where(and_(DailyTracking.user_id == int(auth['sub']), DailyTracking.tenant_id == int(auth['tenant_id']), DailyTracking.date >= start)).order_by(DailyTracking.date.asc())).all()
    return [AnalyticsPoint(date=str(r.date), consistency_score=r.consistency_score, calories_consumed=r.calories_consumed, water_ml=r.water_ml) for r in rows]


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
        db.commit()

    return report
