from datetime import datetime, timezone

from sqlalchemy import select

from app.core.config import settings
from app.core.db import SessionLocal
from app.core.security import get_password_hash
from app.models.membership import Membership, MembershipRole
from app.models.subscription import Subscription, SubscriptionStatus, SubscriptionTier
from app.models.tenant import Tenant
from app.models.user import User


def seed_initial_data() -> None:
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == settings.superadmin_email.lower())):
            return

        tenant = Tenant(name='Max Rep Demo Gym', slug='max-rep-demo-gym', brand_name='Max Rep')
        db.add(tenant)
        db.flush()

        superadmin = User(
            email=settings.superadmin_email.lower(),
            password_hash=get_password_hash(settings.superadmin_password),
            full_name='Max Rep Super Admin',
            age=30,
            gender='male',
            height_cm=178,
            weight_kg=78,
            activity_level='moderate',
            goal='muscle_gain',
            current_phase='transformation_challenge',
        )
        db.add(superadmin)
        db.flush()

        db.add(Membership(user_id=superadmin.id, tenant_id=tenant.id, role=MembershipRole.SUPERADMIN))
        db.add(
            Subscription(
                tenant_id=tenant.id,
                tier=SubscriptionTier.PREMIUM,
                status=SubscriptionStatus.ACTIVE,
                provider='stripe',
                current_period_end=datetime.now(timezone.utc),
            )
        )

        db.commit()


if __name__ == '__main__':
    seed_initial_data()
    print('Max Rep seed complete')
