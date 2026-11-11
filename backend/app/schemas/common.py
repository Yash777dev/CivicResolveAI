from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, List

class APIResponse(BaseModel):
    status: str = "success"
    message: Optional[str] = None
    data: Optional[Any] = None

class PaginatedData(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    total_pages: int
