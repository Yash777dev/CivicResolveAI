from flask import Flask
from app.config import Config
from app.extensions import db, migrate, jwt, cors
from app.logging_config import setup_logging
from app.errors import register_error_handlers
from app.api.v1 import register_v1_blueprints

def create_app(config_class=Config):
    """Application factory for CivicResolve AI backend."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}},
        supports_credentials=True
    )

    # Logging and Error Handlers
    setup_logging(app)
    register_error_handlers(app)

    # Register API v1 routes
    register_v1_blueprints(app)

    return app
