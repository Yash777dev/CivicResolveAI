import json
from datetime import datetime, timezone
from app.extensions import db

class PriorityRule(db.Model):
    __tablename__ = "priority_rules"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    rule_key = db.Column(db.String(80), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    weight = db.Column(db.Integer, nullable=False) # e.g. +30, +20, +15, +10
    condition_type = db.Column(db.String(50), nullable=False) # emergency_danger, essential_facility, duration_threshold, keyword_signal, baseline
    config_json = db.Column(db.Text, default="{}", nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    version = db.Column(db.String(20), default="1.0.0", nullable=False)
    updated_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    updater = db.relationship("User", foreign_keys=[updated_by])

    @property
    def config(self):
        try:
            return json.loads(self.config_json or "{}")
        except Exception:
            return {}

    @config.setter
    def config(self, val):
        self.config_json = json.dumps(val if isinstance(val, dict) else {})

    def to_dict(self):
        return {
            "id": self.id,
            "rule_key": self.rule_key,
            "name": self.name,
            "description": self.description,
            "weight": self.weight,
            "condition_type": self.condition_type,
            "config": self.config,
            "is_active": self.is_active,
            "version": self.version,
            "updated_by": self.updated_by,
            "updater_name": self.updater.name if self.updater else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ComplaintSimilarity(db.Model):
    __tablename__ = "complaint_similarities"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_a_id = db.Column(db.Integer, db.ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    complaint_b_id = db.Column(db.Integer, db.ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    similarity_score = db.Column(db.Float, nullable=False) # 0.0 to 1.0
    reason = db.Column(db.Text, nullable=False)
    # suggested, confirmed_duplicate, rejected
    status = db.Column(db.String(30), default="suggested", nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    complaint_a = db.relationship("Complaint", foreign_keys=[complaint_a_id])
    complaint_b = db.relationship("Complaint", foreign_keys=[complaint_b_id])

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_a_id": self.complaint_a_id,
            "complaint_a_ref": self.complaint_a.reference_number if self.complaint_a else None,
            "complaint_a_title": self.complaint_a.title if self.complaint_a else None,
            "complaint_b_id": self.complaint_b_id,
            "complaint_b_ref": self.complaint_b.reference_number if self.complaint_b else None,
            "complaint_b_title": self.complaint_b.title if self.complaint_b else None,
            "similarity_score": round(self.similarity_score, 3),
            "reason": self.reason,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ModelEvaluation(db.Model):
    __tablename__ = "model_evaluations"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    model_name = db.Column(db.String(100), nullable=False)
    version = db.Column(db.String(50), nullable=False)
    accuracy = db.Column(db.Float, nullable=False)
    precision = db.Column(db.Float, nullable=False)
    recall = db.Column(db.Float, nullable=False)
    f1_score = db.Column(db.Float, nullable=False)
    test_dataset_size = db.Column(db.Integer, nullable=False)
    confusion_matrix_json = db.Column(db.Text, default="[]", nullable=False)
    trained_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        try:
            cm = json.loads(self.confusion_matrix_json or "[]")
        except Exception:
            cm = []
        return {
            "id": self.id,
            "model_name": self.model_name,
            "version": self.version,
            "accuracy": round(self.accuracy, 4),
            "precision": round(self.precision, 4),
            "recall": round(self.recall, 4),
            "f1_score": round(self.f1_score, 4),
            "test_dataset_size": self.test_dataset_size,
            "confusion_matrix": cm,
            "trained_at": self.trained_at.isoformat() if self.trained_at else None,
        }
