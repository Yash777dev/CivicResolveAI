from app.extensions import db
from app.models.complaint import Complaint
from app.models.department import Department
from app.models.user import User
from app.models.history import ComplaintAssignmentHistory
from app.models.notification import Notification
from app.errors import NotFoundError, ValidationError, ForbiddenError

class AssignmentService:
    """Service governing officer assignments and cross-departmental handoffs."""

    @staticmethod
    def assign_complaint(
        complaint_id: int,
        officer_id: int = None,
        department_id: int = None,
        actor=None,
        reason: str = None
    ) -> Complaint:
        complaint = Complaint.query.get(complaint_id)
        if not complaint:
            raise NotFoundError("Complaint not found.")

        prev_dept_id = complaint.department_id
        prev_officer_id = complaint.assigned_officer_id

        # Update department if specified
        if department_id and department_id != complaint.department_id:
            dept = Department.query.get(department_id)
            if not dept or not dept.is_active:
                raise ValidationError("Target department is inactive or not found.")
            complaint.department_id = dept.id
            # Reset assigned officer if changing department
            if not officer_id:
                complaint.assigned_officer_id = None

        # Update officer if specified
        if officer_id is not None:
            if officer_id == 0 or officer_id == -1: # unassign
                complaint.assigned_officer_id = None
            else:
                officer = User.query.get(officer_id)
                if not officer or officer.role not in ("officer", "supervisor"):
                    raise ValidationError("Assigned user must be an officer or supervisor.")
                if officer.department_id and officer.department_id != complaint.department_id:
                    raise ValidationError("Officer must belong to the case's assigned department.")
                complaint.assigned_officer_id = officer.id

                # Notify officer
                db.session.add(Notification(
                    recipient_id=officer.id,
                    complaint_id=complaint.id,
                    title="New Grievance Assigned",
                    message=f"Grievance #{complaint.reference_number} ({complaint.title}) has been assigned to you.",
                    type="assignment"
                ))

        # Auto transition to ASSIGNED if currently SUBMITTED or TRIAGED
        if complaint.assigned_officer_id and complaint.status in ("SUBMITTED", "TRIAGED"):
            complaint.status = "ASSIGNED"

        # Record assignment history
        history = ComplaintAssignmentHistory(
            complaint_id=complaint.id,
            previous_department_id=prev_dept_id,
            new_department_id=complaint.department_id,
            previous_officer_id=prev_officer_id,
            new_officer_id=complaint.assigned_officer_id,
            actor_id=actor.id if actor else None,
            reason=reason.strip() if reason else "Assignment updated by supervisor."
        )
        db.session.add(history)
        db.session.commit()
        return complaint
