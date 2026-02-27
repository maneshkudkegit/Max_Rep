from app.models.enums import ActivityLevel, GoalType


ACTIVITY_FACTORS = {
    ActivityLevel.SEDENTARY: 1.2,
    ActivityLevel.LIGHT: 1.375,
    ActivityLevel.MODERATE: 1.55,
    ActivityLevel.ACTIVE: 1.725,
    ActivityLevel.VERY_ACTIVE: 1.9,
}


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    if gender.lower() == 'male':
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161


def calorie_target(tdee: float, goal: str) -> float:
    return tdee * 0.8 if goal == GoalType.FAT_LOSS else tdee * 1.12


def macro_split(target_kcal: float, weight_kg: float, phase: str) -> tuple[float, float, float, float]:
    protein_factor = {
        'beginner': 1.6,
        'muscle_building': 2.2,
        'weight_plateau': 2.0,
        'recovery_phase': 1.8,
        'busy_lifestyle': 1.7,
        'transformation_challenge': 2.1,
    }.get(phase, 1.8)

    protein_g = weight_kg * protein_factor
    fats_g = (target_kcal * 0.25) / 9
    carbs_g = max((target_kcal - (protein_g * 4) - (fats_g * 9)) / 4, 0)
    fiber_g = max(weight_kg * 0.35, 20)
    return round(protein_g, 2), round(carbs_g, 2), round(fats_g, 2), round(fiber_g, 2)


def water_ml_target(weight_kg: float) -> float:
    return round(weight_kg * 35, 2)


def bmi(height_cm: float, weight_kg: float) -> float:
    m = height_cm / 100
    return round(weight_kg / (m * m), 2)


def body_fat_us_navy(height_cm: float, neck_cm: float = 38, waist_cm: float = 85, hip_cm: float | None = None, gender: str = 'male') -> float:
    import math

    if gender == 'female':
        hip = hip_cm if hip_cm else 95
        value = 163.205 * math.log10(waist_cm + hip - neck_cm) - 97.684 * math.log10(height_cm) - 78.387
    else:
        value = 86.01 * math.log10(waist_cm - neck_cm) - 70.041 * math.log10(height_cm) + 36.76
    return round(max(min(value, 55), 4), 2)


def roadmap_for_phase(phase: str) -> str:
    mapping = {
        'beginner': 'Weeks 1-4 habit setup, weeks 5-8 progressive overload, weeks 9-12 consolidation.',
        'muscle_building': 'Hypertrophy cycle with progressive overload and high-protein nutrition focus.',
        'weight_plateau': 'Calorie cycling, step target increase, and training variation over 6 weeks.',
        'recovery_phase': 'Deload programming, sleep optimization, and gradual load progression.',
        'busy_lifestyle': 'Time-efficient 30-minute workouts and meal-prep based nutrition system.',
        'transformation_challenge': '12-week phased transformation with weekly checkpoints and re-calibration.',
    }
    return mapping.get(phase, mapping['beginner'])


def estimate_days_to_goal(goal: str, current_weight_kg: float, tdee: float, target_calories: float) -> tuple[int, float]:
    if goal == GoalType.FAT_LOSS:
        target_weight = round(current_weight_kg * 0.92, 2)
        delta_kg = max(current_weight_kg - target_weight, 0.1)
        daily_delta_kcal = max(tdee - target_calories, 150)
    elif goal == GoalType.MUSCLE_GAIN:
        target_weight = round(current_weight_kg * 1.05, 2)
        delta_kg = max(target_weight - current_weight_kg, 0.1)
        daily_delta_kcal = max(target_calories - tdee, 120)
    else:
        target_weight = current_weight_kg
        delta_kg = 0.1
        daily_delta_kcal = 200

    days = int(round((delta_kg * 7700) / daily_delta_kcal))
    return max(days, 7), target_weight
