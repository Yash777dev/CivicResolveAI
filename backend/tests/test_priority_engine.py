from app.services.priority_engine import PriorityEngine

def test_priority_engine_baseline():
    engine = PriorityEngine()
    result = engine.assess(
        title="Minor street maintenance question",
        description="Just checking when the footpath will be cleaned next month.",
        reported_duration_days=0
    )
    assert result["score"] == 0
    assert result["level"] == "LOW"
    assert "Missing" in "; ".join(result["missing_information"]) or len(result["missing_information"]) > 0

def test_priority_engine_emergency_and_facility():
    engine = PriorityEngine()
    result = engine.assess(
        title="Live wire sparked and snapped near clinic",
        description="Dangerous electrical wire sparking in front of trauma clinic entrance.",
        immediate_danger=True,
        is_essential_facility=True,
        facility_type="clinic",
        reported_duration_days=4
    )
    # 30 (danger) + 20 (essential) + 15 (clinic) + 10 (duration) = 75
    assert result["score"] >= 75
    assert result["level"] == "HIGH"
    rule_keys = [r["rule_key"] for r in result["fired_rules"]]
    assert "EMERGENCY_DANGER" in rule_keys
    assert "ESSENTIAL_FACILITY" in rule_keys
    assert "CRITICAL_FACILITY_TYPE" in rule_keys
    assert "DURATION_PROLONGED" in rule_keys

def test_priority_engine_score_clamping():
    # Artificially high weights must clamp to 100
    engine = PriorityEngine(rule_weights={"EMERGENCY_DANGER": 90, "ESSENTIAL_FACILITY": 80})
    result = engine.assess(
        title="Emergency test",
        description="Hazardous situation",
        immediate_danger=True,
        is_essential_facility=True
    )
    assert result["score"] == 100
    assert result["level"] == "HIGH"

def test_priority_engine_duplicate_keywords_no_double_counting():
    engine = PriorityEngine()
    # Repeating spark and live wire multiple times must trigger the emergency rule exactly ONCE
    result = engine.assess(
        title="Live wire spark spark spark live wire live wire",
        description="Live wire sparks sparking electrocution sparks explosion",
        immediate_danger=False
    )
    danger_rules = [r for r in result["fired_rules"] if r["rule_key"] == "EMERGENCY_DANGER"]
    assert len(danger_rules) == 1
