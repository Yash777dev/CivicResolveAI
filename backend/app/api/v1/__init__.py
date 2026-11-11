from flask import Blueprint
from app.api.v1.auth import auth_bp
from app.api.v1.complaints import complaints_bp
from app.api.v1.categories import categories_bp
from app.api.v1.departments import departments_bp
from app.api.v1.assignments import assignments_bp
from app.api.v1.workflow import workflow_bp
from app.api.v1.priority import priority_bp
from app.api.v1.notifications import notifications_bp
from app.api.v1.analytics import analytics_bp
from app.api.v1.admin import admin_bp
from app.api.v1.health import health_bp

def register_v1_blueprints(app):
    """Register all API v1 blueprints with the Flask application."""
    api_prefix = "/api/v1"
    
    app.register_blueprint(auth_bp, url_prefix=api_prefix)
    app.register_blueprint(complaints_bp, url_prefix=api_prefix)
    app.register_blueprint(categories_bp, url_prefix=api_prefix)
    app.register_blueprint(departments_bp, url_prefix=api_prefix)
    app.register_blueprint(assignments_bp, url_prefix=api_prefix)
    app.register_blueprint(workflow_bp, url_prefix=api_prefix)
    app.register_blueprint(priority_bp, url_prefix=api_prefix)
    app.register_blueprint(notifications_bp, url_prefix=api_prefix)
    app.register_blueprint(analytics_bp, url_prefix=api_prefix)
    app.register_blueprint(admin_bp, url_prefix=api_prefix)
    app.register_blueprint(health_bp, url_prefix=api_prefix)
