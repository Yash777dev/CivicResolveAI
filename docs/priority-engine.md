# CivicResolve AI — Explainable Priority Scoring Engine

## 1. Engine Philosophy: Determinism Over Opaque Black Boxes

In civic and administrative governance, an opaque deep learning score (e.g. "Urgency: 87%") cannot be justified to a citizen whose complaint was de-prioritized or to an auditor investigating administrative negligence.

**CivicResolve AI enforces an explainable, deterministic baseline scoring engine (`backend/app/services/priority_engine.py`).**
Every single point in the priority score must be traceable to a specific verifiable signal, rule definition, or structured input.

---

## 2. Mathematical Scoring Model

Let a complaint $C$ have a set of verified text signals $T_C$, user-reported structured flags $F_C$, category baseline $B_C$, duration $D_C$, and spatial cluster count $S_C$.

The raw priority score $P_{\text{raw}}$ is calculated as:
$$P_{\text{raw}} = B_C + \sum_{r \in R_{\text{fired}}} W_r$$

Where:
- $B_C \in [0, 10]$ is the category baseline priority.
- $R_{\text{fired}}$ is the subset of active rules whose trigger conditions are satisfied.
- $W_r$ is the weight configured for rule $r$.

The final clamped priority score $P(C)$ is:
$$P(C) = \min(100, \max(0, P_{\text{raw}}))$$

### 2.1 Priority Tier Classification
| Clamped Score $P(C)$ | Priority Tier | Standard SLA Target | Action Required |
| :--- | :--- | :--- | :--- |
| **0 – 39** | `LOW` | 72 – 96 Hours | Routine municipal maintenance queue |
| **40 – 69** | `MEDIUM` | 24 – 48 Hours | Prioritized field officer investigation |
| **70 – 100** | `HIGH` | 4 – 12 Hours | Immediate administrative dispatch & safety alert |

---

## 3. Standard Rule Weights & Signals

The baseline configuration implements the following illustrative, administrator-tunable weights:

| Rule Key | Rule Name | Weight | Trigger Conditions |
| :--- | :--- | :--- | :--- |
| `IMMEDIATE_DANGER` | Immediate Safety Hazard | **+30** | Keywords: "fire", "spark", "explosion", "collapse", "electrocution", "fatal", "தீ", "விபத்து" or structured flag. |
| `ESSENTIAL_SERVICE` | Essential Service Outage | **+20** | Outage of potable water, hospital electricity, sewage overflow in residential quarters. |
| `CRITICAL_FACILITY` | Critical Facility Proximity | **+15** | Nearby hospital, maternity clinic, government school, transit hub, or elder-care center. |
| `REPEAT_NEIGHBORHOOD`| Cluster/Repeat Hotspot | **+10** | Multiple complaints registered within 500 meters during the past 7 days. |
| `LONG_DURATION` | Prolonged Unresolved Outage | **+10** | Outage duration reported $\ge 3$ days. |
| `VULNERABLE_IMPACT` | Vulnerable Population Impact | **+5** | Explicitly impacts senior citizens, pediatric wards, or persons with disabilities (voluntarily disclosed). |
| `CATEGORY_BASELINE` | Category Inherent Urgency | **+5 to +10**| Pre-assigned base weight from municipal category taxonomy. |

---

## 4. Safety Guardrails & Ethical Non-Negotiables

CivicResolve AI adheres to strict ethical and public safety constraints:

1. **Signals are Signals, Not Empirical Proof:**
   A high score flags an issue for rapid human review. The algorithm never authorizes physical municipal actions or closes cases autonomously.
2. **No Tone or Literacy Penalty:**
   Complaints are never penalized for grammatical errors, colloquial expressions, emotional agitation, or absence of photographs.
3. **No Demographics or Sensitive Inferences:**
   The engine does not infer income, religion, caste, gender, or health status from text.
4. **Duplicate Safeguard:**
   Points are never awarded multiple times for repetitive occurrences of the same keyword or overlapping synonyms within a single complaint.
5. **Human Override Authority:**
   Authorized field officers may adjust the score (e.g. from 35 to 80) if on-ground inspection uncovers unmentioned risks. Every override requires:
   - Written justification (minimum 10 characters).
   - Preserved immutable history of old score, new score, actor ID, and timestamp in `priority_overrides`.

---

## 5. Sample Explanation Output

When a complaint is submitted, the engine generates an inspection payload:
```json
{
  "score": 85,
  "level": "HIGH",
  "engine_version": "v1.0",
  "summary": "Priority: HIGH (Score: 85/100). Fired rules: Category Baseline (+10), Essential Service Outage (+20), Immediate Safety Hazard (+30), Critical Facility Proximity (+15), Long Duration (+10).",
  "fired_rules": [
    {
      "rule_key": "CAT_DRAINAGE_FLOODING",
      "name": "Drainage Baseline",
      "weight": 10,
      "trigger": "Category: Drainage and Flooding"
    },
    {
      "rule_key": "IMMEDIATE_DANGER",
      "name": "Immediate Safety Hazard",
      "weight": 30,
      "trigger": "sparking electrical wire touching water"
    },
    {
      "rule_key": "ESSENTIAL_SERVICE",
      "name": "Essential Service Outage",
      "weight": 20,
      "trigger": "drinking water contamination"
    },
    {
      "rule_key": "CRITICAL_FACILITY",
      "name": "Critical Facility Proximity",
      "weight": 15,
      "trigger": "Government Maternity Hospital"
    },
    {
      "rule_key": "LONG_DURATION",
      "name": "Prolonged Unresolved Outage",
      "weight": 10,
      "trigger": "Reported duration: 4 days"
    }
  ],
  "uncertainty_warnings": []
}
```
This payload is rendered directly in the **Officer Workstation** UI in an interactive breakdown accordion.
