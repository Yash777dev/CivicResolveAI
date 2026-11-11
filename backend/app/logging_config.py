import logging
import sys

def setup_logging(app):
    """Configure structured logging for the application."""
    log_level = logging.DEBUG if app.config.get("DEBUG") else logging.INFO
    
    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s in %(module)s (%(pathname)s:%(lineno)d): %(message)s"
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    handler.setLevel(log_level)

    app.logger.setLevel(log_level)
    # Avoid duplicate handlers
    if not app.logger.handlers:
        app.logger.addHandler(handler)
