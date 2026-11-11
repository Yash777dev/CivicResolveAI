from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class PriorityOverrideRequest(BaseModel):
    new_level: str = Field(..., pattern="^(LOW|MEDIUM|HIGH)$")
    new_score: int = Field(..., ge=0, le=100)
    reason: str = Field(..., min_length=10)

class PriorityRuleUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    weight: Optional[int] = None
    is_active: Optional[bool] = None
