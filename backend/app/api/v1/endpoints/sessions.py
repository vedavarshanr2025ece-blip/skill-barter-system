"""Session scheduling, completion, and review endpoints."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_db, get_current_user
from app.crud.crud import (
    create_session,
    get_session_by_id,
    complete_session,
    create_review,
    get_request_by_id,
)
from app.schemas.schemas import RequestStatusEnum, SessionStatusEnum, SessionCreate, SessionOut, ReviewCreate, ReviewOut
from app.services.websockets import manager

router = APIRouter()

@router.post("/", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def schedule_session(
    session_in: SessionCreate,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Schedule a session for an accepted barter request.
    Only participants of the accepted request can create a session.
    """
    req = await get_request_by_id(db, session_in.request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    if req["status"] != RequestStatusEnum.ACCEPTED.value:
        raise HTTPException(status_code=400, detail="Request must be ACCEPTED before scheduling a session.")
    if current_user["id"] not in (req["sender_id"], req["receiver_id"]):
        raise HTTPException(status_code=403, detail="Access denied.")

    session = await create_session(db, session_in)
    return session


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Fetch a session by ID."""
    session = await get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return session

@router.post("/{session_id}/complete", response_model=SessionOut)
async def mark_session_complete(
    session_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Mark a session as completed.
    This triggers the credit ledger transaction for the involved users.
    Both parties must call this endpoint; credits transfer upon the second call.
    """
    session = await get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session["status"] == SessionStatusEnum.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Session already completed.")

    updated_session = await complete_session(db, session_id, current_user["id"])

    # Notify both participants
    req = await get_request_by_id(db, session["request_id"])
    for uid in [str(req["sender_id"]), str(req["receiver_id"])]:
        await manager.send_personal_message(
            {"type": "SESSION_COMPLETED", "data": {"session_id": str(session_id)}},
            user_id=uid,
        )

    return updated_session


@router.post("/{session_id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def submit_review(
    session_id: str,
    review_in: ReviewCreate,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Submit a review for a completed session."""
    session = await get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session["status"] != SessionStatusEnum.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Can only review completed sessions.")

    review = await create_review(
        db,
        session_id=session_id,
        reviewer_id=current_user["id"],
        review_in=review_in,
    )
    return review
