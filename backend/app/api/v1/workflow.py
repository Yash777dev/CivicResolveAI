from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.policies.transitions import TRANSITION_GRAPH, VALID_STATUSES
from app.services.sla_service import SLAService
from app.policies.permissions import role_required

workflow_bp = Blueprint("workflow", __name__)

@workflow_bp.route("/workflow/transitions", methods=["GET"])
def get_transitions():
    formatted = {k: list(v) for k, v in TRANSITION_GRAPH.items()}
    return jsonify({
        "status": "success",
        "data": {
            "valid_statuses": list(VALID_STATUSES),
            "transitions": formatted
        }
    }), 200

@workflow_bp.route("/workflow/check-sla", methods=["POST"])
@jwt_required()
@role_required("officer", "supervisor", "admin")
def trigger_sla_check():
    escalated_count = SLAService.check_and_escalate_overdue()
    return jsonify({
        "status": "success",
        "message": f"SLA check completed. {escalated_count} overdue cases escalated.",
        "escalated_count": escalated_count
    }), 200
