import json
from datetime import datetime, timezone
from app.extensions import db

class PriorityAssessment(db.Model):
    __tablename__ = "priority_assessments"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    score = db.Column(db.Integer, nullable=False) # 0 to 100
    level = db.Column(db.String(20), nullable=False) # LOW, MEDIUM, HIGH
    fired_rules_json = db.Column(db.Text, default="[]", nullable=False)
    summary = db.Column(db.Text, nullable=False)
    missing_information = db.Column(db.Text, nullable=True)
    engine_version = db.Column(db.String(20), default="1.0.0", nullable=False)
    assessed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def fired_rules(self):
        try:
            return json.loads(self.fired_rules_json or "[]")
        except Exception:
            return []

    @fired_rules.setter
    def fired_rules(self, val):
        self.fired_rules_json = json.dumps(val if isinstance(val, list) else [])

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "score": self.score,
            "level": self.level,
            "fired_rules": self.fired_rules,
            "summary": self.summary,
            "missing_information": self.missing_information,
            "engine_version": self.engine_version,
            "assessed_at": self.assessed_at.isoformat() if self.assessed_at else None,
        }


class PriorityOverride(db.Model):
    __tablename__ = "priority_overrides"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_score = db.Column(db.Integer, nullable=False)
    previous_level = db.Column(db.String(20), nullable=False)
    new_score = db.Column(db.Integer, nullable=False)
    new_level = db.Column(db.String(20), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    actor = db.relationship("User", foreign_keys=[actor_id])

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "previous_score": self.previous_score,
            "previous_level": self.previous_level,
            "new_score": self.new_score,
            "new_level": self.new_level,
            "reason": self.reason,
            "actor_id": self.actor_id,
            "actor_name": self.actor.name if self.actor else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
