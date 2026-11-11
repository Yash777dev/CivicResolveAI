from datetime import datetime, timezone
from app.extensions import db

class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id", ondelete="CASCADE"), nullable=True, index=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default="status_update", nullable=False) # status_update, assignment, sla_breach, priority_override, system
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    read_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    complaint = db.relationship("Complaint", foreign_keys=[complaint_id])

    def to_dict(self):
        return {
            "id": self.id,
            "recipient_id": self.recipient_id,
            "complaint_id": self.complaint_id,
            "complaint_ref": self.complaint.reference_number if self.complaint else None,
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "is_read": self.is_read,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
