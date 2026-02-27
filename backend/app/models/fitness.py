from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class FitnessProfile(Base):
    __tablename__ = 'fitness_profiles'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    bmr: Mapped[float] = mapped_column(Float, nullable=False)
    tdee: Mapped[float] = mapped_column(Float, nullable=False)
    calorie_target: Mapped[float] = mapped_column(Float, nullable=False)
    protein_g: Mapped[float] = mapped_column(Float, nullable=False)
    carbs_g: Mapped[float] = mapped_column(Float, nullable=False)
    fats_g: Mapped[float] = mapped_column(Float, nullable=False)
    fiber_g: Mapped[float] = mapped_column(Float, nullable=False)
    water_ml: Mapped[float] = mapped_column(Float, nullable=False)
    roadmap: Mapped[str] = mapped_column(String(800), nullable=False)
    workout_schedule: Mapped[str] = mapped_column(String(800), nullable=False)
    meals_plan: Mapped[str] = mapped_column(String(1500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    user = relationship('User', back_populates='fitness_profiles')


class DailyTracking(Base):
    __tablename__ = 'daily_tracking'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    calories_consumed: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    protein_g: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    carbs_g: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    fats_g: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    water_ml: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    meals_completed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    workout_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    sleep_hours: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    consistency_score: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    streak_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
