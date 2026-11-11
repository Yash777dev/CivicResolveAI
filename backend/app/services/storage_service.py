import os
import uuid
from pathlib import Path
from flask import current_app
from werkzeug.datastructures import FileStorage
from app.extensions import db
from app.models.evidence import ComplaintEvidence
from app.utils.validators import sanitize_file_upload, compute_sha256
from app.errors import ValidationError, NotFoundError

class StorageService:
    """Service handling file upload validation, random UUID storage, and checksumming."""

    @staticmethod
    def save_evidence(complaint_id: int, file: FileStorage, uploader_id: int = None) -> ComplaintEvidence:
        if not file or not file.filename:
            raise ValidationError("No file provided.")

        allowed_exts = current_app.config.get("ALLOWED_EXTENSIONS", {"jpg", "jpeg", "png", "webp", "pdf"})
        sanitized_orig, ext = sanitize_file_upload(file.filename, allowed_exts)

        # Read contents to compute checksum and byte size
        file_bytes = file.read()
        byte_size = len(file_bytes)
        max_size = current_app.config.get("MAX_CONTENT_LENGTH", 10 * 1024 * 1024)
        if byte_size > max_size:
            raise ValidationError(f"File exceeds maximum allowed size of {max_size // (1024 * 1024)}MB.")

        checksum = compute_sha256(file_bytes)

        # Generate non-predictable UUID storage filename
        storage_key = f"{uuid.uuid4().hex}.{ext}"
        upload_folder = current_app.config["UPLOAD_FOLDER"]
        file_path = os.path.join(upload_folder, storage_key)

        # Write to disk
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        mime_type = file.mimetype or "application/octet-stream"

        evidence = ComplaintEvidence(
            complaint_id=complaint_id,
            storage_key=storage_key,
            original_filename=sanitized_orig,
            sanitized_filename=sanitized_orig,
            mime_type=mime_type,
            byte_size=byte_size,
            checksum=checksum,
            uploaded_by=uploader_id
        )
        db.session.add(evidence)
        db.session.commit()
        return evidence

    @staticmethod
    def get_file_path(storage_key: str) -> str:
        upload_folder = current_app.config["UPLOAD_FOLDER"]
        full_path = os.path.abspath(os.path.join(upload_folder, storage_key))
        
        # Prevent path traversal outside upload folder
        if not full_path.startswith(os.path.abspath(upload_folder)):
            raise ValidationError("Invalid storage path.")
            
        if not os.path.exists(full_path):
            raise NotFoundError("Evidence file not found on disk.")
            
        return full_path

    @staticmethod
    def delete_evidence(evidence_id: int):
        evidence = ComplaintEvidence.query.get(evidence_id)
        if not evidence:
            raise NotFoundError("Evidence not found.")

        try:
            full_path = StorageService.get_file_path(evidence.storage_key)
            if os.path.exists(full_path):
                os.remove(full_path)
        except Exception:
            pass

        db.session.delete(evidence)
        db.session.commit()
