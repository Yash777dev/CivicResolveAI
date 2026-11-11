from datetime import datetime, timezone
from app.extensions import db

class ComplaintStatusHistory(db.Model):
    __tablename__ = "complaint_status_history"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = db.Column(db.String(50), nullable=True)
    new_status = db.Column(db.String(50), nullable=False)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    public_note = db.Column(db.Text, nullable=True)
    internal_note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    actor = db.relationship("User", foreign_keys=[actor_id])

    def to_dict(self, is_officer=False):
        data = {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "previous_status": self.previous_status,
            "new_status": self.new_status,
            "actor_id": self.actor_id,
            "actor_name": self.actor.name if self.actor else "System",
            "public_note": self.public_note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if is_officer:
            data["internal_note"] = self.internal_note
        return data


class ComplaintAssignmentHistory(db.Model):
    __tablename__ = "complaint_assignment_history"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_department_id = db.Column(db.Integer, db.ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    new_department_id = db.Column(db.Integer, db.ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    previous_officer_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    new_officer_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    prev_dept = db.relationship("Department", foreign_keys=[previous_department_id])
    new_dept = db.relationship("Department", foreign_keys=[new_department_id])
    prev_officer = db.relationship("User", foreign_keys=[previous_officer_id])
    new_officer = db.relationship("User", foreign_keys=[new_officer_id])
    actor = db.relationship("User", foreign_keys=[actor_id])

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "previous_department_id": self.previous_department_id,
            "previous_department_name": self.prev_dept.name if self.prev_dept else None,
            "new_department_id": self.new_department_id,
            "new_department_name": self.new_dept.name if self.new_dept else None,
            "previous_officer_id": self.previous_officer_id,
            "previous_officer_name": self.prev_officer.name if self.prev_officer else None,
            "new_officer_id": self.new_officer_id,
            "new_officer_name": self.new_officer.name if self.new_officer else None,
            "actor_id": self.actor_id,
            "actor_name": self.actor.name if self.actor else "System",
            "reason": self.reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ComplaintNote(db.Model):
    __tablename__ = "complaint_notes"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    note_type = db.Column(db.String(20), default="internal", nullable=False) # internal, public
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    author = db.relationship("User", foreign_keys=[author_id])

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "author_id": self.author_id,
            "author_name": self.author.name if self.author else "Unknown",
            "author_role": self.author.role if self.author else None,
            "note_type": self.note_type,
            "body": self.body,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
