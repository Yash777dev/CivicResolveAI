from pydantic import BaseModel, Field
from typing import Optional, List

class ComplaintCreateRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=15)
    category_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    approx_location: Optional[str] = None
    contact_phone: Optional[str] = None
    immediate_danger: Optional[bool] = False
    is_essential_facility: Optional[bool] = False
    facility_type: Optional[str] = None
    reported_duration_days: Optional[int] = 0

class ComplaintTrackRequest(BaseModel):
    reference_number: str
    verification_phone: Optional[str] = None
    verification_email: Optional[str] = None
