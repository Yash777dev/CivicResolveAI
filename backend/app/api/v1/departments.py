from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.department import Department
from app.models.category import Category
from app.extensions import db
from app.policies.permissions import role_required
from app.errors import NotFoundError, ValidationError, ConflictError

departments_bp = Blueprint("departments", __name__)

@departments_bp.route("/departments", methods=["GET"])
def list_departments():
    active_only = request.args.get("active", "true").lower() == "true"
    query = Department.query
    if active_only:
        query = query.filter_by(is_active=True)
    departments = query.order_by(Department.name.asc()).all()

    return jsonify({
        "status": "success",
        "data": [d.to_dict() for d in departments]
    }), 200

@departments_bp.route("/departments/<int:dept_id>", methods=["GET"])
def get_department(dept_id):
    dept = Department.query.get(dept_id)
    if not dept:
        raise NotFoundError("Department not found.")
    return jsonify({
        "status": "success",
        "data": dept.to_dict()
    }), 200

@departments_bp.route("/departments", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_department():
    data = request.get_json() or {}
    code = data.get("code", "").strip().upper()
    name = data.get("name", "").strip()
    description = data.get("description", "").strip()

    if not code or not name:
        raise ValidationError("Department code and name are required.")

    if Department.query.filter_by(code=code).first():
        raise ConflictError(f"Department code '{code}' already exists.")

    dept = Department(code=code, name=name, description=description, is_active=True)
    db.session.add(dept)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Department created successfully.",
        "data": dept.to_dict()
    }), 201

@departments_bp.route("/departments/<int:dept_id>", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def update_department(dept_id):
    dept = Department.query.get(dept_id)
    if not dept:
        raise NotFoundError("Department not found.")

    data = request.get_json() or {}
    if "name" in data:
        dept.name = data["name"].strip()
    if "description" in data:
        dept.description = data["description"].strip()
    if "is_active" in data:
        dept.is_active = bool(data["is_active"])

    db.session.commit()
    return jsonify({
        "status": "success",
        "message": "Department updated successfully.",
        "data": dept.to_dict()
    }), 200
