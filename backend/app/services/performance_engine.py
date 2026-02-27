from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Iterable

from app.services.fitness_engine import estimate_days_to_goal


@dataclass(frozen=True)
class FoodProfile:
    name: str
    aliases: tuple[str, ...]
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fats_per_100g: float
    default_grams: float
    quality: float
    unit_grams: dict[str, float]


@dataclass(frozen=True)
class ExerciseProfile:
    name: str
    aliases: tuple[str, ...]
    muscle_groups: tuple[str, ...]


FOOD_DATABASE: tuple[FoodProfile, ...] = (
    FoodProfile(
        name='egg',
        aliases=('egg', 'eggs'),
        calories_per_100g=143,
        protein_per_100g=13,
        carbs_per_100g=1.1,
        fats_per_100g=9.5,
        default_grams=50,
        quality=0.9,
        unit_grams={'piece': 50},
    ),
    FoodProfile(
        name='chicken breast',
        aliases=('chicken breast', 'grilled chicken', 'chicken'),
        calories_per_100g=165,
        protein_per_100g=31,
        carbs_per_100g=0,
        fats_per_100g=3.6,
        default_grams=120,
        quality=0.95,
        unit_grams={'piece': 120},
    ),
    FoodProfile(
        name='rice',
        aliases=('brown rice', 'white rice', 'rice'),
        calories_per_100g=130,
        protein_per_100g=2.7,
        carbs_per_100g=28.2,
        fats_per_100g=0.3,
        default_grams=150,
        quality=0.75,
        unit_grams={'cup': 160, 'bowl': 180},
    ),
    FoodProfile(
        name='oats',
        aliases=('oats', 'oatmeal'),
        calories_per_100g=389,
        protein_per_100g=16.9,
        carbs_per_100g=66.3,
        fats_per_100g=6.9,
        default_grams=60,
        quality=0.92,
        unit_grams={'cup': 80, 'bowl': 100},
    ),
    FoodProfile(
        name='banana',
        aliases=('banana', 'bananas'),
        calories_per_100g=89,
        protein_per_100g=1.1,
        carbs_per_100g=22.8,
        fats_per_100g=0.3,
        default_grams=120,
        quality=0.9,
        unit_grams={'piece': 120},
    ),
    FoodProfile(
        name='apple',
        aliases=('apple', 'apples'),
        calories_per_100g=52,
        protein_per_100g=0.3,
        carbs_per_100g=13.8,
        fats_per_100g=0.2,
        default_grams=130,
        quality=0.92,
        unit_grams={'piece': 130},
    ),
    FoodProfile(
        name='whole wheat bread',
        aliases=('whole wheat bread', 'brown bread', 'bread', 'toast'),
        calories_per_100g=247,
        protein_per_100g=13,
        carbs_per_100g=41,
        fats_per_100g=4.2,
        default_grams=30,
        quality=0.72,
        unit_grams={'slice': 30},
    ),
    FoodProfile(
        name='paneer',
        aliases=('paneer', 'cottage cheese'),
        calories_per_100g=265,
        protein_per_100g=18.3,
        carbs_per_100g=1.2,
        fats_per_100g=20.8,
        default_grams=100,
        quality=0.78,
        unit_grams={'piece': 25},
    ),
    FoodProfile(
        name='greek yogurt',
        aliases=('greek yogurt', 'curd', 'yogurt'),
        calories_per_100g=97,
        protein_per_100g=10,
        carbs_per_100g=3.9,
        fats_per_100g=4,
        default_grams=150,
        quality=0.88,
        unit_grams={'cup': 180, 'bowl': 180},
    ),
    FoodProfile(
        name='milk',
        aliases=('milk',),
        calories_per_100g=61,
        protein_per_100g=3.3,
        carbs_per_100g=4.8,
        fats_per_100g=3.2,
        default_grams=250,
        quality=0.8,
        unit_grams={'cup': 240},
    ),
    FoodProfile(
        name='whey protein',
        aliases=('whey', 'protein shake', 'whey protein'),
        calories_per_100g=400,
        protein_per_100g=80,
        carbs_per_100g=8,
        fats_per_100g=6,
        default_grams=30,
        quality=0.88,
        unit_grams={'scoop': 30},
    ),
    FoodProfile(
        name='almonds',
        aliases=('almond', 'almonds', 'mixed nuts', 'nuts'),
        calories_per_100g=579,
        protein_per_100g=21.2,
        carbs_per_100g=21.6,
        fats_per_100g=49.9,
        default_grams=28,
        quality=0.88,
        unit_grams={'piece': 1.2},
    ),
    FoodProfile(
        name='peanut butter',
        aliases=('peanut butter',),
        calories_per_100g=588,
        protein_per_100g=25,
        carbs_per_100g=20,
        fats_per_100g=50,
        default_grams=16,
        quality=0.72,
        unit_grams={'tbsp': 16},
    ),
    FoodProfile(
        name='salad',
        aliases=('salad', 'vegetables', 'veggies'),
        calories_per_100g=35,
        protein_per_100g=2,
        carbs_per_100g=7,
        fats_per_100g=0.3,
        default_grams=120,
        quality=0.97,
        unit_grams={'bowl': 120, 'cup': 90},
    ),
    FoodProfile(
        name='potato',
        aliases=('potato', 'potatoes'),
        calories_per_100g=77,
        protein_per_100g=2,
        carbs_per_100g=17,
        fats_per_100g=0.1,
        default_grams=150,
        quality=0.72,
        unit_grams={'piece': 150},
    ),
    FoodProfile(
        name='fish',
        aliases=('fish', 'salmon', 'tuna'),
        calories_per_100g=208,
        protein_per_100g=22,
        carbs_per_100g=0,
        fats_per_100g=13,
        default_grams=120,
        quality=0.9,
        unit_grams={'piece': 120},
    ),
    FoodProfile(
        name='lentils',
        aliases=('lentils', 'dal'),
        calories_per_100g=116,
        protein_per_100g=9,
        carbs_per_100g=20,
        fats_per_100g=0.4,
        default_grams=180,
        quality=0.86,
        unit_grams={'bowl': 180, 'cup': 170},
    ),
    FoodProfile(
        name='pasta',
        aliases=('pasta',),
        calories_per_100g=157,
        protein_per_100g=5.8,
        carbs_per_100g=30.9,
        fats_per_100g=0.9,
        default_grams=160,
        quality=0.65,
        unit_grams={'bowl': 180, 'cup': 160},
    ),
    FoodProfile(
        name='roti',
        aliases=('roti', 'chapati'),
        calories_per_100g=297,
        protein_per_100g=9.8,
        carbs_per_100g=53.7,
        fats_per_100g=7.5,
        default_grams=45,
        quality=0.7,
        unit_grams={'piece': 45},
    ),
    FoodProfile(
        name='cheese',
        aliases=('cheese',),
        calories_per_100g=402,
        protein_per_100g=25,
        carbs_per_100g=1.3,
        fats_per_100g=33,
        default_grams=30,
        quality=0.6,
        unit_grams={'slice': 20},
    ),
)


EXERCISE_DATABASE: tuple[ExerciseProfile, ...] = (
    ExerciseProfile('bench press', ('bench press', 'bench'), ('chest', 'triceps', 'shoulders')),
    ExerciseProfile('squat', ('squat', 'squats', 'back squat', 'front squat'), ('quads', 'glutes', 'core')),
    ExerciseProfile('deadlift', ('deadlift', 'deadlifts', 'romanian deadlift', 'rdl'), ('hamstrings', 'glutes', 'back')),
    ExerciseProfile('overhead press', ('overhead press', 'shoulder press', 'ohp'), ('shoulders', 'triceps')),
    ExerciseProfile('barbell row', ('barbell row', 'row', 'bent over row', 'seated row'), ('lats', 'upper back', 'biceps')),
    ExerciseProfile('pull up', ('pull up', 'pullups', 'chin up', 'chinups', 'lat pulldown'), ('lats', 'biceps')),
    ExerciseProfile('push up', ('push up', 'pushups', 'push-up'), ('chest', 'triceps', 'core')),
    ExerciseProfile('bicep curl', ('bicep curl', 'curls', 'hammer curl'), ('biceps',)),
    ExerciseProfile('tricep extension', ('tricep extension', 'triceps pushdown', 'dips'), ('triceps',)),
    ExerciseProfile('lunges', ('lunges', 'lunge'), ('quads', 'glutes')),
    ExerciseProfile('leg press', ('leg press',), ('quads', 'glutes')),
    ExerciseProfile('plank', ('plank',), ('core',)),
    ExerciseProfile('crunches', ('crunches', 'sit ups', 'situps'), ('core',)),
)


MUSCLE_GROUP_KEYWORDS = {
    'chest': ('chest', 'pec', 'pecs'),
    'back': ('back', 'lats'),
    'biceps': ('biceps', 'bicep'),
    'triceps': ('triceps', 'tricep'),
    'shoulders': ('shoulders', 'delts', 'shoulder'),
    'legs': ('legs', 'quads', 'hamstrings'),
    'glutes': ('glutes', 'glute'),
    'core': ('core', 'abs', 'abdominals'),
    'full body': ('full body', 'fullbody', 'whole body'),
}


CARDIO_METS = {
    'running': 9.8,
    'jogging': 7.0,
    'walking': 3.5,
    'cycling': 7.5,
    'swimming': 8.0,
    'rowing': 7.0,
    'elliptical': 5.5,
    'hiit': 10.0,
    'jump rope': 11.0,
}


MEAL_ALIASES = {
    'breakfast': ('breakfast', 'morning meal'),
    'lunch': ('lunch',),
    'dinner': ('dinner', 'supper'),
    'evening_snacks': ('snack', 'snacks', 'evening snack', 'evening snacks'),
    'pre_workout': ('pre-workout snack', 'pre workout snack', 'pre-workout meal', 'pre workout meal'),
    'post_workout': ('post-workout snack', 'post workout snack', 'post-workout meal', 'post workout meal'),
}


DEFAULT_MEAL_ESTIMATES = {
    'breakfast': {'kcal': 450.0, 'protein': 24.0, 'carbs': 52.0, 'fats': 16.0},
    'lunch': {'kcal': 650.0, 'protein': 35.0, 'carbs': 78.0, 'fats': 22.0},
    'dinner': {'kcal': 700.0, 'protein': 38.0, 'carbs': 75.0, 'fats': 26.0},
    'evening_snacks': {'kcal': 250.0, 'protein': 9.0, 'carbs': 30.0, 'fats': 9.0},
    'pre_workout': {'kcal': 220.0, 'protein': 14.0, 'carbs': 30.0, 'fats': 6.0},
    'post_workout': {'kcal': 320.0, 'protein': 28.0, 'carbs': 32.0, 'fats': 8.0},
    'general': {'kcal': 500.0, 'protein': 22.0, 'carbs': 60.0, 'fats': 18.0},
}


CARDIO_ALIASES = {
    'running': ('running', 'run', 'ran'),
    'jogging': ('jogging', 'jog'),
    'walking': ('walking', 'walk'),
    'cycling': ('cycling', 'bike', 'biking'),
    'swimming': ('swimming', 'swim'),
    'rowing': ('rowing', 'row'),
    'elliptical': ('elliptical',),
    'hiit': ('hiit',),
    'jump rope': ('jump rope', 'skipping'),
}


UNIT_ALIASES = {
    'gram': 'g',
    'grams': 'g',
    'g': 'g',
    'kg': 'kg',
    'ml': 'ml',
    'liter': 'liter',
    'liters': 'liter',
    'l': 'liter',
    'cup': 'cup',
    'cups': 'cup',
    'slice': 'slice',
    'slices': 'slice',
    'piece': 'piece',
    'pieces': 'piece',
    'egg': 'piece',
    'eggs': 'piece',
    'serving': 'serving',
    'servings': 'serving',
    'tbsp': 'tbsp',
    'tsp': 'tsp',
    'bowl': 'bowl',
    'bowls': 'bowl',
    'scoop': 'scoop',
}


def _normalize_whitespace(value: str) -> str:
    return re.sub(r'\s+', ' ', value).strip()


def _normalize_goal(goal: str | None, entry_text: str) -> str:
    if goal:
        raw = goal.lower().strip()
        if raw in {'fat_loss', 'muscle_gain', 'maintain'}:
            return raw
        if raw in {'fat loss', 'deficit', 'cutting'}:
            return 'fat_loss'
        if raw in {'muscle gain', 'weight gain', 'bulk', 'bulking', 'surplus'}:
            return 'muscle_gain'
    text = entry_text.lower()
    if any(k in text for k in ('fat loss', 'calorie deficit', 'cutting')):
        return 'fat_loss'
    if any(k in text for k in ('muscle gain', 'weight gain', 'calorie surplus', 'bulking')):
        return 'muscle_gain'
    return 'maintain'


def _meal_key(raw: str) -> str:
    label = raw.lower().strip()
    for key, aliases in MEAL_ALIASES.items():
        if label == key or label in aliases:
            return key
    return 'general'


def _extract_meal_sections(entry_text: str) -> dict[str, str]:
    label_pattern = '|'.join(
        sorted(
            {re.escape(alias) for aliases in MEAL_ALIASES.values() for alias in aliases}.union(
                {re.escape(k) for k in MEAL_ALIASES.keys()}
            ),
            key=len,
            reverse=True,
        )
    )
    pattern = re.compile(rf'\b({label_pattern})\b\s*[:\-]?', re.IGNORECASE)
    matches = list(pattern.finditer(entry_text))
    if not matches:
        return {'general': entry_text}

    sections: dict[str, str] = {}
    first_start = matches[0].start()
    if first_start > 0:
        leading = _normalize_whitespace(entry_text[:first_start])
        if leading:
            sections['general'] = leading

    for idx, match in enumerate(matches):
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(entry_text)
        key = _meal_key(match.group(1))
        chunk = _normalize_whitespace(entry_text[start:end])
        if not chunk:
            continue
        if key in sections:
            sections[key] = f"{sections[key]}. {chunk}"
        else:
            sections[key] = chunk
    return sections if sections else {'general': entry_text}


def _build_food_pattern(alias: str) -> re.Pattern[str]:
    escaped = re.escape(alias)
    return re.compile(
        rf'(?:(?P<qty>\d+(?:\.\d+)?)\s*(?P<unit>kg|g|grams?|ml|l|liters?|cup|cups|slice|slices|piece|pieces|eggs?|servings?|tbsp|tsp|bowl|bowls|scoop)?\s*(?:of\s+)?)?\b(?P<alias>{escaped})\b',
        re.IGNORECASE,
    )


def _overlaps(span: tuple[int, int], selected: Iterable[tuple[int, int]]) -> bool:
    start, end = span
    for s_start, s_end in selected:
        if start < s_end and end > s_start:
            return True
    return False


def _to_grams(profile: FoodProfile, qty: float | None, unit: str | None) -> float:
    if qty is None and unit is None:
        return profile.default_grams

    normalized_unit = UNIT_ALIASES.get((unit or '').lower().strip(), None)
    quantity = qty if qty is not None else 1.0

    if normalized_unit == 'g':
        return quantity
    if normalized_unit == 'kg':
        return quantity * 1000
    if normalized_unit == 'ml':
        return quantity
    if normalized_unit == 'liter':
        return quantity * 1000
    if normalized_unit == 'cup':
        return quantity * profile.unit_grams.get('cup', 240)
    if normalized_unit == 'slice':
        return quantity * profile.unit_grams.get('slice', max(profile.default_grams / 2, 20))
    if normalized_unit == 'piece':
        return quantity * profile.unit_grams.get('piece', profile.default_grams)
    if normalized_unit == 'serving':
        return quantity * profile.default_grams
    if normalized_unit == 'tbsp':
        return quantity * profile.unit_grams.get('tbsp', 15)
    if normalized_unit == 'tsp':
        return quantity * profile.unit_grams.get('tsp', 5)
    if normalized_unit == 'bowl':
        return quantity * profile.unit_grams.get('bowl', profile.default_grams * 1.4)
    if normalized_unit == 'scoop':
        return quantity * profile.unit_grams.get('scoop', 30)

    if qty is None:
        return profile.default_grams
    return quantity * profile.default_grams


def _extract_food_entries(section_text: str) -> list[dict]:
    candidates: list[dict] = []
    for profile in FOOD_DATABASE:
        for alias in sorted(profile.aliases, key=len, reverse=True):
            pattern = _build_food_pattern(alias)
            for match in pattern.finditer(section_text):
                qty = float(match.group('qty')) if match.group('qty') else None
                unit = match.group('unit')
                grams = max(_to_grams(profile, qty, unit), 1)
                factor = grams / 100
                candidates.append(
                    {
                        'span': (match.start(), match.end()),
                        'profile': profile,
                        'alias': alias,
                        'grams': grams,
                        'calories': profile.calories_per_100g * factor,
                        'protein': profile.protein_per_100g * factor,
                        'carbs': profile.carbs_per_100g * factor,
                        'fats': profile.fats_per_100g * factor,
                        'quality': profile.quality,
                    }
                )

    candidates.sort(key=lambda c: (-(c['span'][1] - c['span'][0]), c['span'][0]))
    selected_spans: list[tuple[int, int]] = []
    selected: list[dict] = []
    for candidate in candidates:
        span = candidate['span']
        if _overlaps(span, selected_spans):
            continue
        selected_spans.append(span)
        selected.append(candidate)

    selected.sort(key=lambda c: c['span'][0])
    return selected


def _macro_distribution(calories: float, protein_g: float, carbs_g: float, fats_g: float) -> dict[str, float]:
    calorie_base = max(calories, 1)
    protein_pct = (protein_g * 4 / calorie_base) * 100
    carbs_pct = (carbs_g * 4 / calorie_base) * 100
    fats_pct = (fats_g * 9 / calorie_base) * 100
    return {
        'protein_percent': round(protein_pct, 2),
        'carbs_percent': round(carbs_pct, 2),
        'fats_percent': round(fats_pct, 2),
    }


def _nutrition_score(
    total_calories: float,
    total_protein: float,
    macro_dist: dict[str, float],
    food_quality_weighted: float,
    maintenance_kcal: float,
    goal: str,
    body_weight_kg: float,
) -> float:
    protein_target = body_weight_kg * (2.0 if goal == 'fat_loss' else 1.8 if goal == 'muscle_gain' else 1.7)
    protein_ratio = total_protein / max(protein_target, 1)
    if protein_ratio >= 1:
        protein_score = 30.0
    else:
        protein_score = 30.0 * max(protein_ratio, 0)

    macro_targets = {
        'fat_loss': {'protein_percent': 35, 'carbs_percent': 35, 'fats_percent': 30},
        'muscle_gain': {'protein_percent': 30, 'carbs_percent': 45, 'fats_percent': 25},
        'maintain': {'protein_percent': 30, 'carbs_percent': 40, 'fats_percent': 30},
    }[goal]
    deviation = (
        abs(macro_dist['protein_percent'] - macro_targets['protein_percent'])
        + abs(macro_dist['carbs_percent'] - macro_targets['carbs_percent'])
        + abs(macro_dist['fats_percent'] - macro_targets['fats_percent'])
    )
    macro_score = max(0.0, 25.0 - (deviation * 0.35))

    quality_score = max(0.0, min(food_quality_weighted, 1.0)) * 20.0

    target_kcal = maintenance_kcal * (0.8 if goal == 'fat_loss' else 1.12 if goal == 'muscle_gain' else 1.0)
    delta = abs(total_calories - target_kcal)
    calorie_score = max(0.0, 25.0 * (1.0 - min(delta / max(target_kcal * 0.5, 1), 1.0)))

    total_score = protein_score + macro_score + quality_score + calorie_score
    return round(max(0.0, min(total_score, 100.0)), 2)


def _goal_calorie_targets(maintenance_kcal: float) -> dict[str, float]:
    return {
        'fat_loss': round(maintenance_kcal * 0.8, 2),
        'maintain': round(maintenance_kcal, 2),
        'maintenance': round(maintenance_kcal, 2),
        'muscle_gain': round(maintenance_kcal * 1.12, 2),
    }


def _goal_comparison(total_calories: float, maintenance_kcal: float) -> dict[str, dict[str, float | str]]:
    targets = _goal_calorie_targets(maintenance_kcal)
    comparison: dict[str, dict[str, float | str]] = {}
    for goal_name, target in targets.items():
        delta = round(total_calories - target, 2)
        if abs(delta) <= 50:
            status = 'on_target'
        elif delta > 0:
            status = 'over_target'
        else:
            status = 'under_target'
        comparison[goal_name] = {
            'target_kcal': target,
            'difference_kcal': delta,
            'status': status,
        }
    return comparison


def _protein_targets(body_weight_kg: float) -> tuple[float, float]:
    return round(body_weight_kg * 1.6, 2), round(body_weight_kg * 2.2, 2)


def _protein_status(total_protein: float, body_weight_kg: float) -> str:
    low, high = _protein_targets(body_weight_kg)
    if total_protein < low:
        return 'below_optimal'
    if total_protein > high * 1.1:
        return 'above_optimal'
    return 'optimal'


def _nutrient_gap_or_excess(total: float, target: float) -> float:
    return round(total - target, 2)


def _exercise_match(raw_name: str) -> ExerciseProfile | None:
    value = raw_name.lower().strip()
    for profile in EXERCISE_DATABASE:
        if any(alias in value or value in alias for alias in profile.aliases):
            return profile
    return None


def _extract_declared_muscle_groups(entry_text: str) -> list[str]:
    text = entry_text.lower()
    groups: list[str] = []
    for group, aliases in MUSCLE_GROUP_KEYWORDS.items():
        if any(alias in text for alias in aliases):
            groups.append(group)
    return sorted(set(groups))


def _extract_strength_exercises(entry_text: str) -> list[dict]:
    patterns = (
        re.compile(r'(?P<name>[a-zA-Z][a-zA-Z\s\-]{2,40}?)\s*(?P<sets>\d+)\s*[xX]\s*(?P<reps>\d+)\b'),
        re.compile(r'(?P<name>[a-zA-Z][a-zA-Z\s\-]{2,40}?)\s*(?P<sets>\d+)\s*sets?\s*(?:of\s*)?(?P<reps>\d+)\s*reps?\b', re.IGNORECASE),
    )

    found: list[dict] = []
    used: set[tuple[str, int, int]] = set()
    for pattern in patterns:
        for match in pattern.finditer(entry_text):
            profile = _exercise_match(match.group('name'))
            if not profile:
                continue
            sets = int(match.group('sets'))
            reps = int(match.group('reps'))
            key = (profile.name, sets, reps)
            if key in used:
                continue
            used.add(key)
            found.append({'name': profile.name, 'sets': sets, 'reps': reps, 'muscles': list(profile.muscle_groups)})

    entry_lower = entry_text.lower()
    existing_names = {item['name'] for item in found}
    for profile in EXERCISE_DATABASE:
        if any(alias in entry_lower for alias in profile.aliases):
            if profile.name in existing_names:
                continue
            key = (profile.name, 3, 12)
            found.append({'name': profile.name, 'sets': 3, 'reps': 12, 'muscles': list(profile.muscle_groups)})
            used.add(key)
            existing_names.add(profile.name)

    return found


def _extract_cardio(entry_text: str, body_weight_kg: float) -> list[dict]:
    cardio_rows: list[dict] = []
    text = entry_text.lower()
    for activity, aliases in CARDIO_ALIASES.items():
        activity_found = False
        for alias in aliases:
            pattern = re.compile(
                rf'\b(?:{re.escape(alias)})\b\s*(?:for)?\s*(?P<duration>\d+(?:\.\d+)?)?\s*(?P<unit>minutes?|mins?|min|hours?|hrs?|hr)?',
                re.IGNORECASE,
            )
            for match in pattern.finditer(text):
                duration = float(match.group('duration')) if match.group('duration') else 20.0
                unit = (match.group('unit') or 'min').lower()
                if unit in {'hour', 'hours', 'hr', 'hrs'}:
                    duration *= 60
                met = CARDIO_METS[activity]
                kcal = met * body_weight_kg * (duration / 60)
                cardio_rows.append({'activity': activity, 'duration_minutes': duration, 'calories': kcal})
                activity_found = True
            if activity_found:
                break

    alt = re.compile(
        r'(?P<duration>\d+(?:\.\d+)?)\s*(?P<unit>minutes?|mins?|min|hours?|hrs?|hr)\s*(?:of\s+)?(?P<activity>running|jogging|walking|cycling|swimming|rowing|elliptical|hiit|jump rope)',
        re.IGNORECASE,
    )
    for match in alt.finditer(text):
        duration = float(match.group('duration'))
        unit = match.group('unit').lower()
        if unit in {'hour', 'hours', 'hr', 'hrs'}:
            duration *= 60
        activity = match.group('activity').lower()
        met = CARDIO_METS[activity]
        kcal = met * body_weight_kg * (duration / 60)
        cardio_rows.append({'activity': activity, 'duration_minutes': duration, 'calories': kcal})

    dedup: dict[tuple[str, int], dict] = {}
    for row in cardio_rows:
        key = (row['activity'], int(round(row['duration_minutes'])))
        dedup[key] = row
    return list(dedup.values())


def _extract_steps(entry_text: str) -> int:
    matches = re.findall(r'(\d[\d,]{2,6})\s*steps?\b', entry_text.lower())
    if not matches:
        return 0
    values = []
    for raw in matches:
        try:
            values.append(int(raw.replace(',', '')))
        except ValueError:
            continue
    return max(values) if values else 0


def _extract_water_liters(entry_text: str) -> float:
    total = 0.0
    pattern = re.compile(
        r'(?P<qty>\d+(?:\.\d+)?)\s*(?P<unit>l|liter|liters|ml|milliliter|milliliters|glass|glasses|bottle|bottles)\b',
        re.IGNORECASE,
    )
    for match in pattern.finditer(entry_text):
        qty = float(match.group('qty'))
        unit = match.group('unit').lower()
        if unit in {'l', 'liter', 'liters'}:
            total += qty
        elif unit in {'ml', 'milliliter', 'milliliters'}:
            total += qty / 1000
        elif unit in {'glass', 'glasses'}:
            total += qty * 0.25
        elif unit in {'bottle', 'bottles'}:
            total += qty * 0.5
    return round(total, 2)


def _intensity_label(training_volume: int, avg_reps: float, cardio_minutes: float, steps: int) -> str:
    if training_volume >= 280 or (avg_reps <= 8 and training_volume >= 150) or cardio_minutes >= 45:
        return 'high'
    if training_volume >= 120 or cardio_minutes >= 25 or steps >= 8000:
        return 'moderate'
    if training_volume > 0 or cardio_minutes > 0 or steps > 0:
        return 'low'
    return 'low'


def _recovery_status(hydration_completion: float, nutrition_score: float, workout_intensity: str) -> str:
    if hydration_completion < 70:
        return 'Needs immediate hydration recovery'
    if nutrition_score < 60:
        return 'Needs nutrition optimization'
    if workout_intensity == 'high':
        return 'High-load day: prioritize sleep and protein recovery'
    return 'Recovery on track'


def _effort_analysis(training_volume: int, intensity: str, cardio_minutes: float, steps: int) -> str:
    if intensity == 'high':
        return (
            f'High effort session: volume {training_volume}, cardio {cardio_minutes:.0f} min, '
            f'and {steps} steps indicate elevated training load.'
        )
    if intensity == 'moderate':
        return (
            f'Moderate productive session: volume {training_volume} with {cardio_minutes:.0f} cardio minutes '
            f'and {steps} steps supports steady progression.'
        )
    if training_volume > 0 or cardio_minutes > 0 or steps > 0:
        return (
            f'Low-to-moderate effort day: volume {training_volume}, cardio {cardio_minutes:.0f} min, '
            f'and {steps} steps. Increase total workload for faster adaptation.'
        )
    return 'No meaningful training load detected. Schedule at least one structured session.'


def analyze_daily_performance(
    *,
    entry_text: str,
    maintenance_kcal: float = 2000,
    goal: str | None = None,
    body_weight_kg: float = 70,
) -> dict:
    normalized_goal = _normalize_goal(goal, entry_text)
    meal_sections = _extract_meal_sections(entry_text)

    meal_reports: list[dict] = []
    day_totals = {'calories': 0.0, 'protein': 0.0, 'carbs': 0.0, 'fats': 0.0}
    quality_weighted_sum = 0.0
    quality_calorie_weight = 0.0

    for meal_name, section in meal_sections.items():
        food_entries = _extract_food_entries(section)
        if not food_entries and section.strip():
            fallback = DEFAULT_MEAL_ESTIMATES.get(meal_name, DEFAULT_MEAL_ESTIMATES['general'])
            meal_kcal = fallback['kcal']
            meal_protein = fallback['protein']
            meal_carbs = fallback['carbs']
            meal_fats = fallback['fats']
            detected_items = ['estimated mixed meal']
            portions = ['default serving']
            quality_weighted_sum += meal_kcal * 0.6
            quality_calorie_weight += meal_kcal
        else:
            meal_kcal = sum(item['calories'] for item in food_entries)
            meal_protein = sum(item['protein'] for item in food_entries)
            meal_carbs = sum(item['carbs'] for item in food_entries)
            meal_fats = sum(item['fats'] for item in food_entries)
            detected_items = [item['profile'].name for item in food_entries]
            portions = [f"{item['grams']:.0f} g {item['profile'].name}" for item in food_entries]
            quality_weighted_sum += sum(item['calories'] * item['quality'] for item in food_entries)
            quality_calorie_weight += meal_kcal

        day_totals['calories'] += meal_kcal
        day_totals['protein'] += meal_protein
        day_totals['carbs'] += meal_carbs
        day_totals['fats'] += meal_fats

        meal_reports.append(
            {
                'meal': meal_name,
                'detected_items': detected_items,
                'estimated_portions': portions,
                'macros': {
                    'calories_kcal': round(meal_kcal, 2),
                    'protein_g': round(meal_protein, 2),
                    'carbs_g': round(meal_carbs, 2),
                    'fats_g': round(meal_fats, 2),
                },
            }
        )

    macro_dist = _macro_distribution(day_totals['calories'], day_totals['protein'], day_totals['carbs'], day_totals['fats'])
    calorie_balance = day_totals['calories'] - maintenance_kcal
    calorie_label = 'surplus' if calorie_balance > 50 else 'deficit' if calorie_balance < -50 else 'maintenance'
    goal_comparison = _goal_comparison(day_totals['calories'], maintenance_kcal)
    protein_low, protein_high = _protein_targets(body_weight_kg)
    protein_status = _protein_status(day_totals['protein'], body_weight_kg)
    goal_macro_targets = {
        'fat_loss': {'protein_g': body_weight_kg * 2.0, 'carbs_g': maintenance_kcal * 0.3 / 4, 'fats_g': maintenance_kcal * 0.25 / 9},
        'maintain': {'protein_g': body_weight_kg * 1.8, 'carbs_g': maintenance_kcal * 0.4 / 4, 'fats_g': maintenance_kcal * 0.3 / 9},
        'muscle_gain': {'protein_g': body_weight_kg * 1.8, 'carbs_g': maintenance_kcal * 0.48 / 4, 'fats_g': maintenance_kcal * 0.25 / 9},
    }
    active_macro_target = goal_macro_targets[normalized_goal]
    nutrient_gap_or_excess = {
        'calories_kcal': round(day_totals['calories'] - _goal_calorie_targets(maintenance_kcal)[normalized_goal], 2),
        'protein_g': _nutrient_gap_or_excess(day_totals['protein'], active_macro_target['protein_g']),
        'carbs_g': _nutrient_gap_or_excess(day_totals['carbs'], active_macro_target['carbs_g']),
        'fats_g': _nutrient_gap_or_excess(day_totals['fats'], active_macro_target['fats_g']),
    }
    quality_weighted = quality_weighted_sum / max(quality_calorie_weight, 1)
    nutrition_score = _nutrition_score(
        total_calories=day_totals['calories'],
        total_protein=day_totals['protein'],
        macro_dist=macro_dist,
        food_quality_weighted=quality_weighted,
        maintenance_kcal=maintenance_kcal,
        goal=normalized_goal,
        body_weight_kg=body_weight_kg,
    )

    strength = _extract_strength_exercises(entry_text)
    declared_muscle_groups = _extract_declared_muscle_groups(entry_text)
    cardio = _extract_cardio(entry_text, body_weight_kg)
    steps = _extract_steps(entry_text)
    water_liters = _extract_water_liters(entry_text)

    training_volume = sum(item['sets'] * item['reps'] for item in strength)
    set_count = max(sum(item['sets'] for item in strength), 1)
    avg_reps = training_volume / set_count if strength else 0
    cardio_minutes = sum(item['duration_minutes'] for item in cardio)
    intensity = _intensity_label(training_volume, avg_reps, cardio_minutes, steps)

    strength_minutes = sum(item['sets'] for item in strength) * 2.5
    strength_met = {'low': 4.5, 'moderate': 6.0, 'high': 7.5}[intensity]
    strength_kcal = strength_met * body_weight_kg * (strength_minutes / 60)
    cardio_kcal = sum(item['calories'] for item in cardio)
    step_kcal = steps * 0.04 * (body_weight_kg / 70)
    total_burn = strength_kcal + cardio_kcal + step_kcal
    if not strength and not cardio and not steps and declared_muscle_groups:
        fallback_minutes = 50
        fallback_met = 6.0
        strength_kcal = fallback_met * body_weight_kg * (fallback_minutes / 60)
        total_burn = strength_kcal
        training_volume = 180
        intensity = 'moderate'

    muscles = sorted({group for row in strength for group in row['muscles']}.union(set(declared_muscle_groups)))
    if not muscles and (cardio or steps > 0):
        muscles = ['full body conditioning']

    workout_score = 0.0
    if training_volume or cardio_kcal or step_kcal:
        volume_score = min(training_volume / 320, 1.0) * 35
        intensity_score = {'low': 12, 'moderate': 20, 'high': 25}[intensity]
        activity_score = min((cardio_kcal + step_kcal) / 600, 1.0) * 20
        variety_score = min((len(strength) + len(cardio)) / 6, 1.0) * 20
        workout_score = min(volume_score + intensity_score + activity_score + variety_score, 100)

    post_workout_protein = max(20.0, min(45.0, body_weight_kg * 0.3))
    hydration_target_l = 3.0
    if intensity == 'moderate':
        hydration_target_l += 0.4
    elif intensity == 'high':
        hydration_target_l += 0.8
    if cardio_minutes >= 30:
        hydration_target_l += 0.3
    if steps >= 10000:
        hydration_target_l += 0.3

    hydration_completion = (water_liters / max(hydration_target_l, 0.1)) * 100
    if hydration_completion < 50:
        dehydration_risk = 'high'
        hydration_status = 'Dehydration Risk'
    elif hydration_completion < 75:
        dehydration_risk = 'moderate'
        hydration_status = 'Low'
    elif hydration_completion < 95:
        dehydration_risk = 'low'
        hydration_status = 'Moderate'
    else:
        dehydration_risk = 'low'
        hydration_status = 'Optimal'

    recovery_insights = [
        f'Post-workout protein target: {post_workout_protein:.0f} g within 60 minutes.',
        f'Hydration target adjusted to {hydration_target_l:.2f} L based on activity load.',
    ]
    if intensity == 'high':
        recovery_insights.append('High intensity detected: prioritize 7.5-9 hours of sleep and active mobility.')
    if hydration_completion < 70:
        recovery_insights.append('Hydration below 70%: increase water intake immediately to reduce fatigue risk.')

    hydration_score = max(0.0, min(hydration_completion, 100.0))
    overall_score = (nutrition_score * 0.45) + (workout_score * 0.35) + (hydration_score * 0.20)
    estimate_goal_key = normalized_goal if normalized_goal in {'fat_loss', 'muscle_gain'} else 'fat_loss'
    estimated_days, target_weight_assumption = estimate_days_to_goal(
        estimate_goal_key,
        body_weight_kg,
        maintenance_kcal,
        day_totals['calories'],
    )

    return {
        'nutrition_report': {
            'meals': meal_reports,
            'total_calories_kcal': round(day_totals['calories'], 2),
            'total_protein_g': round(day_totals['protein'], 2),
            'total_carbs_g': round(day_totals['carbs'], 2),
            'total_fats_g': round(day_totals['fats'], 2),
            'macro_distribution_percent': macro_dist,
            'calorie_balance_kcal': round(calorie_balance, 2),
            'calorie_balance_label': calorie_label,
            'protein_target_range_g': {'min': protein_low, 'max': protein_high},
            'protein_adequacy_status': protein_status,
            'nutrient_gaps_or_excess': nutrient_gap_or_excess,
            'goal_calorie_comparison': goal_comparison,
            'nutrition_quality_score': nutrition_score,
            'nutrition_performance_score': nutrition_score,
        },
        'workout_report': {
            'exercises': [
                {
                    'exercise': item['name'],
                    'sets': item['sets'],
                    'reps': item['reps'],
                    'muscle_groups': item['muscles'],
                }
                for item in strength
            ],
            'cardio': [
                {
                    'activity': item['activity'],
                    'duration_minutes': round(item['duration_minutes'], 2),
                    'calories_burned_kcal': round(item['calories'], 2),
                }
                for item in cardio
            ],
            'training_volume': training_volume,
            'intensity': intensity,
            'muscle_groups_trained': muscles,
            'estimated_calories_burned_kcal': round(strength_kcal + cardio_kcal, 2),
            'calories_from_steps_kcal': round(step_kcal, 2),
            'total_activity_burn_kcal': round(total_burn, 2),
            'effort_analysis': _effort_analysis(training_volume, intensity, cardio_minutes, steps),
            'workout_score': round(workout_score, 2),
            'recovery_insights': recovery_insights,
            'recommended_post_workout_protein_g': round(post_workout_protein, 2),
        },
        'hydration_report': {
            'consumed_liters': round(water_liters, 2),
            'target_liters': round(hydration_target_l, 2),
            'completion_percent': round(hydration_completion, 2),
            'dehydration_risk': dehydration_risk,
            'status': hydration_status,
        },
        'dashboard': {
            'total_calories_consumed_kcal': round(day_totals['calories'], 2),
            'total_calories_burned_kcal': round(total_burn, 2),
            'net_calories_kcal': round(day_totals['calories'] - total_burn, 2),
            'macro_balance': macro_dist,
            'hydration_level_percent': round(hydration_completion, 2),
            'hydration_status': hydration_status,
            'activity_level': intensity,
            'recovery_status': _recovery_status(hydration_completion, nutrition_score, intensity),
            'estimated_days_to_goal': estimated_days,
            'target_weight_assumption_kg': target_weight_assumption,
            'overall_max_rep_performance_score': round(max(0.0, min(overall_score, 100.0)), 2),
        },
    }
