from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class BillingEvent(Base):
    __tablename__ = 'billing_events'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey('tenants.id', ondelete='SET NULL'), nullable=True, index=True)
    provider: Mapped[str] = mapped_column(String(20), nullable=False, default='stripe')
    event_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    event_type: Mapped[str] = mapped_column(String(120), nullable=False)
    payload: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
