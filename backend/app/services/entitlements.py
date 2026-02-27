from app.models.subscription import SubscriptionTier


TIER_FEATURES: dict[SubscriptionTier, set[str]] = {
    SubscriptionTier.FREE: {
        'basic_dashboard',
        'basic_tracking',
    },
    SubscriptionTier.PRO: {
        'basic_dashboard',
        'basic_tracking',
        'advanced_analytics',
        'custom_workout_splits',
        'personalized_diet_plan',
        'pdf_reports',
    },
    SubscriptionTier.PREMIUM: {
        'basic_dashboard',
        'basic_tracking',
        'advanced_analytics',
        'custom_workout_splits',
        'personalized_diet_plan',
        'pdf_reports',
        'trainer_chat',
        'ai_recommendations',
    },
}


def has_feature(tier: str, feature: str) -> bool:
    try:
        tier_enum = SubscriptionTier(tier)
    except ValueError:
        return False
    return feature in TIER_FEATURES[tier_enum]
