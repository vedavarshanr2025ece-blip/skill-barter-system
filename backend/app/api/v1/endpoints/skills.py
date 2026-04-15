"""Skills discovery endpoint — search master skill list and find users by skill+location."""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_db, get_current_user
from app.crud.crud import search_skills, search_users_by_skill
from app.schemas.schemas import SkillOut, UserOut

router = APIRouter()


@router.get("/", response_model=List[SkillOut])
async def list_skills(
    q: Optional[str] = Query(None, description="Search skill by name"),
    db = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """
    List or search the master skill catalogue.
    If `q` is provided, filters skills whose name contains the query (case-insensitive).
    """
    return await search_skills(db, q)


@router.get("/search", response_model=List[UserOut])
async def search_users_offering_skill(
    q: str = Query(..., description="Skill name to search for"),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius: Optional[float] = Query(20.0, description="Search radius in km"),
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Find users offering a specific skill, optionally filtered by geographic proximity.
    Returns a list of user profiles.
    """
    return await search_users_by_skill(db, skill_query=q, lat=lat, lng=lng, radius_km=radius)
