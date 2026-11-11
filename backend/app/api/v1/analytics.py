import io
import csv
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required
from app.services.analytics_service import AnalyticsService
from app.policies.permissions import get_current_user, role_required
from app.errors import UnauthorizedError

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/analytics/summary", methods=["GET"])
@jwt_required()
def get_summary():
    user = get_current_user()
    if not user:
        raise UnauthorizedError("Authentication required.")

    dept_id = None
    if user.role in ("officer", "supervisor") and user.department_id:
        dept_id = user.department_id
    elif user.role == "admin":
        req_dept = request.args.get("department_id")
        if req_dept:
            dept_id = int(req_dept)

    metrics = AnalyticsService.get_summary_metrics(department_id=dept_id)
    return jsonify({
        "status": "success",
        "data": metrics
    }), 200

@analytics_bp.route("/analytics/categories", methods=["GET"])
@jwt_required()
def get_category_distribution():
    data = AnalyticsService.get_category_distribution()
    return jsonify({
        "status": "success",
        "data": data
    }), 200

@analytics_bp.route("/analytics/departments", methods=["GET"])
@jwt_required()
def get_department_workload():
    data = AnalyticsService.get_department_workload()
    return jsonify({
        "status": "success",
        "data": data
    }), 200

@analytics_bp.route("/analytics/export-csv", methods=["GET"])
@jwt_required()
@role_required("officer", "supervisor", "admin")
def export_csv():
    user = get_current_user()
    dept_id = user.department_id if user.role in ("officer", "supervisor") else None
    if user.role == "admin" and request.args.get("department_id"):
        dept_id = int(request.args.get("department_id"))

    rows = AnalyticsService.export_csv_rows(department_id=dept_id)
    if not rows:
        return Response("No complaints data available", mimetype="text/csv")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=civicresolve_grievances.csv"}
    )
