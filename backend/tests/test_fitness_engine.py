from app.services.fitness_engine import calculate_bmr, macro_split, water_ml_target


def test_bmr_is_positive():
    assert calculate_bmr(80, 180, 29, 'male') > 1000


def test_macro_split_sum_reasonable():
    p, c, f, fiber = macro_split(2500, 80, 'muscle_building')
    assert p > 0 and c >= 0 and f > 0 and fiber > 0


def test_water_target():
    assert water_ml_target(70) == 2450
