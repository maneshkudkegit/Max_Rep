from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.enums import ActivityLevel, CurrentPhase, GoalType


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)

    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(16), nullable=False)
    height_cm: Mapped[float] = mapped_column(Float, nullable=False)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    activity_level: Mapped[ActivityLevel] = mapped_column(String(20), nullable=False)
    goal: Mapped[GoalType] = mapped_column(String(20), nullable=False)
    current_phase: Mapped[CurrentPhase] = mapped_column(String(40), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    memberships = relationship('Membership', back_populates='user', cascade='all, delete-orphan')
    auth_sessions = relationship('AuthSession', back_populates='user', cascade='all, delete-orphan')
    fitness_profiles = relationship('FitnessProfile', back_populates='user', cascade='all, delete-orphan')
