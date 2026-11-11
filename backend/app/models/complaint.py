from datetime import datetime, timezone
from app.extensions import db

class Complaint(db.Model):
    __tablename__ = "complaints"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    reference_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    citizen_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_officer_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Status: SUBMITTED, TRIAGED, ASSIGNED, IN_PROGRESS, NEEDS_INFORMATION, RESOLVED, CLOSED, REOPENED, ESCALATED
    status = db.Column(db.String(50), default="SUBMITTED", nullable=False, index=True)
    
    # Priority
    current_priority = db.Column(db.String(20), default="MEDIUM", nullable=False, index=True) # LOW, MEDIUM, HIGH
    priority_score = db.Column(db.Integer, default=50, nullable=False) # 0 to 100
    priority_engine_version = db.Column(db.String(20), default="1.0.0", nullable=False)

    # Structured urgency inputs
    reported_duration_days = db.Column(db.Integer, default=0, nullable=False)
    is_essential_facility = db.Column(db.Boolean, default=False, nullable=False)
    facility_type = db.Column(db.String(50), nullable=True) # hospital, school, clinic, water_plant, none
    immediate_danger = db.Column(db.Boolean, default=False, nullable=False)

    # Location (approximate for privacy)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    approx_location = db.Column(db.String(255), nullable=True)
    contact_phone = db.Column(db.String(20), nullable=True)

    # Lifecycle & SLA Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    due_at = db.Column(db.DateTime, nullable=True, index=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    closed_at = db.Column(db.DateTime, nullable=True)

    resolution_summary = db.Column(db.Text, nullable=True)
    closure_reason = db.Column(db.String(255), nullable=True)

    # Relationships
    evidence_items = db.relationship("ComplaintEvidence", backref="complaint", cascade="all, delete-orphan", lazy="dynamic")
    priority_assessments = db.relationship("PriorityAssessment", backref="complaint", cascade="all, delete-orphan", lazy="dynamic", order_by="desc(PriorityAssessment.assessed_at)")
    status_history = db.relationship("ComplaintStatusHistory", backref="complaint", cascade="all, delete-orphan", lazy="dynamic", order_by="asc(ComplaintStatusHistory.created_at)")
    assignment_history = db.relationship("ComplaintAssignmentHistory", backref="complaint", cascade="all, delete-orphan", lazy="dynamic", order_by="asc(ComplaintAssignmentHistory.created_at)")
    notes = db.relationship("ComplaintNote", backref="complaint", cascade="all, delete-orphan", lazy="dynamic", order_by="asc(ComplaintNote.created_at)")
    priority_overrides = db.relationship("PriorityOverride", backref="complaint", cascade="all, delete-orphan", lazy="dynamic", order_by="desc(PriorityOverride.created_at)")
    feedback = db.relationship("ComplaintFeedback", backref="complaint", uselist=False, cascade="all, delete-orphan")

    def to_dict(self, include_private=False, is_officer=False):
        data = {
            "id": self.id,
            "reference_number": self.reference_number,
            "citizen_id": self.citizen_id,
            "citizen_name": self.citizen.name if self.citizen else None,
            "title": self.title,
            "description": self.description,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "category_code": self.category.code if self.category else None,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else None,
            "assigned_officer_id": self.assigned_officer_id,
            "assigned_officer_name": self.assigned_officer.name if self.assigned_officer else None,
            "status": self.status,
            "current_priority": self.current_priority,
            "priority_score": self.priority_score,
            "priority_engine_version": self.priority_engine_version,
            "reported_duration_days": self.reported_duration_days,
            "is_essential_facility": self.is_essential_facility,
            "facility_type": self.facility_type,
            "immediate_danger": self.immediate_danger,
            "approx_location": self.approx_location,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "due_at": self.due_at.isoformat() if self.due_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
            "resolution_summary": self.resolution_summary,
            "closure_reason": self.closure_reason,
            "evidence_count": self.evidence_items.count() if hasattr(self, "evidence_items") else 0,
        }
        if include_private or is_officer:
            data["contact_phone"] = self.contact_phone
        return data
