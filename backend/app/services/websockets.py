"""
WebSocket Connection Manager.
Manages active connections and handles broadcasting messages to specific users.
"""
from typing import Dict, List
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages active WebSocket connections per user.
    Supports multiple connections per user (e.g., multiple tabs).
    """

    def __init__(self):
        # Maps user_id (str) -> list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a connection and register it."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a specific connection for a user."""
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected.")

    async def send_personal_message(self, message: dict, user_id: str):
        """
        Send a JSON message to all active connections of a specific user.
        Dead connections are removed silently.
        """
        if user_id not in self.active_connections:
            return

        dead_connections = []
        for connection in self.active_connections[user_id]:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead, user_id)

    async def broadcast(self, message: dict):
        """Send a message to ALL connected users (admin/system broadcasts)."""
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)

    def is_online(self, user_id: str) -> bool:
        """Check if a user has any active connections."""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0


# Global singleton instance used throughout the app
manager = ConnectionManager()
