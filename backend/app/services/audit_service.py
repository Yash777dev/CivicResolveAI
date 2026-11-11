from app.extensions import db
from app.models.audit import AuditLog
from app.policies.retention import sanitize_metadata_for_logging

class AuditService:
    """Service to capture auditable system actions and compliance logs."""

    @staticmethod
    def log_action(action: str, resource_type: str, resource_id: str = None, actor_id: int = None, metadata: dict = None, ip_address: str = None) -> AuditLog:
        safe_meta = sanitize_metadata_for_logging(metadata or {})
        entry = AuditLog(
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            ip_address=ip_address
        )
        entry.meta = safe_meta
        db.session.add(entry)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
        return entry
