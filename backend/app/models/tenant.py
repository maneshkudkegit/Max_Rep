from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Tenant(Base):
    __tablename__ = 'tenants'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    brand_name: Mapped[str] = mapped_column(String(120), nullable=False, default='Max Rep')
    primary_color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    secondary_color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    memberships = relationship('Membership', back_populates='tenant', cascade='all, delete-orphan')
    subscriptions = relationship('Subscription', back_populates='tenant', cascade='all, delete-orphan')
