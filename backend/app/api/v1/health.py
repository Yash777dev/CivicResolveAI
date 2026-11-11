from flask import Blueprint, jsonify
from datetime import datetime, timezone
from app.extensions import db

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint verifying database connectivity and service status."""
    db_status = "connected"
    try:
        db.session.execute(db.text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    return jsonify({
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "CivicResolve AI API",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }), 200 if db_status == "connected" else 503
