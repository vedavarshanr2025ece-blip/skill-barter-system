"""Aggregates all v1 API routers."""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, skills, requests, sessions, matches, ws

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(skills.router, prefix="/skills", tags=["Skills"])
api_router.include_router(requests.router, prefix="/requests", tags=["Barter Requests"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Sessions & Reviews"])
api_router.include_router(matches.router, prefix="/matches", tags=["AI Matching"])
api_router.include_router(ws.router, prefix="/ws", tags=["WebSocket"])
