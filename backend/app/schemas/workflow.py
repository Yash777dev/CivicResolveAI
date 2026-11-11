from pydantic import BaseModel, Field
from typing import Optional

class StatusUpdateRequest(BaseModel):
    status: str
    public_note: Optional[str] = None
    internal_note: Optional[str] = None
    resolution_summary: Optional[str] = None

class AssignmentRequest(BaseModel):
    department_id: Optional[int] = None
    officer_id: Optional[int] = None
    reason: Optional[str] = None

class FeedbackRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None
    reopen_requested: Optional[bool] = False
    reopen_reason: Optional[str] = None

class NoteRequest(BaseModel):
    body: str = Field(..., min_length=2)
    note_type: Optional[str] = "internal"
