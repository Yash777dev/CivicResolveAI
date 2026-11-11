from functools import wraps
from flask import jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User
from app.errors import UnauthorizedError, ForbiddenError

def get_current_user():
    """Retrieve currently authenticated user from JWT identity."""
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        if not user_id:
            return None
        user = User.query.get(int(user_id))
        return user
    except Exception:
        return None

def role_required(*allowed_roles):
    """Decorator to enforce role-based access control."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            
            if not user or user.account_status != "active":
                raise UnauthorizedError("User account is inactive or not found.")
                
            if user.role not in allowed_roles:
                raise ForbiddenError(f"Access restricted to roles: {', '.join(allowed_roles)}")
                
            # Store authenticated user in Flask's g for request context
            g.current_user = user
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def check_complaint_access(complaint, user):
    """
    Object-level authorization check:
    - Citizen: only their own complaint.
    - Officer/Supervisor: cases assigned to their department or overall departmental scope.
    - Admin: access to all cases.
    """
    if not user:
        return False
    if user.role == "admin":
        return True
    if user.role in ("officer", "supervisor"):
        # If user has a department, complaint must belong to that department, or user is assigned
        if user.department_id and complaint.department_id != user.department_id:
            if complaint.assigned_officer_id != user.id:
                return False
        return True
    if user.role == "citizen":
        return complaint.citizen_id == user.id
    return False
