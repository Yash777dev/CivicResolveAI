import json
from datetime import datetime, timezone
from app.extensions import db

class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = db.Column(db.String(100), nullable=False, index=True) # login, submit, assign, status_change, override, rule_update, admin_action
    resource_type = db.Column(db.String(50), nullable=False, index=True) # complaint, user, department, rule, system
    resource_id = db.Column(db.String(100), nullable=True)
    metadata_json = db.Column(db.Text, default="{}", nullable=False)
    ip_address = db.Column(db.String(50), nullable=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    actor = db.relationship("User", foreign_keys=[actor_id])

    @property
    def meta(self):
        try:
            return json.loads(self.metadata_json or "{}")
        except Exception:
            return {}

    @meta.setter
    def meta(self, val):
        self.metadata_json = json.dumps(val if isinstance(val, dict) else {})

    def to_dict(self):
        return {
            "id": self.id,
            "actor_id": self.actor_id,
            "actor_name": self.actor.name if self.actor else "System / Anonymous",
            "actor_email": self.actor.email if self.actor else None,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "metadata": self.meta,
            "ip_address": self.ip_address,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
