import json
from datetime import datetime, timezone
from app.extensions import db

class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    description = db.Column(db.Text, nullable=True)
    default_sla_hours = db.Column(db.Integer, default=48, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    keywords_json = db.Column(db.Text, default="[]", nullable=False) # JSON array of keywords in en and ta
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    complaints = db.relationship("Complaint", backref="category", foreign_keys="Complaint.category_id", lazy="dynamic")

    @property
    def keywords(self):
        try:
            return json.loads(self.keywords_json or "[]")
        except Exception:
            return []

    @keywords.setter
    def keywords(self, val):
        self.keywords_json = json.dumps(val if isinstance(val, list) else [])

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else None,
            "description": self.description,
            "default_sla_hours": self.default_sla_hours,
            "is_active": self.is_active,
            "keywords": self.keywords,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
