import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_auth_payload, get_current_membership
from app.core.db import get_db
from app.models.billing_event import BillingEvent
from app.models.subscription import Subscription, SubscriptionTier
from app.schemas.billing import CheckoutSessionRequest, CheckoutSessionResponse, PortalSessionResponse, SubscriptionResponse
from app.services.billing import stripe_checkout_url, stripe_portal_url


router = APIRouter(prefix='/billing', tags=['billing'])


@router.post('/checkout-session', response_model=CheckoutSessionResponse)
def checkout(payload: CheckoutSessionRequest, auth: dict = Depends(get_current_auth_payload)):
    if payload.tier not in {SubscriptionTier.FREE.value, SubscriptionTier.PRO.value, SubscriptionTier.PREMIUM.value}:
        raise HTTPException(status_code=400, detail='Invalid tier')
    return CheckoutSessionResponse(checkout_url=stripe_checkout_url(payload.tier))


@router.post('/portal-session', response_model=PortalSessionResponse)
def portal(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    sub = db.scalar(select(Subscription).where(Subscription.tenant_id == int(auth['tenant_id'])).order_by(Subscription.created_at.desc()))
    return PortalSessionResponse(portal_url=stripe_portal_url(sub.provider_customer_id if sub else None))


@router.get('/subscription', response_model=SubscriptionResponse)
def subscription(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload)):
    sub = db.scalar(select(Subscription).where(Subscription.tenant_id == int(auth['tenant_id'])).order_by(Subscription.created_at.desc()))
    if not sub:
        return SubscriptionResponse(tier=SubscriptionTier.FREE.value, status='active', provider='stripe')
    return SubscriptionResponse(tier=sub.tier, status=sub.status, provider=sub.provider)


@router.post('/webhook/stripe')
async def webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    event = json.loads(payload.decode('utf-8') or '{}')
    event_id = event.get('id', 'unknown')
    event_type = event.get('type', 'unknown')

    existing = db.scalar(select(BillingEvent).where(BillingEvent.event_id == event_id))
    if existing:
        return {'message': 'event already processed'}

    db.add(BillingEvent(provider='stripe', event_id=event_id, event_type=event_type, payload=payload.decode('utf-8')))
    db.commit()
    return {'message': 'received'}
