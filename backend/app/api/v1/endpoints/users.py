"""User profile endpoints."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_db, get_current_user
from app.crud.crud import (
    get_user_by_id,
    get_user_skills,
    add_user_skill,
    delete_user_skill,
)
from app.schemas.schemas import UserOut, UserSkillCreate, UserSkillOut

router = APIRouter()


@router.get("/me", response_model=UserOut)
async def read_current_user(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile and credit balance."""
    return current_user


@router.get("/me/skills", response_model=List[UserSkillOut])
async def read_my_skills(
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return all skills (offered and needed) for the current user."""
    return await get_user_skills(db, current_user["id"])


@router.post("/me/skills", response_model=UserSkillOut, status_code=201)
async def add_skill(
    skill_in: UserSkillCreate,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Add a skill to the current user's profile."""
    return await add_user_skill(db, current_user["id"], skill_in)


@router.delete("/me/skills/{skill_id}", status_code=204)
async def remove_skill(
    skill_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Remove a skill from the current user's profile."""
    deleted = await delete_user_skill(db, current_user["id"], skill_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Skill entry not found.")


@router.get("/{user_id}", response_model=UserOut)
async def read_user_profile(
    user_id: str,
    db = Depends(get_db),
    _: dict = Depends(get_current_user),  # require auth
):
    """Fetch any user's public profile."""
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user
