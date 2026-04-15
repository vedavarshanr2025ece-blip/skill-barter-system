"""Barter request endpoints."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_db, get_current_user
from app.crud.crud import (
    create_barter_request,
    get_requests_for_user,
    get_request_by_id,
    update_request_status,
)
from app.schemas.schemas import BarterRequestCreate, BarterRequestOut, BarterRequestStatusUpdate, RequestStatusEnum
from app.services.websockets import manager

router = APIRouter()

@router.post("/", response_model=BarterRequestOut, status_code=status.HTTP_201_CREATED)
async def create_request(
    request_in: BarterRequestCreate,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Send a barter request to another user."""
    if request_in.receiver_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot send a request to yourself.")
    barter_req = await create_barter_request(db, sender_id=current_user["id"], request_in=request_in)

    # Real-time notification to receiver
    await manager.send_personal_message(
        {
            "type": "NEW_REQUEST",
            "data": {
                "request_id": str(barter_req["id"]),
                "sender_username": current_user["username"],
            },
        },
        user_id=str(request_in.receiver_id),
    )
    return barter_req


@router.get("/", response_model=List[BarterRequestOut])
async def list_requests(
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Fetch all inbound and outbound requests for the authenticated user."""
    return await get_requests_for_user(db, current_user["id"])


@router.get("/{request_id}", response_model=BarterRequestOut)
async def get_request(
    request_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Fetch a single barter request by ID (must be a participant)."""
    req = await get_request_by_id(db, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    if req["sender_id"] != current_user["id"] and req["receiver_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied.")
    return req


@router.patch("/{request_id}/status", response_model=BarterRequestOut)
async def update_status(
    request_id: str,
    status_update: BarterRequestStatusUpdate,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Accept, reject, or cancel a barter request."""
    req = await get_request_by_id(db, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")

    # Only receiver can accept/reject; sender can cancel
    if status_update.status in (RequestStatusEnum.ACCEPTED, RequestStatusEnum.REJECTED):
        if req["receiver_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only the receiver can accept or reject.")
    elif status_update.status == RequestStatusEnum.CANCELLED:
        if req["sender_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only the sender can cancel.")

    updated = await update_request_status(db, request_id, status_update.status)

    # Notify the other party
    notify_user_id = str(req["sender_id"]) if current_user["id"] == req["receiver_id"] else str(req["receiver_id"])
    await manager.send_personal_message(
        {
            "type": "REQUEST_STATUS_UPDATED",
            "data": {
                "request_id": str(request_id),
                "new_status": status_update.status.value,
            },
        },
        user_id=notify_user_id,
    )
    return updated
