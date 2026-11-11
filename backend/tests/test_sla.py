import io
from app.utils.time import calculate_due_date, calculate_sla_status, utcnow
from app.services.sla_service import SLAService
from datetime import timedelta

def test_sla_due_date_calculation():
    start = utcnow()
    due = calculate_due_date(start, 48)
    diff = (due - start).total_seconds() / 3600.0
    assert abs(diff - 48.0) < 0.1

def test_sla_status_within_and_overdue():
    now = utcnow()
    # Future due date
    future_due = now + timedelta(hours=10)
    status_future = calculate_sla_status(future_due)
    assert not status_future["is_overdue"]
    assert status_future["hours_remaining"] >= 9.9

    # Past due date
    past_due = now - timedelta(hours=5)
    status_past = calculate_sla_status(past_due)
    assert status_past["is_overdue"]
    assert status_past["overdue_hours"] >= 4.9
