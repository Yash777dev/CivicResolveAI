from datetime import datetime, timezone, timedelta

def utcnow() -> datetime:
    """Return current timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)

def calculate_due_date(start_date: datetime, sla_hours: int) -> datetime:
    """
    Calculate SLA due date from start date by adding SLA hours.
    Preserves UTC timezone.
    """
    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    return start_date + timedelta(hours=sla_hours)

def calculate_sla_status(due_date: datetime, resolved_date: datetime = None) -> dict:
    """
    Determine if a case is overdue, hours remaining, or overdue duration.
    """
    if not due_date:
        return {"status": "NO_SLA", "hours_remaining": None, "is_overdue": False}

    if due_date.tzinfo is None:
        due_date = due_date.replace(tzinfo=timezone.utc)

    target_now = resolved_date if resolved_date else utcnow()
    if target_now.tzinfo is None:
        target_now = target_now.replace(tzinfo=timezone.utc)

    diff = due_date - target_now
    total_hours = diff.total_seconds() / 3600.0

    if total_hours < 0:
        return {
            "status": "OVERDUE",
            "hours_remaining": 0,
            "overdue_hours": round(abs(total_hours), 1),
            "is_overdue": True
        }
    else:
        return {
            "status": "WITHIN_SLA",
            "hours_remaining": round(total_hours, 1),
            "overdue_hours": 0,
            "is_overdue": False
        }
