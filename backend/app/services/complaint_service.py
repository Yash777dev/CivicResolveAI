from datetime import datetime, timezone
from app.extensions import db
from app.models.complaint import Complaint
from app.models.category import Category
from app.models.department import Department
from app.models.priority import PriorityAssessment
from app.models.history import ComplaintStatusHistory
from app.services.priority_engine import PriorityEngine
from app.services.duplicate_detection import DuplicateDetectionService
from app.utils.reference_ids import generate_reference_number
from app.utils.time import calculate_due_date, utcnow
from app.errors import NotFoundError, ValidationError, ForbiddenError

class ComplaintService:
    """Service for complaint creation, querying, and explainable assessment."""

    @staticmethod
    def create_complaint(
        citizen_id: int,
        title: str,
        description: str,
        category_id: int,
        latitude: float = None,
        longitude: float = None,
        approx_location: str = None,
        contact_phone: str = None,
        immediate_danger: bool = False,
        is_essential_facility: bool = False,
        facility_type: str = None,
        reported_duration_days: int = 0,
    ) -> Complaint:
        if not title or len(title.strip()) < 5:
            raise ValidationError("Complaint title must be at least 5 characters.")
        if not description or len(description.strip()) < 15:
            raise ValidationError("Complaint description must be at least 15 characters.")

        category = Category.query.get(category_id)
        if not category or not category.is_active:
            raise ValidationError("Please select an active, valid category.")

        department = Department.query.get(category.department_id)
        if not department:
            raise ValidationError("Target department for category not found.")

        # Compute initial SLA due date
        now = utcnow()
        due_at = calculate_due_date(now, category.default_sla_hours)

        # Generate unique public reference ID
        ref_num = generate_reference_number()
        # Guarantee uniqueness
        while Complaint.query.filter_by(reference_number=ref_num).first():
            ref_num = generate_reference_number()

        # Run Explainable Priority Assessment
        engine = PriorityEngine()
        assessment_result = engine.assess(
            title=title,
            description=description,
            category_code=category.code,
            immediate_danger=immediate_danger,
            is_essential_facility=is_essential_facility,
            facility_type=facility_type,
            reported_duration_days=reported_duration_days,
        )

        complaint = Complaint(
            reference_number=ref_num,
            citizen_id=citizen_id,
            title=title.strip(),
            description=description.strip(),
            category_id=category.id,
            department_id=department.id,
            status="SUBMITTED",
            current_priority=assessment_result["level"],
            priority_score=assessment_result["score"],
            priority_engine_version=assessment_result["engine_version"],
            reported_duration_days=reported_duration_days,
            is_essential_facility=is_essential_facility,
            facility_type=facility_type,
            immediate_danger=immediate_danger,
            latitude=latitude,
            longitude=longitude,
            approx_location=approx_location.strip() if approx_location else None,
            contact_phone=contact_phone.strip() if contact_phone else None,
            due_at=due_at,
        )
        db.session.add(complaint)
        db.session.flush() # Populate complaint.id

        # Record Priority Assessment
        assessment = PriorityAssessment(
            complaint_id=complaint.id,
            score=assessment_result["score"],
            level=assessment_result["level"],
            fired_rules=assessment_result["fired_rules"],
            summary=assessment_result["summary"],
            missing_information="; ".join(assessment_result.get("missing_information", [])),
            engine_version=assessment_result["engine_version"]
        )
        db.session.add(assessment)

        # Record Initial Status History
        status_hist = ComplaintStatusHistory(
            complaint_id=complaint.id,
            previous_status=None,
            new_status="SUBMITTED",
            actor_id=citizen_id,
            public_note="Complaint submitted by citizen and queued for triage."
        )
        db.session.add(status_hist)

        db.session.commit()

        # Trigger duplicate similarity check asynchronously / safely
        try:
            dup_service = DuplicateDetectionService()
            dup_service.find_and_record_similar(complaint)
        except Exception:
            pass

        return complaint

    @staticmethod
    def reassess_priority(complaint_id: int) -> PriorityAssessment:
        complaint = Complaint.query.get(complaint_id)
        if not complaint:
            raise NotFoundError("Complaint not found.")

        engine = PriorityEngine()
        result = engine.assess(
            title=complaint.title,
            description=complaint.description,
            category_code=complaint.category.code if complaint.category else None,
            immediate_danger=complaint.immediate_danger,
            is_essential_facility=complaint.is_essential_facility,
            facility_type=complaint.facility_type,
            reported_duration_days=complaint.reported_duration_days,
        )

        complaint.current_priority = result["level"]
        complaint.priority_score = result["score"]
        complaint.priority_engine_version = result["engine_version"]

        assessment = PriorityAssessment(
            complaint_id=complaint.id,
            score=result["score"],
            level=result["level"],
            fired_rules=result["fired_rules"],
            summary=result["summary"],
            missing_information="; ".join(result.get("missing_information", [])),
            engine_version=result["engine_version"]
        )
        db.session.add(assessment)
        db.session.commit()
        return assessment
