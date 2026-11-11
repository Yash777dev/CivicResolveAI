from datetime import datetime, timezone
from app.extensions import db
from app.models.complaint import Complaint
from app.models.history import ComplaintStatusHistory
from app.models.notification import Notification
from app.utils.time import utcnow, calculate_sla_status

class SLAService:
    """Service to evaluate service level agreements and trigger escalations."""

    @staticmethod
    def check_and_escalate_overdue():
        """
        Check open cases past due_at, flag as ESCALATED if overdue by > 24 hours,
        and generate notifications for departmental officers.
        """
        now = utcnow()
        open_cases = Complaint.query.filter(
            Complaint.status.notin_(["RESOLVED", "CLOSED"]),
            Complaint.due_at != None,
            Complaint.due_at < now
        ).all()

        escalated_count = 0
        for case in open_cases:
            diff_hours = (now - case.due_at).total_seconds() / 3600.0
            
            # If overdue by more than 24 hours and not already escalated, trigger escalation
            if diff_hours >= 24.0 and case.status != "ESCALATED":
                prev_status = case.status
                case.status = "ESCALATED"
                escalated_count += 1

                db.session.add(ComplaintStatusHistory(
                    complaint_id=case.id,
                    previous_status=prev_status,
                    new_status="ESCALATED",
                    actor_id=None,
                    public_note="Case automatically escalated due to breach of SLA resolution target."
                ))

                if case.assigned_officer_id:
                    db.session.add(Notification(
                        recipient_id=case.assigned_officer_id,
                        complaint_id=case.id,
                        title="URGENT: SLA Breach Escalation",
                        message=f"Case #{case.reference_number} is {round(diff_hours, 1)} hours overdue and has been escalated.",
                        type="sla_breach"
                    ))

        if escalated_count > 0:
            db.session.commit()
        return escalated_count
