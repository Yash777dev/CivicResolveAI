from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.complaint import Complaint
from app.models.category import Category
from app.models.user import User
from app.models.priority import PriorityAssessment, PriorityOverride
from app.models.history import ComplaintStatusHistory, ComplaintNote
from app.models.feedback import ComplaintFeedback
from app.models.rules import ComplaintSimilarity
from app.services.complaint_service import ComplaintService
from app.services.workflow_service import WorkflowService
from app.services.assignment_service import AssignmentService
from app.services.storage_service import StorageService
from app.services.audit_service import AuditService
from app.policies.permissions import get_current_user, check_complaint_access, role_required
from app.utils.pagination import paginate_query
from app.utils.time import utcnow
from app.extensions import db
from app.errors import NotFoundError, ValidationError, ForbiddenError, UnauthorizedError

complaints_bp = Blueprint("complaints", __name__)

@complaints_bp.route("/complaints", methods=["POST"])
@jwt_required()
def create_complaint():
    user = get_current_user()
    if not user:
        raise UnauthorizedError("Authentication required.")

    data = request.get_json() or {}
    raw_cat_id = data.get("category_id")
    if not raw_cat_id:
        raise ValidationError("Category ID is required.")
    try:
        category_id = int(raw_cat_id)
    except (ValueError, TypeError):
        raise ValidationError("Category ID must be a valid integer.")

    complaint = ComplaintService.create_complaint(
        citizen_id=user.id,
        title=data.get("title"),
        description=data.get("description"),
        category_id=category_id,
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        approx_location=data.get("approx_location"),
        contact_phone=data.get("contact_phone") or user.phone_number,
        immediate_danger=bool(data.get("immediate_danger", False)),
        is_essential_facility=bool(data.get("is_essential_facility", False)),
        facility_type=data.get("facility_type"),
        reported_duration_days=int(data.get("reported_duration_days", 0)),
    )

    AuditService.log_action(
        action="complaint_created",
        resource_type="complaint",
        resource_id=str(complaint.id),
        actor_id=user.id,
        metadata={"reference_number": complaint.reference_number, "priority": complaint.current_priority},
        ip_address=request.remote_addr
    )

    return jsonify({
        "status": "success",
        "message": f"Complaint registered with reference number {complaint.reference_number}.",
        "data": complaint.to_dict(include_private=True)
    }), 201

@complaints_bp.route("/complaints", methods=["GET"])
@jwt_required()
def list_complaints():
    user = get_current_user()
    if not user:
        raise UnauthorizedError("Authentication required.")

    query = Complaint.query

    # Enforce role-based scoping
    if user.role == "citizen":
        query = query.filter(Complaint.citizen_id == user.id)
    elif user.role in ("officer", "supervisor"):
        # Officers see complaints in their department, or where they are assigned
        if user.department_id:
            dept_scope = request.args.get("scope", "department") # department or assigned_only
            if dept_scope == "assigned_only":
                query = query.filter(Complaint.assigned_officer_id == user.id)
            else:
                query = query.filter(
                    (Complaint.department_id == user.department_id) | (Complaint.assigned_officer_id == user.id)
                )

    # Optional Filters
    status = request.args.get("status")
    if status:
        query = query.filter(Complaint.status == status.upper())

    priority = request.args.get("priority")
    if priority:
        query = query.filter(Complaint.current_priority == priority.upper())

    category_id = request.args.get("category_id")
    if category_id:
        query = query.filter(Complaint.category_id == int(category_id))

    department_id = request.args.get("department_id")
    if department_id and user.role == "admin":
        query = query.filter(Complaint.department_id == int(department_id))

    search = request.args.get("search")
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Complaint.title.ilike(search_pattern)) |
            (Complaint.description.ilike(search_pattern)) |
            (Complaint.reference_number.ilike(search_pattern)) |
            (Complaint.approx_location.ilike(search_pattern))
        )

    # Sorting
    sort_by = request.args.get("sort_by", "created_at")
    sort_dir = request.args.get("sort_dir", "desc")
    
    if sort_by == "priority":
        order_col = Complaint.priority_score
    elif sort_by == "due_at":
        order_col = Complaint.due_at
    else:
        order_col = Complaint.created_at

    query = query.order_by(order_col.desc() if sort_dir == "desc" else order_col.asc())

    paginated = paginate_query(query)
    is_officer = user.role in ("officer", "supervisor", "admin")

    return jsonify({
        "status": "success",
        "data": {
            "items": [c.to_dict(include_private=(user.role == "admin" or c.citizen_id == user.id), is_officer=is_officer) for c in paginated["items"]],
            "total": paginated["total"],
            "page": paginated["page"],
            "per_page": paginated["per_page"],
            "total_pages": paginated["total_pages"],
        }
    }), 200

@complaints_bp.route("/complaints/<int:complaint_id>", methods=["GET"])
@jwt_required()
def get_complaint_details(complaint_id):
    user = get_current_user()
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        raise NotFoundError("Complaint not found.")

    if not check_complaint_access(complaint, user):
        raise ForbiddenError("You are not authorized to view this complaint.")

    is_officer = user.role in ("officer", "supervisor", "admin")

    # Fetch status history
    history = [h.to_dict(is_officer=is_officer) for h in complaint.status_history]

    # Fetch assignment history
    assignment_hist = [a.to_dict() for a in complaint.assignment_history] if is_officer else []

    # Fetch latest priority assessment
    latest_assessment = complaint.priority_assessments.first()
    assessment_dict = latest_assessment.to_dict() if latest_assessment else None

    # Fetch priority override history
    overrides = [o.to_dict() for o in complaint.priority_overrides] if is_officer else []

    # Fetch evidence items
    evidence = [e.to_dict() for e in complaint.evidence_items]

    # Fetch notes (public notes for citizen, both for officer)
    notes_query = complaint.notes
    if not is_officer:
        notes_query = notes_query.filter_by(note_type="public")
    notes = [n.to_dict() for n in notes_query]

    # Feedback
    feedback = complaint.feedback.to_dict() if complaint.feedback else None

    # Similar complaints (officer only)
    similar_cases = []
    if is_officer:
        sims = ComplaintSimilarity.query.filter(
            (ComplaintSimilarity.complaint_a_id == complaint.id) |
            (ComplaintSimilarity.complaint_b_id == complaint.id)
        ).all()
        for s in sims:
            other_id = s.complaint_b_id if s.complaint_a_id == complaint.id else s.complaint_a_id
            other_c = Complaint.query.get(other_id)
            if other_c:
                similar_cases.append({
                    "id": s.id,
                    "similar_complaint_id": other_c.id,
                    "reference_number": other_c.reference_number,
                    "title": other_c.title,
                    "status": other_c.status,
                    "priority": other_c.current_priority,
                    "similarity_score": round(s.similarity_score, 3),
                    "reason": s.reason,
                    "relationship_status": s.status
                })

    data = complaint.to_dict(include_private=(user.role == "admin" or complaint.citizen_id == user.id), is_officer=is_officer)
    data["status_history"] = history
    data["assignment_history"] = assignment_hist
    data["priority_assessment"] = assessment_dict
    data["priority_overrides"] = overrides
    data["evidence"] = evidence
    data["notes"] = notes
    data["feedback"] = feedback
    data["similar_cases"] = similar_cases

    return jsonify({
        "status": "success",
        "data": data
    }), 200

@complaints_bp.route("/complaints/track/<reference_number>", methods=["POST"])
def track_complaint(reference_number):
    """
    Public tracking endpoint with secure identity verification.
    Requires last 4 digits of contact phone or citizen email to verify ownership.
    Never exposes private data or phone numbers.
    """
    data = request.get_json() or {}
    phone_last4 = data.get("phone_last4", "").strip()
    email_verification = data.get("email", "").strip().lower()

    complaint = Complaint.query.filter_by(reference_number=reference_number.strip().upper()).first()
    if not complaint:
        raise NotFoundError("Complaint reference number not found.")

    # Verification check
    verified = False
    if phone_last4 and complaint.contact_phone and complaint.contact_phone.endswith(phone_last4):
        verified = True
    elif email_verification and complaint.citizen.email.lower() == email_verification:
        verified = True

    if not verified:
        raise ForbiddenError("Verification failed. Please provide the matching email or the last 4 digits of the phone number provided at submission.")

    # Return public-safe tracking details
    history = [{"status": h.new_status, "note": h.public_note, "date": h.created_at.isoformat()} for h in complaint.status_history]

    return jsonify({
        "status": "success",
        "data": {
            "reference_number": complaint.reference_number,
            "title": complaint.title,
            "category": complaint.category.name if complaint.category else None,
            "department": complaint.department.name if complaint.department else None,
            "status": complaint.status,
            "current_priority": complaint.current_priority,
            "approx_location": complaint.approx_location,
            "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
            "due_at": complaint.due_at.isoformat() if complaint.due_at else None,
            "resolved_at": complaint.resolved_at.isoformat() if complaint.resolved_at else None,
            "resolution_summary": complaint.resolution_summary,
            "timeline": history
        }
    }), 200

@complaints_bp.route("/complaints/<int:complaint_id>/evidence", methods=["POST"])
@jwt_required()
def upload_evidence(complaint_id):
    user = get_current_user()
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        raise NotFoundError("Complaint not found.")

    if not check_complaint_access(complaint, user):
        raise ForbiddenError("Not authorized to upload evidence to this case.")

    if "file" not in request.files:
        raise ValidationError("No file attached in multipart form-data.")

    file = request.files["file"]
    evidence = StorageService.save_evidence(complaint.id, file, uploader_id=user.id)

    AuditService.log_action(
        action="evidence_uploaded",
        resource_type="complaint_evidence",
        resource_id=str(evidence.id),
        actor_id=user.id,
        metadata={"filename": evidence.original_filename, "size": evidence.byte_size},
        ip_address=request.remote_addr
    )

    return jsonify({
        "status": "success",
        "message": "Evidence uploaded successfully.",
        "data": evidence.to_dict()
    }), 201

@complaints_bp.route("/complaints/<int:complaint_id>/evidence/<int:evidence_id>", methods=["DELETE"])
@jwt_required()
def delete_evidence(complaint_id, evidence_id):
    user = get_current_user()
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        raise NotFoundError("Complaint not found.")

    if not check_complaint_access(complaint, user):
        raise ForbiddenError("Not authorized to manage evidence on this case.")

    StorageService.delete_evidence(evidence_id)
    return jsonify({
        "status": "success",
        "message": "Evidence removed."
    }), 200

@complaints_bp.route("/complaints/<int:complaint_id>/evidence/<int:evidence_id>/download", methods=["GET"])
@jwt_required()
def download_evidence(complaint_id, evidence_id):
    user = get_current_user()
    complaint = Complaint.query.get(complaint_id)
    if not complaint or not check_complaint_access(complaint, user):
        raise ForbiddenError("Not authorized to access evidence.")

    from app.models.evidence import ComplaintEvidence
    evidence = ComplaintEvidence.query.get(evidence_id)
    if not evidence or evidence.complaint_id != complaint.id:
        raise NotFoundError("Evidence not found.")

    file_path = StorageService.get_file_path(evidence.storage_key)
    return send_file(file_path, mimetype=evidence.mime_type, as_attachment=False, download_name=evidence.original_filename)

@complaints_bp.route("/complaints/<int:complaint_id>/reassess", methods=["POST"])
@jwt_required()
@role_required("officer", "supervisor", "admin")
def reassess_complaint(complaint_id):
    user = get_current_user()
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        raise NotFoundError("Complaint not found.")

    assessment = ComplaintService.reassess_priority(complaint.id)

    AuditService.log_action(
        action="priority_reassessed",
        resource_type="complaint",
        resource_id=str(complaint.id),
        actor_id=user.id,
        metadata={"new_score": assessment.score, "new_level": assessment.level},
        ip_address=request.remote_addr
    )

    return jsonify({
        "status": "success",
        "message": f"Priority reassessed: {assessment.level} ({assessment.score}/100).",
        "data": assessment.to_dict()
    }), 200

@complaints_bp.route("/complaints/<int:complaint_id>/override-priority", methods=["POST"])
@jwt_required()
@role_required("officer", "supervisor", "admin")
def override_priority(complaint_id):
    user = get_current_user()
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        raise NotFoundError("Complaint not found.")

    data = request.get_json() or {}
    new_level = data.get("new_level", "").upper()
    new_score = int(data.get("new_score", 50))
    reason = data.get("reason", "").strip()

    if new_level not in ("LOW", "MEDIUM", "HIGH"):
        raise ValidationError("Invalid priority level. Allowed: LOW, MEDIUM, HIGH.")
    if len(reason) < 10:
        raise ValidationError("A justification reason (min 10 characters) is mandatory to override priority.")

    prev_score = complaint.priority_score
    prev_level = complaint.current_priority

    complaint.current_priority = new_level
    complaint.priority_score = max(0, min(100, new_score))

    override = PriorityOverride(
        complaint_id=complaint.id,
        previous_score=prev_score,
        previous_level=prev_level,
        new_score=complaint.priority_score,
        new_level=new_level,
        reason=reason,
        actor_id=user.id
    )
    db.session.add(override)
    db.session.commit()

    AuditService.log_action(
        action="priority_override",
        resource_type="complaint",
        resource_id=str(complaint.id),
        actor_id=user.id,
        metadata={"from": prev_level, "to": new_level, "reason": reason},
        ip_address=request.remote_addr
    )

    return jsonify({
        "status": "success",
        "message": f"Priority manually overridden from {prev_level} to {new_level}.",
        "data": override.to_dict()
    }), 200

@complaints_bp.route("/complaints/<int:complaint_id>/status", methods=["POST"])
@jwt_required()
def update_status(complaint_id):
    user = get_current_user()
    data = request.get_json() or {}
    new_status = data.get("status", "").upper()
    public_note = data.get("public_note")
    internal_note = data.get("internal_note")
    resolution_summary = data.get("resolution_summary")

    complaint = WorkflowService.update_status(
        complaint_id=complaint_id,
        new_status=new_status,
        user=user,
        public_note=public_note,
        internal_note=internal_note,
        resolution_summary=resolution_summary
    )

    AuditService.log_action(
        action="status_updated",
        resource_type="complaint",
        resource_id=str(complaint.id),
        actor_id=user.id,
        metadata={"new_status": new_status},
        ip_address=request.remote_addr
    )

    return jsonify({
        "status": "success",
        "message": f"Complaint status updated to {new_status}.",
        "data": complaint.to_dict(is_officer=(user.role in ("officer", "supervisor", "admin")))
    }), 200

@complaints_bp.route("/complaints/<int:complaint_id>/assign", methods=["POST"])
@jwt_required()
@role_required("officer", "supervisor", "admin")
def assign_complaint(complaint_id):
    user = get_current_user()
    data = request.get_json() or {}
    dept_id = data.get("department_id")
    officer_id = data.get("officer_id")
    reason = data.get("reason")

    complaint = AssignmentService.assign_complaint(
        complaint_id=complaint_id,
        officer_id=officer_id,
        department_id=dept_id,
        actor=user,
        reason=reason
    )

    AuditService.log_action(
        action="assignment_updated",
        resource_type="complaint",
        resource_id=str(complaint.id),
        actor_id=user.id,
        metadata={"assigned_officer_id": complaint.assigned_officer_id, "department_id": complaint.department_id},
        ip_address=request.remote_addr
    )

    return jsonify({
        "status": "success",
        "message": "Assignment updated successfully.",
        "data": complaint.to_dict(is_officer=True)
    }), 200

@complaints_bp.route("/complaints/<int:complaint_id>/notes", methods=["POST"])
@jwt_required()
def add_note(complaint_id):
    user = get_current_user()
    complaint = Complaint.query.get(complaint_id)
    if not complaint or not check_complaint_access(complaint, user):
        raise ForbiddenError("Not authorized to add notes.")

    data = request.get_json() or {}
    body = data.get("body", "").strip()
    note_type = data.get("note_type", "internal")

    if not body:
        raise ValidationError("Note body cannot be empty.")

    if user.role == "citizen":
        note_type = "public" # Citizens can only add public notes

    note = ComplaintNote(
        complaint_id=complaint.id,
        author_id=user.id,
        note_type=note_type,
        body=body
    )
    db.session.add(note)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Note added.",
        "data": note.to_dict()
    }), 201

@complaints_bp.route("/complaints/<int:complaint_id>/feedback", methods=["POST"])
@jwt_required()
def submit_feedback(complaint_id):
    user = get_current_user()
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        raise NotFoundError("Complaint not found.")

    if complaint.citizen_id != user.id:
        raise ForbiddenError("Only the citizen who filed this complaint can submit feedback.")

    if complaint.status not in ("RESOLVED", "CLOSED"):
        raise ValidationError("Feedback can only be submitted after resolution.")

    data = request.get_json() or {}
    rating = int(data.get("rating", 5))
    comments = data.get("comments", "").strip()
    reopen_req = bool(data.get("reopen_requested", False))
    reopen_reason = data.get("reopen_reason", "").strip()

    if rating < 1 or rating > 5:
        raise ValidationError("Rating must be between 1 and 5 stars.")

    existing = ComplaintFeedback.query.filter_by(complaint_id=complaint.id).first()
    if existing:
        existing.rating = rating
        existing.comments = comments
        existing.reopen_requested = reopen_req
        existing.reopen_reason = reopen_reason
        fb = existing
    else:
        fb = ComplaintFeedback(
            complaint_id=complaint.id,
            citizen_id=user.id,
            rating=rating,
            comments=comments,
            reopen_requested=reopen_req,
            reopen_reason=reopen_reason
        )
        db.session.add(fb)

    # If reopen requested, transition complaint
    if reopen_req:
        WorkflowService.update_status(
            complaint_id=complaint.id,
            new_status="REOPENED",
            user=user,
            public_note=f"Reopening requested by citizen: {reopen_reason or 'Issue persists.'}"
        )

    db.session.commit()
    return jsonify({
        "status": "success",
        "message": "Feedback submitted.",
        "data": fb.to_dict()
    }), 201
