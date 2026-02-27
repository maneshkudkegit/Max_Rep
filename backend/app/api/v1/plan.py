from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_auth_payload
from app.models.fitness import FitnessProfile
from app.models.user import User
from app.schemas.fitness import PlanResponse
from app.services.fitness_engine import estimate_days_to_goal


router = APIRouter(prefix='/plan', tags=['plan'])


@router.get('/today', response_model=PlanResponse)
def today_plan(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    user = db.get(User, int(auth['sub']))
    profile = db.scalar(
        select(FitnessProfile)
        .where(and_(FitnessProfile.user_id == int(auth['sub']), FitnessProfile.tenant_id == int(auth['tenant_id'])))
        .order_by(FitnessProfile.created_at.desc())
    )
    if not profile:
        raise HTTPException(status_code=404, detail='No plan found for user')

    est_days, assumed_target_weight = estimate_days_to_goal(
        goal=user.goal if user else 'fat_loss',
        current_weight_kg=user.weight_kg if user else 75,
        tdee=profile.tdee,
        target_calories=profile.calorie_target,
    )

    return PlanResponse(
        bmr=profile.bmr,
        tdee=profile.tdee,
        calorie_target=profile.calorie_target,
        protein_g=profile.protein_g,
        carbs_g=profile.carbs_g,
        fats_g=profile.fats_g,
        fiber_g=profile.fiber_g,
        water_ml=profile.water_ml,
        bmi=0,
        body_fat_percent=0,
        roadmap=profile.roadmap,
        workout_schedule=profile.workout_schedule,
        meals_plan=profile.meals_plan,
        estimated_days_to_goal=est_days,
        target_weight_assumption_kg=assumed_target_weight,
    )


@router.post('/recalculate', response_model=PlanResponse)
def recalculate(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    return today_plan(db, auth)
