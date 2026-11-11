from app.extensions import db
from app.models.complaint import Complaint
from app.models.history import ComplaintStatusHistory
from app.models.notification import Notification
from app.policies.transitions import validate_transition
from app.utils.time import utcnow
from app.errors import NotFoundError, ValidationError

class WorkflowService:
    """Service governing complaint status changes and resolution lifecycles."""

    @staticmethod
    def update_status(
        complaint_id: int,
        new_status: str,
        user,
        public_note: str = None,
        internal_note: str = None,
        resolution_summary: str = None
    ) -> Complaint:
        complaint = Complaint.query.get(complaint_id)
        if not complaint:
            raise NotFoundError("Complaint not found.")

        # Validate transition using policy graph
        validate_transition(complaint.status, new_status, user, resolution_summary)

        prev_status = complaint.status
        now = utcnow()

        # Update timestamps based on target status
        if new_status in ("TRIAGED", "ASSIGNED") and not complaint.acknowledged_at:
            complaint.acknowledged_at = now

        if new_status == "RESOLVED":
            complaint.resolved_at = now
            complaint.resolution_summary = resolution_summary.strip()
        elif new_status == "CLOSED":
            complaint.closed_at = now
        elif new_status == "REOPENED":
            complaint.resolved_at = None
            complaint.closed_at = None

        complaint.status = new_status
        complaint.updated_at = now

        # Add history record
        history = ComplaintStatusHistory(
            complaint_id=complaint.id,
            previous_status=prev_status,
            new_status=new_status,
            actor_id=user.id,
            public_note=public_note.strip() if public_note else f"Status changed from {prev_status} to {new_status}.",
            internal_note=internal_note.strip() if internal_note else None
        )
        db.session.add(history)

        # Notify citizen
        notification = Notification(
            recipient_id=complaint.citizen_id,
            complaint_id=complaint.id,
            title=f"Complaint Status: {new_status.replace('_', ' ')}",
            message=public_note or f"Your grievance #{complaint.reference_number} has been moved to {new_status}.",
            type="status_update"
        )
        db.session.add(notification)

        db.session.commit()
        return complaint
