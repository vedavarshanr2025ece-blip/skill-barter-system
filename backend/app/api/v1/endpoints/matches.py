"""AI match recommendations endpoint."""
from typing import List

from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_db, get_current_user
from app.services.ai_matcher import get_recommendations

router = APIRouter()

@router.get("/recommendations")
async def get_match_recommendations(
    limit: int = Query(10, ge=1, le=50),
    max_distance_km: float = Query(20.0, ge=1.0, le=200.0),
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns AI-ranked user recommendations based on:
      - Mutual skill compatibility (direct swap detection)
      - Geographic proximity
      - User rating / reputation
    Ordered by composite match score (highest first).
    """
    recommendations = await get_recommendations(
        db=db,
        current_user=current_user,
        limit=limit,
        max_distance_km=max_distance_km,
    )
    return {"recommendations": recommendations, "count": len(recommendations)}
