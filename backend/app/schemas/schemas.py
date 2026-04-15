from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# ── Enums ────────────────────────────────────────────────────────────────────
class SkillTypeEnum(str, Enum):
    OFFERED = "OFFERED"
    NEEDED = "NEEDED"

class ProficiencyEnum(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    EXPERT = "EXPERT"

class RequestStatusEnum(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class SessionStatusEnum(str, Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    DISPUTED = "DISPUTED"

# ── Base Auth / User ─────────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    username: str
    email: EmailStr
    credit_balance: int
    created_at: datetime

    class Config:
        from_attributes = True

# ── Skills ───────────────────────────────────────────────────────────────────
class SkillOut(BaseModel):
    id: str
    name: str
    category: str

    class Config:
        from_attributes = True

class UserSkillCreate(BaseModel):
    skill_id: str
    type: SkillTypeEnum
    proficiency: Optional[ProficiencyEnum] = None

class UserSkillOut(BaseModel):
    id: str
    user_id: str
    skill_id: str
    type: SkillTypeEnum
    proficiency: Optional[ProficiencyEnum] = None
    skill_name: Optional[str] = None
    skill_category: Optional[str] = None

    class Config:
        from_attributes = True

# ── Barter Requests ──────────────────────────────────────────────────────────
class BarterRequestCreate(BaseModel):
    receiver_id: str
    requested_skill_id: str
    offered_skill_id: Optional[str] = None

class BarterRequestOut(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    requested_skill_id: str
    offered_skill_id: Optional[str] = None
    status: RequestStatusEnum
    created_at: datetime
    session_id: Optional[str] = None

    class Config:
        from_attributes = True

class BarterRequestStatusUpdate(BaseModel):
    status: RequestStatusEnum

# ── Sessions ─────────────────────────────────────────────────────────────────
class SessionCreate(BaseModel):
    request_id: str
    scheduled_time: datetime
    location_or_link: str

class SessionOut(BaseModel):
    id: str
    request_id: str
    scheduled_time: datetime
    location_or_link: str
    status: SessionStatusEnum

    class Config:
        from_attributes = True

# ── Reviews ──────────────────────────────────────────────────────────────────
class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: str
    session_id: str
    reviewer_id: str
    reviewee_id: str
    rating: int
    comment: Optional[str] = None

    class Config:
        from_attributes = True
