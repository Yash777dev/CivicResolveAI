import statistics
from datetime import datetime, timezone
from sqlalchemy import func
from app.extensions import db
from app.models.complaint import Complaint
from app.models.category import Category
from app.models.department import Department
from app.utils.time import utcnow

class AnalyticsService:
    """Real database analytics service computing live metrics without fabricated values."""

    @staticmethod
    def get_summary_metrics(department_id: int = None) -> dict:
        query = Complaint.query
        if department_id:
            query = query.filter_by(department_id=department_id)

        all_complaints = query.all()
        total = len(all_complaints)

        if total == 0:
            return {
                "total_complaints": 0,
                "pending_count": 0,
                "in_progress_count": 0,
                "resolved_count": 0,
                "closed_count": 0,
                "escalated_count": 0,
                "overdue_count": 0,
                "resolution_rate_percent": 0.0,
                "overdue_rate_percent": 0.0,
                "median_acknowledgement_hours": None,
                "median_resolution_hours": None,
                "priority_breakdown": {"HIGH": 0, "MEDIUM": 0, "LOW": 0},
                "status_breakdown": {},
            }

        now = utcnow()
        status_counts = {}
        priority_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
        overdue_count = 0
        ack_durations = []
        res_durations = []

        for c in all_complaints:
            # Status count
            status_counts[c.status] = status_counts.get(c.status, 0) + 1
            # Priority count
            priority_counts[c.current_priority] = priority_counts.get(c.current_priority, 0) + 1

            # Overdue check
            if c.status not in ("RESOLVED", "CLOSED") and c.due_at:
                due = c.due_at.replace(tzinfo=timezone.utc) if c.due_at.tzinfo is None else c.due_at
                if due < now:
                    overdue_count += 1

            # Acknowledgement duration
            if c.acknowledged_at and c.created_at:
                c_dt = c.created_at.replace(tzinfo=timezone.utc) if c.created_at.tzinfo is None else c.created_at
                a_dt = c.acknowledged_at.replace(tzinfo=timezone.utc) if c.acknowledged_at.tzinfo is None else c.acknowledged_at
                hours = max(0.0, (a_dt - c_dt).total_seconds() / 3600.0)
                ack_durations.append(hours)

            # Resolution duration
            if c.resolved_at and c.created_at:
                c_dt = c.created_at.replace(tzinfo=timezone.utc) if c.created_at.tzinfo is None else c.created_at
                r_dt = c.resolved_at.replace(tzinfo=timezone.utc) if c.resolved_at.tzinfo is None else c.resolved_at
                hours = max(0.0, (r_dt - c_dt).total_seconds() / 3600.0)
                res_durations.append(hours)

        resolved_total = status_counts.get("RESOLVED", 0) + status_counts.get("CLOSED", 0)
        resolution_rate = round((resolved_total / total) * 100, 1)
        overdue_rate = round((overdue_count / total) * 100, 1)

        median_ack = round(statistics.median(ack_durations), 1) if ack_durations else None
        median_res = round(statistics.median(res_durations), 1) if res_durations else None

        return {
            "total_complaints": total,
            "pending_count": status_counts.get("SUBMITTED", 0) + status_counts.get("TRIAGED", 0),
            "in_progress_count": status_counts.get("IN_PROGRESS", 0) + status_counts.get("ASSIGNED", 0),
            "resolved_count": status_counts.get("RESOLVED", 0),
            "closed_count": status_counts.get("CLOSED", 0),
            "escalated_count": status_counts.get("ESCALATED", 0),
            "overdue_count": overdue_count,
            "resolution_rate_percent": resolution_rate,
            "overdue_rate_percent": overdue_rate,
            "median_acknowledgement_hours": median_ack,
            "median_resolution_hours": median_res,
            "priority_breakdown": priority_counts,
            "status_breakdown": status_counts,
        }

    @staticmethod
    def get_category_distribution() -> list:
        results = db.session.query(
            Category.name,
            Category.code,
            func.count(Complaint.id).label("count")
        ).outerjoin(Complaint, Complaint.category_id == Category.id)\
         .group_by(Category.id, Category.name, Category.code)\
         .all()

        return [{"category_name": r[0], "category_code": r[1], "count": r[2]} for r in results]

    @staticmethod
    def get_department_workload() -> list:
        results = db.session.query(
            Department.name,
            Department.code,
            func.count(Complaint.id).label("total_cases"),
            func.sum(db.case((Complaint.status.in_(["RESOLVED", "CLOSED"]), 1), else_=0)).label("resolved_cases")
        ).outerjoin(Complaint, Complaint.department_id == Department.id)\
         .group_by(Department.id, Department.name, Department.code)\
         .all()

        data = []
        for r in results:
            total = r[2] or 0
            resolved = r[3] or 0
            rate = round((resolved / total * 100), 1) if total > 0 else 0.0
            data.append({
                "department_name": r[0],
                "department_code": r[1],
                "total_cases": total,
                "resolved_cases": resolved,
                "resolution_rate": rate
            })
        return data

    @staticmethod
    def export_csv_rows(department_id: int = None) -> list:
        """
        Generate sanitized rows for CSV export.
        Escapes spreadsheet formulas (=, +, -, @) to prevent formula injection.
        """
        query = Complaint.query
        if department_id:
            query = query.filter_by(department_id=department_id)
        complaints = query.order_by(Complaint.created_at.desc()).all()

        def sanitize_cell(val):
            if val is None:
                return ""
            s = str(val).strip()
            # Formula injection prevention
            if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
                return f"'{s}"
            return s

        rows = []
        for c in complaints:
            rows.append({
                "Reference Number": sanitize_cell(c.reference_number),
                "Title": sanitize_cell(c.title),
                "Category": sanitize_cell(c.category.name if c.category else ""),
                "Department": sanitize_cell(c.department.name if c.department else ""),
                "Status": sanitize_cell(c.status),
                "Priority Level": sanitize_cell(c.current_priority),
                "Priority Score": sanitize_cell(c.priority_score),
                "Approx Location": sanitize_cell(c.approx_location or ""),
                "Created At": sanitize_cell(c.created_at.isoformat() if c.created_at else ""),
                "Due At": sanitize_cell(c.due_at.isoformat() if c.due_at else ""),
                "Resolved At": sanitize_cell(c.resolved_at.isoformat() if c.resolved_at else ""),
            })
        return rows
