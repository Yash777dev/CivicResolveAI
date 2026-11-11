from flask_jwt_extended import create_access_token, create_refresh_token
from app.models.user import User
from app.extensions import db
from app.errors import UnauthorizedError, ConflictError, ValidationError
from app.utils.validators import normalize_email

class AuthService:
    """Authentication and identity service handling registration, login, and tokens."""

    @staticmethod
    def register_user(name: str, email: str, password: str, role: str = "citizen", preferred_language: str = "en", phone: str = None) -> User:
        clean_email = normalize_email(email)
        
        if not name or len(name.strip()) < 2:
            raise ValidationError("Name must be at least 2 characters long.")
        if not password or len(password) < 6:
            raise ValidationError("Password must be at least 6 characters long.")
            
        existing = User.query.filter_by(email=clean_email).first()
        if existing:
            raise ConflictError("An account with this email address already exists.")

        user = User(
            name=name.strip(),
            email=clean_email,
            role=role if role in ("citizen", "officer", "admin", "supervisor") else "citizen",
            preferred_language=preferred_language if preferred_language in ("en", "ta") else "en",
            phone_number=phone.strip() if phone else None,
            account_status="active"
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def authenticate_user(email: str, password: str) -> tuple[User, str, str]:
        clean_email = normalize_email(email)
        user = User.query.filter_by(email=clean_email).first()
        
        if not user or not user.check_password(password):
            raise UnauthorizedError("Invalid email or password.")

        if user.account_status != "active":
            raise UnauthorizedError("Your account has been deactivated. Please contact support.")

        # In Flask-JWT-Extended, subject identity should be a string (user id)
        access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role, "name": user.name})
        refresh_token = create_refresh_token(identity=str(user.id))

        return user, access_token, refresh_token
