from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.rules import PriorityRule
from app.extensions import db
from app.policies.permissions import role_required, get_current_user
from app.services.audit_service import AuditService
from app.services.priority_engine import PriorityEngine
from app.errors import NotFoundError, ValidationError

priority_bp = Blueprint("priority", __name__)

@priority_bp.route("/priority/rules", methods=["GET"])
def list_rules():
    rules = PriorityRule.query.order_by(PriorityRule.id.asc()).all()
    return jsonify({
        "status": "success",
        "data": [r.to_dict() for r in rules]
    }), 200

@priority_bp.route("/priority/rules/<int:rule_id>", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def update_rule(rule_id):
    user = get_current_user()
    rule = PriorityRule.query.get(rule_id)
    if not rule:
        raise NotFoundError("Rule not found.")

    data = request.get_json() or {}
    prev_weight = rule.weight

    if "weight" in data:
        rule.weight = int(data["weight"])
    if "is_active" in data:
        rule.is_active = bool(data["is_active"])
    if "name" in data:
        rule.name = data["name"].strip()
    if "description" in data:
        rule.description = data["description"].strip()
    if "config" in data:
        rule.config = data["config"]

    rule.updated_by = user.id
    db.session.commit()

    AuditService.log_action(
        action="priority_rule_updated",
        resource_type="priority_rule",
        resource_id=str(rule.id),
        actor_id=user.id,
        metadata={"rule_key": rule.rule_key, "prev_weight": prev_weight, "new_weight": rule.weight},
        ip_address=request.remote_addr
    )

    return jsonify({
        "status": "success",
        "message": f"Rule '{rule.name}' updated successfully.",
        "data": rule.to_dict()
    }), 200

@priority_bp.route("/priority/test-assessment", methods=["POST"])
def test_assessment():
    """Interactive playground for evaluating how rules score an arbitrary complaint."""
    data = request.get_json() or {}
    engine = PriorityEngine()
    result = engine.assess(
        title=data.get("title", ""),
        description=data.get("description", ""),
        category_code=data.get("category_code"),
        immediate_danger=bool(data.get("immediate_danger", False)),
        is_essential_facility=bool(data.get("is_essential_facility", False)),
        facility_type=data.get("facility_type"),
        reported_duration_days=int(data.get("reported_duration_days", 0)),
        nearby_recent_count=int(data.get("nearby_recent_count", 0)),
        vulnerable_mentioned=bool(data.get("vulnerable_mentioned", False)),
    )
    return jsonify({
        "status": "success",
        "data": result
    }), 200
