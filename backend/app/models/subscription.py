from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.enums import SubscriptionStatus, SubscriptionTier


class Subscription(Base):
    __tablename__ = 'subscriptions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True)
    tier: Mapped[SubscriptionTier] = mapped_column(String(20), nullable=False, default=SubscriptionTier.FREE)
    status: Mapped[SubscriptionStatus] = mapped_column(String(20), nullable=False, default=SubscriptionStatus.ACTIVE)
    provider: Mapped[str] = mapped_column(String(20), nullable=False, default='stripe')
    provider_customer_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    provider_subscription_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    tenant = relationship('Tenant', back_populates='subscriptions')


class SubscriptionFeature(Base):
    __tablename__ = 'subscription_features'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tier: Mapped[SubscriptionTier] = mapped_column(String(20), nullable=False, index=True)
    feature_key: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    enabled: Mapped[bool] = mapped_column(nullable=False, default=True)
