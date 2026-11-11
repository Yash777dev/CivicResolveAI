from app.errors import ValidationError, ForbiddenError

VALID_STATUSES = {
    "SUBMITTED",
    "TRIAGED",
    "ASSIGNED",
    "IN_PROGRESS",
    "NEEDS_INFORMATION",
    "RESOLVED",
    "CLOSED",
    "REOPENED",
    "ESCALATED",
}

# Permitted state transitions map
TRANSITION_GRAPH = {
    "SUBMITTED": {"TRIAGED", "ASSIGNED"},
    "TRIAGED": {"ASSIGNED", "NEEDS_INFORMATION", "ESCALATED"},
    "ASSIGNED": {"IN_PROGRESS", "NEEDS_INFORMATION", "ESCALATED"},
    "IN_PROGRESS": {"RESOLVED", "NEEDS_INFORMATION", "ESCALATED"},
    "NEEDS_INFORMATION": {"IN_PROGRESS", "ASSIGNED", "RESOLVED"},
    "RESOLVED": {"CLOSED", "REOPENED"},
    "CLOSED": {"REOPENED"},
    "REOPENED": {"TRIAGED", "ASSIGNED", "IN_PROGRESS"},
    "ESCALATED": {"IN_PROGRESS", "RESOLVED"},
}

def validate_transition(current_status: str, new_status: str, user, resolution_summary: str = None) -> bool:
    """
    Validate that a proposed status transition is permitted by policy and user role.
    Raises ValidationError or ForbiddenError on invalid transitions.
    """
    if new_status not in VALID_STATUSES:
        raise ValidationError(f"Invalid complaint status: {new_status}")

    if current_status == new_status:
        raise ValidationError(f"Complaint is already in status '{current_status}'.")

    allowed_targets = TRANSITION_GRAPH.get(current_status, set())
    if new_status not in allowed_targets:
        raise ValidationError(
            f"Cannot transition status from '{current_status}' to '{new_status}'. Allowed: {', '.join(allowed_targets)}"
        )

    # Resolution requires a summary explanation
    if new_status == "RESOLVED":
        if not resolution_summary or len(resolution_summary.strip()) < 10:
            raise ValidationError("A detailed resolution summary (min 10 characters) is mandatory to resolve a complaint.")

    # Reopening permissions: citizen can request reopen if it's their complaint, or officer/admin can reopen
    if new_status == "REOPENED":
        # Any authenticated actor with complaint access may reopen if within valid states
        pass

    # Officers and Admins can perform workflow transitions; Citizens can only submit or request reopen / provide info
    if user.role == "citizen" and new_status not in ("REOPENED", "IN_PROGRESS"):
        raise ForbiddenError("Citizens cannot directly update administrative case status.")

    return True
