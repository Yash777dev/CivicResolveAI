from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.notification_service import NotificationService
from app.policies.permissions import get_current_user
from app.errors import UnauthorizedError

notifications_bp = Blueprint("notifications", __name__)

@notifications_bp.route("/notifications", methods=["GET"])
@jwt_required()
def list_notifications():
    user = get_current_user()
    if not user:
        raise UnauthorizedError("Authentication required.")

    unread_only = request.args.get("unread_only", "false").lower() == "true"
    limit = int(request.args.get("limit", 50))
    notifs = NotificationService.get_user_notifications(user.id, unread_only=unread_only, limit=limit)

    return jsonify({
        "status": "success",
        "data": [n.to_dict() for n in notifs]
    }), 200

@notifications_bp.route("/notifications/<int:notification_id>/read", methods=["PATCH"])
@jwt_required()
def mark_notification_read(notification_id):
    user = get_current_user()
    notif = NotificationService.mark_as_read(notification_id, user.id)
    return jsonify({
        "status": "success",
        "data": notif.to_dict()
    }), 200

@notifications_bp.route("/notifications/read-all", methods=["POST"])
@jwt_required()
def mark_all_read():
    user = get_current_user()
    NotificationService.mark_all_as_read(user.id)
    return jsonify({
        "status": "success",
        "message": "All notifications marked as read."
    }), 200
