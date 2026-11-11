from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.user import User
from app.policies.permissions import role_required, get_current_user
from app.errors import UnauthorizedError

assignments_bp = Blueprint("assignments", __name__)

@assignments_bp.route("/assignments/department-officers/<int:department_id>", methods=["GET"])
@jwt_required()
@role_required("officer", "supervisor", "admin")
def get_department_officers(department_id):
    officers = User.query.filter_by(department_id=department_id, account_status="active").filter(
        User.role.in_(["officer", "supervisor"])
    ).all()

    return jsonify({
        "status": "success",
        "data": [o.to_dict() for o in officers]
    }), 200
