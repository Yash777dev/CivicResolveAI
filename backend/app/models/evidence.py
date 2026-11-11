from datetime import datetime, timezone
from app.extensions import db

class ComplaintEvidence(db.Model):
    __tablename__ = "complaint_evidence"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    storage_key = db.Column(db.String(255), nullable=False) # Safe random UUID storage filename on disk
    original_filename = db.Column(db.String(255), nullable=False)
    sanitized_filename = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    byte_size = db.Column(db.Integer, nullable=False)
    checksum = db.Column(db.String(64), nullable=False) # SHA-256 checksum
    uploaded_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    uploader = db.relationship("User", foreign_keys=[uploaded_by])

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "storage_key": self.storage_key,
            "original_filename": self.original_filename,
            "mime_type": self.mime_type,
            "byte_size": self.byte_size,
            "checksum": self.checksum,
            "uploaded_by": self.uploaded_by,
            "uploader_name": self.uploader.name if self.uploader else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
