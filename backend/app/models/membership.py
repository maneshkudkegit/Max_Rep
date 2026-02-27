from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.enums import MembershipRole


class Membership(Base):
    __tablename__ = 'tenant_memberships'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    role: Mapped[MembershipRole] = mapped_column(String(20), nullable=False, default=MembershipRole.MEMBER)
    current_session_id: Mapped[int | None] = mapped_column(ForeignKey('auth_sessions.id', ondelete='SET NULL'), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    tenant = relationship('Tenant', back_populates='memberships')
    user = relationship('User', back_populates='memberships')
