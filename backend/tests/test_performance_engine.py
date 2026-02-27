from app.services.performance_engine import analyze_daily_performance


def test_performance_engine_parses_full_day_entry():
    entry = (
        'Breakfast: 2 eggs, 2 slices toast, 1 banana. '
        'Lunch: 200g chicken breast and 1 cup rice. '
        'Dinner: 150g fish with 1 bowl salad. '
        'Workout: bench press 4x8, squat 5x5, running 20 min, 9000 steps. '
        'Drank 2.5 liters water.'
    )
    report = analyze_daily_performance(entry_text=entry, maintenance_kcal=2200, goal='muscle_gain', body_weight_kg=80)

    assert report['nutrition_report']['total_calories_kcal'] > 0
    assert len(report['nutrition_report']['meals']) >= 3
    assert report['workout_report']['training_volume'] > 0
    assert report['workout_report']['total_activity_burn_kcal'] > 0
    assert report['dashboard']['overall_max_rep_performance_score'] <= 100


def test_performance_engine_handles_minimal_text():
    entry = 'Had breakfast and lunch only. Walked 5000 steps.'
    report = analyze_daily_performance(entry_text=entry, body_weight_kg=70)

    assert report['nutrition_report']['total_calories_kcal'] > 0
    assert report['dashboard']['total_calories_burned_kcal'] > 0
    assert 0 <= report['nutrition_report']['nutrition_performance_score'] <= 100
    assert 0 <= report['dashboard']['overall_max_rep_performance_score'] <= 100


def test_performance_engine_flags_low_hydration_risk():
    entry = 'Workout: squat 6x6, deadlift 4x5, running 45 min, 12000 steps. Drank 1 liter water.'
    report = analyze_daily_performance(entry_text=entry, body_weight_kg=82)

    assert report['workout_report']['intensity'] in {'moderate', 'high'}
    assert report['hydration_report']['completion_percent'] < 70
    assert report['hydration_report']['dehydration_risk'] in {'moderate', 'high'}
