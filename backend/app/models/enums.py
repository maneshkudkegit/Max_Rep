from enum import StrEnum


class MembershipRole(StrEnum):
    SUPERADMIN = 'superadmin'
    GYM_ADMIN = 'gym_admin'
    TRAINER = 'trainer'
    MEMBER = 'member'


class SubscriptionTier(StrEnum):
    FREE = 'free'
    PRO = 'pro'
    PREMIUM = 'premium'


class SubscriptionStatus(StrEnum):
    ACTIVE = 'active'
    CANCELED = 'canceled'
    PAST_DUE = 'past_due'
    TRIALING = 'trialing'


class GoalType(StrEnum):
    FAT_LOSS = 'fat_loss'
    MUSCLE_GAIN = 'muscle_gain'


class ActivityLevel(StrEnum):
    SEDENTARY = 'sedentary'
    LIGHT = 'light'
    MODERATE = 'moderate'
    ACTIVE = 'active'
    VERY_ACTIVE = 'very_active'


class CurrentPhase(StrEnum):
    BEGINNER = 'beginner'
    MUSCLE_BUILDING = 'muscle_building'
    WEIGHT_PLATEAU = 'weight_plateau'
    RECOVERY_PHASE = 'recovery_phase'
    BUSY_LIFESTYLE = 'busy_lifestyle'
    TRANSFORMATION_CHALLENGE = 'transformation_challenge'
