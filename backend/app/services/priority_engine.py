import re
from datetime import datetime, timezone
from typing import Dict, Any, List

ENGINE_VERSION = "1.0.0"

# Default baseline weights
DEFAULT_WEIGHTS = {
    "EMERGENCY_DANGER": 30,
    "ESSENTIAL_FACILITY": 20,
    "CRITICAL_FACILITY_TYPE": 15,
    "DURATION_PROLONGED": 10,
    "REPEAT_AREA_SIGNAL": 10,
    "VULNERABLE_POPULATION": 5,
    "CATEGORY_BASELINE": 10,
}

# Signal keywords for safety emergency detection (used as signals, not sole proof)
EMERGENCY_KEYWORDS_EN = [
    r"\bspark(s|ing)?\b",
    r"\blive\s+wire\b",
    r"\belectrocution\b",
    r"\bcave-?in\b",
    r"\bcollapse\b",
    r"\bopen\s+manhole\b",
    r"\bgas\s+leak\b",
    r"\bexplosion\b",
    r"\bfire\s+hazard\b",
    r"\bflooding\s+inside\b",
]

EMERGENCY_KEYWORDS_TA = [
    "மின்கம்பி",
    "தீ விபத்து",
    "மின் அதிர்ச்சி",
    "ஆபத்து",
    "திறந்த சாக்கடை",
    "இடிந்து",
    "வெள்ள அபாயம்",
]

VULNERABLE_KEYWORDS = [
    r"\belderly\b",
    r"\bsenior\s+citizen\b",
    r"\bchildren\b",
    r"\binfant\b",
    r"\bdisabled\b",
    r"\bpatient\b",
    "முதியவர்",
    "குழந்தைகள்",
    "மாற்றுத்திறனாளி",
    "நோயாளி",
]

class PriorityEngine:
    """
    Deterministic, explainable, and versioned priority engine.
    Computes an auditable score and human-readable explanation without opaque black boxes.
    """

    def __init__(self, rule_weights: Dict[str, int] = None, version: str = ENGINE_VERSION):
        self.weights = {**DEFAULT_WEIGHTS, **(rule_weights or {})}
        self.version = version

    def assess(
        self,
        title: str,
        description: str,
        category_code: str = None,
        immediate_danger: bool = False,
        is_essential_facility: bool = False,
        facility_type: str = None,
        reported_duration_days: int = 0,
        nearby_recent_count: int = 0,
        vulnerable_mentioned: bool = False,
    ) -> Dict[str, Any]:
        """
        Evaluate complaint attributes deterministically.
        Returns a dictionary with score, level, fired_rules, explanation, and missing_info.
        """
        combined_text = f"{title or ''} {description or ''}".lower()
        fired_rules: List[Dict[str, Any]] = []
        missing_info: List[str] = []
        total_score = 0

        # 1. Immediate Danger / Emergency Rule
        danger_triggered = False
        danger_evidence = []
        if immediate_danger:
            danger_triggered = True
            danger_evidence.append("User flagged immediate safety danger")

        # Scan for emergency signal keywords (signals prompt review, no double-counting)
        detected_kw = []
        for pat in EMERGENCY_KEYWORDS_EN:
            if re.search(pat, combined_text):
                detected_kw.append(pat.replace(r"\b", "").replace(r"\s+", " "))
        for kw in EMERGENCY_KEYWORDS_TA:
            if kw in combined_text:
                detected_kw.append(kw)

        if detected_kw and not danger_triggered:
            danger_triggered = True
            danger_evidence.append(f"Emergency signal words detected: {', '.join(detected_kw[:2])}")

        if danger_triggered:
            pts = self.weights.get("EMERGENCY_DANGER", 30)
            total_score += pts
            fired_rules.append({
                "rule_key": "EMERGENCY_DANGER",
                "name": "Immediate Public Safety Danger",
                "points": pts,
                "evidence": "; ".join(danger_evidence),
                "explanation": f"High risk to life or safety flagged (+{pts} pts)"
            })

        # 2. Essential Facility Outage (e.g., Hospital, School, Water Treatment)
        if is_essential_facility:
            pts = self.weights.get("ESSENTIAL_FACILITY", 20)
            total_score += pts
            fired_rules.append({
                "rule_key": "ESSENTIAL_FACILITY",
                "name": "Essential Public Facility Impact",
                "points": pts,
                "evidence": f"Essential service interruption confirmed",
                "explanation": f"Interruption directly affects essential civic facility (+{pts} pts)"
            })

            # Additional points if specific critical facility type is designated
            if facility_type and facility_type.lower() in ("hospital", "school", "clinic", "water_plant"):
                c_pts = self.weights.get("CRITICAL_FACILITY_TYPE", 15)
                total_score += c_pts
                fired_rules.append({
                    "rule_key": "CRITICAL_FACILITY_TYPE",
                    "name": f"Critical Facility ({facility_type.capitalize()})",
                    "points": c_pts,
                    "evidence": f"Facility designated as {facility_type}",
                    "explanation": f"High-sensitivity public institution impacted (+{c_pts} pts)"
                })
        else:
            if not facility_type:
                missing_info.append("Proximity to hospitals, schools or critical facilities is unverified")

        # 3. Reported Outage / Hazard Duration
        if reported_duration_days >= 3:
            pts = self.weights.get("DURATION_PROLONGED", 10)
            total_score += pts
            fired_rules.append({
                "rule_key": "DURATION_PROLONGED",
                "name": "Prolonged Hazard / Service Outage",
                "points": pts,
                "evidence": f"Reported unresolved duration: {reported_duration_days} days",
                "explanation": f"Grievance has persisted for {reported_duration_days} days (+{pts} pts)"
            })
        elif reported_duration_days == 0:
            missing_info.append("Specific duration of grievance not provided by citizen")

        # 4. Repeat Nearby Complaints (Cluster density)
        if nearby_recent_count >= 2:
            pts = self.weights.get("REPEAT_AREA_SIGNAL", 10)
            total_score += pts
            fired_rules.append({
                "rule_key": "REPEAT_AREA_SIGNAL",
                "name": "Geographic Complaint Density",
                "points": pts,
                "evidence": f"{nearby_recent_count} related complaints reported nearby in last 48 hours",
                "explanation": f"Multiple citizen reports indicate widespread neighborhood impact (+{pts} pts)"
            })

        # 5. Vulnerable Population Impact (Elderly, Children, Patients)
        has_vulnerable = vulnerable_mentioned
        if not has_vulnerable:
            for vk in VULNERABLE_KEYWORDS:
                if (vk.startswith(r"\b") and re.search(vk, combined_text)) or (vk in combined_text):
                    has_vulnerable = True
                    break

        if has_vulnerable:
            pts = self.weights.get("VULNERABLE_POPULATION", 5)
            total_score += pts
            fired_rules.append({
                "rule_key": "VULNERABLE_POPULATION",
                "name": "Vulnerable Persons Impact",
                "points": pts,
                "evidence": "Mention of senior citizens, children, or medical patients",
                "explanation": f"Impacts vulnerable community members (+{pts} pts)"
            })

        # 6. Category Baseline Weight
        # High-impact categories receive baseline priority weight
        high_baseline_categories = {"ELEC_STREETLIGHTS", "WATER_SUPPLY", "DRAINAGE_FLOODING", "PUBLIC_HEALTH"}
        if category_code in high_baseline_categories:
            pts = self.weights.get("CATEGORY_BASELINE", 10)
            total_score += pts
            fired_rules.append({
                "rule_key": "CATEGORY_BASELINE",
                "name": "Essential Civic Category Baseline",
                "points": pts,
                "evidence": f"Category is {category_code}",
                "explanation": f"Critical civic utility baseline contribution (+{pts} pts)"
            })

        # Clamp total score strictly between 0 and 100
        clamped_score = max(0, min(100, total_score))

        # Determine Priority Level:
        # 0–39: LOW
        # 40–69: MEDIUM
        # 70–100: HIGH
        if clamped_score >= 70:
            level = "HIGH"
        elif clamped_score >= 40:
            level = "MEDIUM"
        else:
            level = "LOW"

        # Construct Human-Readable Summary
        if fired_rules:
            rule_summaries = [f"{r['name']} (+{r['points']})" for r in fired_rules]
            summary_text = (
                f"Assessed as {level} priority (Score: {clamped_score}/100) based on {len(fired_rules)} deterministic rules: "
                + ", ".join(rule_summaries) + "."
            )
        else:
            summary_text = f"Assessed as {level} priority (Score: {clamped_score}/100). Standard queue baseline applied."

        return {
            "score": clamped_score,
            "level": level,
            "engine_version": self.version,
            "fired_rules": fired_rules,
            "summary": summary_text,
            "missing_information": missing_info,
            "assessed_at": datetime.now(timezone.utc).isoformat(),
        }
