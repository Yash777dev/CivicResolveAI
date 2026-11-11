from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.user import User
from app.models.audit import AuditLog
from app.models.rules import ModelEvaluation
from app.models.department import Department
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService
from app.policies.permissions import role_required, get_current_user
from app.utils.pagination import paginate_query
from app.extensions import db
from app.errors import NotFoundError, ValidationError, ConflictError

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/admin/users", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_users():
    query = User.query.order_by(User.created_at.desc())
    
    role = request.args.get("role")
    if role:
        query = query.filter_by(role=role)

    dept_id = request.args.get("department_id")
    if dept_id:
        query = query.filter_by(department_id=int(dept_id))

    search = request.args.get("search")
    if search:
        search_pat = f"%{search.strip()}%"
        query = query.filter((User.name.ilike(search_pat)) | (User.email.ilike(search_pat)))

    paginated = paginate_query(query)
    return jsonify({
        "status": "success",
        "data": {
            "items": [u.to_dict(include_private=True) for u in paginated["items"]],
            "total": paginated["total"],
            "page": paginated["page"],
            "per_page": paginated["per_page"],
            "total_pages": paginated["total_pages"],
        }
    }), 200

@admin_bp.route("/admin/users", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_staff_user():
    actor = get_current_user()
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "officer")
    dept_id = data.get("department_id")

    if role not in ("officer", "supervisor", "admin", "citizen"):
        raise ValidationError("Invalid role specified.")

    user = AuthService.register_user(name=name, email=email, password=password, role=role)
    if dept_id:
        dept = Department.query.get(int(dept_id))
        if dept:
            user.department_id = dept.id
            db.session.commit()

    AuditService.log_action(
        action="admin_created_user",
        resource_type="user",
        resource_id=str(user.id),
        actor_id=actor.id,
        metadata={"email": user.email, "role": user.role, "department_id": user.department_id},
        ip_address=request.remote_addr
    )

    return jsonify({
        "status": "success",
        "message": f"User {user.name} ({user.role}) created.",
        "data": user.to_dict(include_private=True)
    }), 201

@admin_bp.route("/admin/users/<int:user_id>/role", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def update_user_role(user_id):
    actor = get_current_user()
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError("User not found.")

    data = request.get_json() or {}
    new_role = data.get("role")
    new_dept_id = data.get("department_id")
    status = data.get("account_status")

    if new_role and new_role in ("citizen", "officer", "supervisor", "admin"):
        user.role = new_role
    if new_dept_id is not None:
        user.department_id = int(new_dept_id) if new_dept_id else None
    if status and status in ("active", "suspended", "inactive"):
        user.account_status = status

    db.session.commit()

    AuditService.log_action(
        action="admin_updated_user_role",
        resource_type="user",
        resource_id=str(user.id),
        actor_id=actor.id,
        metadata={"role": user.role, "department_id": user.department_id, "status": user.account_status},
        ip_address=request.remote_addr
    )

    return jsonify({
        "status": "success",
        "message": "User updated successfully.",
        "data": user.to_dict(include_private=True)
    }), 200

@admin_bp.route("/admin/audit-logs", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_audit_logs():
    query = AuditLog.query.order_by(AuditLog.timestamp.desc())

    action = request.args.get("action")
    if action:
        query = query.filter_by(action=action)

    resource_type = request.args.get("resource_type")
    if resource_type:
        query = query.filter_by(resource_type=resource_type)

    paginated = paginate_query(query, default_per_page=25)
    return jsonify({
        "status": "success",
        "data": {
            "items": [log.to_dict() for log in paginated["items"]],
            "total": paginated["total"],
            "page": paginated["page"],
            "per_page": paginated["per_page"],
            "total_pages": paginated["total_pages"],
        }
    }), 200

@admin_bp.route("/admin/model-evaluation", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_model_evaluation():
    evaluation = ModelEvaluation.query.order_by(ModelEvaluation.trained_at.desc()).first()
    if not evaluation:
        return jsonify({
            "status": "success",
            "is_trained": False,
            "message": "No machine learning model has been trained yet. Using deterministic rule-based priority and category taxonomy baseline.",
            "data": None
        }), 200

    return jsonify({
        "status": "success",
        "is_trained": True,
        "data": evaluation.to_dict()
    }), 200
