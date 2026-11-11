from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.category import Category
from app.models.department import Department
from app.services.classification_service import CategoryClassificationService
from app.extensions import db
from app.policies.permissions import role_required
from app.errors import NotFoundError, ValidationError, ConflictError

categories_bp = Blueprint("categories", __name__)
classifier = CategoryClassificationService()

@categories_bp.route("/categories", methods=["GET"])
def list_categories():
    dept_id = request.args.get("department_id")
    active_only = request.args.get("active", "true").lower() == "true"

    query = Category.query
    if dept_id:
        query = query.filter_by(department_id=int(dept_id))
    if active_only:
        query = query.filter_by(is_active=True)

    categories = query.order_by(Category.name.asc()).all()

    return jsonify({
        "status": "success",
        "data": [c.to_dict() for c in categories]
    }), 200

@categories_bp.route("/categories/<int:cat_id>", methods=["GET"])
def get_category(cat_id):
    cat = Category.query.get(cat_id)
    if not cat:
        raise NotFoundError("Category not found.")
    return jsonify({
        "status": "success",
        "data": cat.to_dict()
    }), 200

@categories_bp.route("/categories/predict", methods=["POST"])
def predict_category():
    data = request.get_json() or {}
    text = data.get("text", "")
    result = classifier.predict_category(text)

    # Look up category id from code
    cat = Category.query.filter_by(code=result.get("category_code")).first()
    if cat:
        result["category_id"] = cat.id
        result["category_name"] = cat.name
        result["department_id"] = cat.department_id
        result["department_name"] = cat.department.name if cat.department else None

    return jsonify({
        "status": "success",
        "data": result
    }), 200

@categories_bp.route("/categories", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_category():
    data = request.get_json() or {}
    code = data.get("code", "").strip().upper()
    name = data.get("name", "").strip()
    department_id = data.get("department_id")
    description = data.get("description", "").strip()
    default_sla_hours = int(data.get("default_sla_hours", 48))
    keywords = data.get("keywords", [])

    if not code or not name or not department_id:
        raise ValidationError("Code, name, and department_id are required.")

    if not Department.query.get(department_id):
        raise ValidationError("Invalid department_id.")

    if Category.query.filter_by(code=code).first():
        raise ConflictError(f"Category code '{code}' already exists.")

    cat = Category(
        code=code,
        name=name,
        department_id=department_id,
        description=description,
        default_sla_hours=default_sla_hours,
        is_active=True
    )
    cat.keywords = keywords
    db.session.add(cat)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Category created successfully.",
        "data": cat.to_dict()
    }), 201

@categories_bp.route("/categories/<int:cat_id>", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def update_category(cat_id):
    cat = Category.query.get(cat_id)
    if not cat:
        raise NotFoundError("Category not found.")

    data = request.get_json() or {}
    if "name" in data:
        cat.name = data["name"].strip()
    if "description" in data:
        cat.description = data["description"].strip()
    if "default_sla_hours" in data:
        cat.default_sla_hours = int(data["default_sla_hours"])
    if "is_active" in data:
        cat.is_active = bool(data["is_active"])
    if "keywords" in data:
        cat.keywords = data["keywords"]

    db.session.commit()
    return jsonify({
        "status": "success",
        "message": "Category updated successfully.",
        "data": cat.to_dict()
    }), 200
