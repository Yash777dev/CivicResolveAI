from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService
from app.models.user import User
from app.extensions import db
from app.errors import UnauthorizedError, ValidationError, NotFoundError

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    preferred_language = data.get("preferred_language", "en")
    phone = data.get("phone")

    user = AuthService.register_user(
        name=name,
        email=email,
        password=password,
        role="citizen",
        preferred_language=preferred_language,
        phone=phone
    )

    AuditService.log_action(
        action="user_registered",
        resource_type="user",
        resource_id=str(user.id),
        actor_id=user.id,
        metadata={"email": user.email, "role": user.role},
        ip_address=request.remote_addr
    )

    user_obj, access_token, refresh_token = AuthService.authenticate_user(email, password)

    return jsonify({
        "status": "success",
        "message": "Citizen registered successfully.",
        "data": {
            "user": user.to_dict(include_private=True),
            "access_token": access_token,
            "refresh_token": refresh_token
        }
    }), 201

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise ValidationError("Email and password are required.")

    user, access_token, refresh_token = AuthService.authenticate_user(email, password)

    AuditService.log_action(
        action="user_login",
        resource_type="user",
        resource_id=str(user.id),
        actor_id=user.id,
        metadata={"email": user.email, "role": user.role},
        ip_address=request.remote_addr
    )

    return jsonify({
        "status": "success",
        "message": "Login successful.",
        "data": {
            "user": user.to_dict(include_private=True),
            "access_token": access_token,
            "refresh_token": refresh_token
        }
    }), 200

@auth_bp.route("/auth/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or user.account_status != "active":
        raise UnauthorizedError("Invalid refresh session.")

    new_access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "name": user.name}
    )

    return jsonify({
        "status": "success",
        "data": {
            "access_token": new_access_token
        }
    }), 200

@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    # Stateless JWT logout acknowledged
    return jsonify({
        "status": "success",
        "message": "Logged out successfully."
    }), 200

@auth_bp.route("/auth/me", methods=["GET"])
@jwt_required()
def get_current_user_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        raise NotFoundError("User not found.")

    return jsonify({
        "status": "success",
        "data": {
            "user": user.to_dict(include_private=True)
        }
    }), 200

@auth_bp.route("/auth/profile", methods=["PATCH"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        raise NotFoundError("User not found.")

    data = request.get_json() or {}
    if "name" in data and len(data["name"].strip()) >= 2:
        user.name = data["name"].strip()
    if "preferred_language" in data and data["preferred_language"] in ("en", "ta"):
        user.preferred_language = data["preferred_language"]
    if "phone" in data:
        user.phone_number = data["phone"].strip() if data["phone"] else None

    db.session.commit()
    return jsonify({
        "status": "success",
        "message": "Profile updated successfully.",
        "data": {
            "user": user.to_dict(include_private=True)
        }
    }), 200
