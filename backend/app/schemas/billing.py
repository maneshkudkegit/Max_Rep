from pydantic import BaseModel


class CheckoutSessionRequest(BaseModel):
    tier: str


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


class SubscriptionResponse(BaseModel):
    tier: str
    status: str
    provider: str


class PortalSessionResponse(BaseModel):
    portal_url: str
