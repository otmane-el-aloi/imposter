import json
import logging
import asyncio
from typing import Dict, Set, Optional, Callable, Any
from fastapi import WebSocket

logger = logging.getLogger("imposter.network")

class ConnectionManager:
    """
    Manages real-time WebSocket connections across local clients.
    Handles per-client unicast, room multicasts, and authoritative state sanitization.
    """
    def __init__(self):
        # Maps client_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        # Maps room_code -> Set of client_ids
        self.room_members: Dict[str, Set[str]] = {}

    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"[WS Connect] Client {client_id} connected. Total active: {len(self.active_connections)}")

    def disconnect(self, client_id: str) -> Optional[str]:
        """Removes connection and returns room_code if client was in a room."""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        
        found_room = None
        for room_code, members in list(self.room_members.items()):
            if client_id in members:
                members.discard(client_id)
                found_room = room_code
                if not members:
                    del self.room_members[room_code]
                break
        logger.info(f"[WS Disconnect] Client {client_id} left room {found_room}")
        return found_room

    def join_room(self, room_code: str, client_id: str):
        if room_code not in self.room_members:
            self.room_members[room_code] = set()
        self.room_members[room_code].add(client_id)
        logger.info(f"[Room Join] Client {client_id} joined room {room_code}")

    def leave_room(self, room_code: str, client_id: str):
        if room_code in self.room_members:
            self.room_members[room_code].discard(client_id)
            if not self.room_members[room_code]:
                del self.room_members[room_code]

    async def send_personal(self, client_id: str, message: dict):
        ws = self.active_connections.get(client_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send message to {client_id}: {e}")

    async def broadcast_to_room(self, room_code: str, message: dict, exclude_client_id: Optional[str] = None):
        members = self.room_members.get(room_code, set())
        for cid in list(members):
            if cid == exclude_client_id:
                continue
            await self.send_personal(cid, message)

    async def broadcast_sanitized_state(self, room_code: str, get_sanitized_payload_fn: Callable[[str], dict]):
        """
        Anti-cheat state broadcaster:
        Generates a custom, sanitized JSON payload for each connected client in the room
        so that secret words or imposter flags are never transmitted over the wire to other players.
        """
        members = self.room_members.get(room_code, set())
        for cid in list(members):
            payload = get_sanitized_payload_fn(cid)
            await self.send_personal(cid, payload)

manager = ConnectionManager()
