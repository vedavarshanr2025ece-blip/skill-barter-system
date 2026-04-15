"""WebSocket endpoint: real-time notifications per authenticated user."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from jose import JWTError, jwt

from app.core.config import settings
from app.services.websockets import manager

router = APIRouter()


@router.websocket("/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token passed as query param"),
):
    """
    WebSocket endpoint for real-time notifications.

    Client connects with:
      ws://localhost:8000/api/v1/ws/notifications?token=<JWT>

    Receives JSON payloads:
      {"type": "NEW_REQUEST", "data": {...}}
      {"type": "REQUEST_STATUS_UPDATED", "data": {...}}
      {"type": "SESSION_COMPLETED", "data": {...}}
    """
    # Validate JWT token from query param
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, user_id)
    try:
        # Keep the connection alive — wait for any client messages (heartbeat/ping)
        while True:
            data = await websocket.receive_text()
            # Echo back pings to keep the connection alive
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
