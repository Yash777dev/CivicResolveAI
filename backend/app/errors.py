from flask import jsonify

class AppError(Exception):
    """Base application exception."""
    status_code = 400

    def __init__(self, message, payload=None, status_code=None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv["status"] = "error"
        rv["message"] = self.message
        return rv


class ValidationError(AppError):
    status_code = 422


class UnauthorizedError(AppError):
    status_code = 401


class ForbiddenError(AppError):
    status_code = 403


class NotFoundError(AppError):
    status_code = 404


class ConflictError(AppError):
    status_code = 409


def register_error_handlers(app):
    """Register custom error handlers for the Flask app."""

    @app.errorhandler(AppError)
    def handle_app_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(400)
    def handle_bad_request(error):
        return jsonify({
            "status": "error",
            "message": getattr(error, "description", "Bad request.")
        }), 400

    @app.errorhandler(401)
    def handle_unauthorized(error):
        return jsonify({
            "status": "error",
            "message": "Authentication required or invalid credentials."
        }), 401

    @app.errorhandler(403)
    def handle_forbidden(error):
        return jsonify({
            "status": "error",
            "message": "You do not have permission to access this resource."
        }), 403

    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({
            "status": "error",
            "message": "The requested resource was not found."
        }), 404

    @app.errorhandler(422)
    def handle_unprocessable_entity(error):
        return jsonify({
            "status": "error",
            "message": "Unprocessable entity. Please verify input data fields."
        }), 422

    @app.errorhandler(500)
    def handle_internal_server_error(error):
        app.logger.error(f"Internal Server Error: {error}")
        return jsonify({
            "status": "error",
            "message": "An unexpected internal server error occurred."
        }), 500
