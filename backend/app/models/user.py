from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="citizen", index=True) # citizen, officer, admin, supervisor
    account_status = db.Column(db.String(30), nullable=False, default="active") # active, suspended, inactive
    preferred_language = db.Column(db.String(10), nullable=False, default="en") # en, ta
    phone_number = db.Column(db.String(20), nullable=True)
    
    # Department affiliation for officers
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    department = db.relationship("Department", backref="officers", foreign_keys=[department_id])
    complaints = db.relationship("Complaint", backref="citizen", foreign_keys="Complaint.citizen_id", lazy="dynamic")
    assigned_complaints = db.relationship("Complaint", backref="assigned_officer", foreign_keys="Complaint.assigned_officer_id", lazy="dynamic")
    notifications = db.relationship("Notification", backref="recipient", cascade="all, delete-orphan", lazy="dynamic")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_private=False):
        data = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "account_status": self.account_status,
            "preferred_language": self.preferred_language,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_private:
            data["phone_number"] = self.phone_number
        return data
