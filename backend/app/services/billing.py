from app.models.subscription import SubscriptionTier


def stripe_checkout_url(tier: str) -> str:
    # Real Stripe Checkout session creation should be wired with stripe SDK.
    return f'https://checkout.stripe.com/mock/{tier}'


def stripe_portal_url(customer_id: str | None) -> str:
    _ = customer_id
    return 'https://billing.stripe.com/mock-portal'


def provider_price_key(tier: str) -> str:
    mapping = {
        SubscriptionTier.FREE.value: 'price_free',
        SubscriptionTier.PRO.value: 'price_pro',
        SubscriptionTier.PREMIUM.value: 'price_premium',
    }
    return mapping[tier]
