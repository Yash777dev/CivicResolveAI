from datetime import datetime, timezone
from app.extensions import db

class ComplaintFeedback(db.Model):
    __tablename__ = "complaint_feedback"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    citizen_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False) # 1 to 5 stars
    comments = db.Column(db.Text, nullable=True)
    reopen_requested = db.Column(db.Boolean, default=False, nullable=False)
    reopen_reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    citizen = db.relationship("User", foreign_keys=[citizen_id])

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "citizen_id": self.citizen_id,
            "citizen_name": self.citizen.name if self.citizen else None,
            "rating": self.rating,
            "comments": self.comments,
            "reopen_requested": self.reopen_requested,
            "reopen_reason": self.reopen_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
