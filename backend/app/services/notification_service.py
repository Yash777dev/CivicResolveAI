from app.extensions import db
from app.models.notification import Notification
from app.utils.time import utcnow
from app.errors import NotFoundError

class NotificationService:
    """Service to create, fetch, and mark in-app notifications."""

    @staticmethod
    def get_user_notifications(user_id: int, unread_only: bool = False, limit: int = 50):
        query = Notification.query.filter_by(recipient_id=user_id)
        if unread_only:
            query = query.filter_by(is_read=False)
        return query.order_by(Notification.created_at.desc()).limit(limit).all()

    @staticmethod
    def mark_as_read(notification_id: int, user_id: int) -> Notification:
        notif = Notification.query.filter_by(id=notification_id, recipient_id=user_id).first()
        if not notif:
            raise NotFoundError("Notification not found.")
        notif.is_read = True
        notif.read_at = utcnow()
        db.session.commit()
        return notif

    @staticmethod
    def mark_all_as_read(user_id: int):
        now = utcnow()
        Notification.query.filter_by(recipient_id=user_id, is_read=False).update(
            {"is_read": True, "read_at": now}
        )
        db.session.commit()
