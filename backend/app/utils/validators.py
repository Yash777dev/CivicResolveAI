import re
import hashlib
from werkzeug.utils import secure_filename
from app.errors import ValidationError

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

ALLOWED_MIME_TYPES = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "pdf": "application/pdf"
}

def normalize_email(email: str) -> str:
    """Normalize and validate email address."""
    if not email or not isinstance(email, str):
        raise ValidationError("Email address is required.")
    email = email.strip().lower()
    if not EMAIL_REGEX.match(email):
        raise ValidationError("Invalid email address format.")
    return email

def sanitize_file_upload(filename: str, allowed_extensions: set) -> tuple[str, str]:
    """
    Sanitize uploaded filename, check extension, prevent path traversal.
    Returns (sanitized_name, extension).
    """
    if not filename:
        raise ValidationError("No filename provided for upload.")
    
    clean_name = secure_filename(filename)
    if not clean_name:
        raise ValidationError("Invalid filename.")
        
    if "." not in clean_name:
        raise ValidationError("File must have a valid extension.")
        
    ext = clean_name.rsplit(".", 1)[1].lower()
    if ext not in allowed_extensions:
        raise ValidationError(f"File type '.{ext}' is not permitted. Allowed: {', '.join(allowed_extensions)}")
        
    return clean_name, ext

def compute_sha256(file_bytes: bytes) -> str:
    """Compute SHA-256 checksum of uploaded bytes."""
    return hashlib.sha256(file_bytes).hexdigest()
