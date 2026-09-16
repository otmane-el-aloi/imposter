import os
import sys
import socket
import logging
import asyncio
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import qrcode

from backend.connection_manager import manager
from backend.game_manager import game_manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("imposter.server")

import re
import subprocess

def get_local_ip() -> str:
    """
    Detects the active Local Network IPv4 address (e.g. 172.20.10.x for iPhone Hotspot,
    192.168.x.x for Home Wi-Fi / Android Hotspot).
    Works 100% offline without internet.
    """
    # 1. Allow manual override via environment variable
    if os.environ.get("HOST_IP"):
        return os.environ["HOST_IP"].strip()

    candidates = []

    # 2. Parse system ifconfig output (macOS / Linux)
    try:
        out = subprocess.check_output(["ifconfig"], text=True)
        for match in re.finditer(r'inet\s+(\d+\.\d+\.\d+\.\d+)\s+netmask', out):
            ip = match.group(1)
            # Skip loopback and carrier-grade CGNAT (100.64.0.0/10 often used by VPNs)
            if ip.startswith("127.") or ip.startswith("100.64."):
                continue
            # Prioritize standard private subnets
            # iPhone Hotspot is 172.20.10.x; Android / Wi-Fi is 192.168.x.x; Router is 10.x.x.x
            if ip.startswith("172.") or ip.startswith("192.168.") or ip.startswith("10."):
                candidates.append(ip)
    except Exception as e:
        logger.warning(f"ifconfig scan error: {e}")

    # 3. Try route socket probes to common hotspot gateways
    gateways = ["172.20.10.1", "192.168.1.1", "192.168.43.1", "10.0.0.1", "8.8.8.8"]
    for gw in gateways:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect((gw, 80))
            ip = s.getsockname()[0]
            if ip and not ip.startswith("127.") and not ip.startswith("100.64."):
                if ip not in candidates:
                    candidates.append(ip)
                break
        except Exception:
            pass
        finally:
            s.close()

    # Prioritize 172.20.10.x (iOS hotspot) and 192.168.x.x (Android hotspot / Wi-Fi)
    for ip in candidates:
        if ip.startswith("172.20.10."):  # iPhone Hotspot
            return ip
    for ip in candidates:
        if ip.startswith("192.168."):    # Wi-Fi / Android Hotspot
            return ip
    for ip in candidates:
        if ip.startswith("172.") or ip.startswith("10."):
            return ip

    return candidates[0] if candidates else "127.0.0.1"


def print_terminal_qr(url: str):
    """Prints a clear ASCII QR code directly into the host terminal."""
    try:
        qr = qrcode.QRCode(border=1)
        qr.add_data(url)
        qr.make(fit=True)
        print("\n" + "=" * 60)
        print("  🕵️‍♂️  IMPOSTER PARTY GAME - LOCAL NETWORK SERVER  🕵️‍♂️")
        print("=" * 60)
        print(f"\n📱 Scan this QR code on phones/tablets on the same Wi-Fi:\n")
        qr.print_ascii(invert=True)
        print(f"\n🌐 Direct URL for other devices:  {url}")
        print(f"💻 Direct URL on this computer:   http://localhost:8000")
        print("=" * 60 + "\n")
    except Exception as e:
        print(f"Could not print ASCII QR: {e}")

PORT = int(os.environ.get("PORT", 8000))
LOCAL_IP = get_local_ip()
SERVER_URL = f"http://{LOCAL_IP}:{PORT}"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print_terminal_qr(SERVER_URL)
    yield
    # Shutdown
    logger.info("Server shutting down...")

app = FastAPI(title="Imposter Game Server", lifespan=lifespan)

# Enable CORS for local dev Vite client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/network-info")
async def get_network_info():
    """Returns local network details for client QR code rendering."""
    return {
        "local_ip": LOCAL_IP,
        "port": PORT,
        "server_url": SERVER_URL,
        "is_offline_capable": True
    }

async def handle_bot_turns_and_actions(room_code: str):
    """Handles automated bot actions for clues, voting, and imposter steal guessing."""
    room = game_manager.get_room(room_code)
    if not room:
        return

    # 1. If in CLUE_TURNS and active player is a bot -> wait 2 seconds and auto-advance!
    if room.phase == "CLUE_TURNS" and room.is_active_player_bot():
        await asyncio.sleep(2)
        r = game_manager.get_room(room_code)
        if r and r.phase == "CLUE_TURNS" and r.is_active_player_bot():
            if r.settings.get("clue_mode") == "silent":
                alive_turns = [pid for pid in r.turn_order if not r.players[pid].is_eliminated and r.players[pid].is_connected]
                if alive_turns and r.current_turn_index < len(alive_turns):
                    active_id = alive_turns[r.current_turn_index]
                    bot_player = r.players[active_id]
                    clue = r.generate_bot_clue(bot_player)
                    r.submit_clue(active_id, clue)
                else:
                    r.next_turn()
            else:
                r.next_turn()

            if r.phase == "VOTING":
                r.auto_cast_bot_votes()
                if r.all_votes_submitted():
                    r.tally_votes()
                    if r.phase == "IMPOSTER_STEAL":
                        asyncio.create_task(handle_bot_turns_and_actions(room_code))
            await broadcast_room_state(room_code)
            if r.phase == "CLUE_TURNS" and r.is_active_player_bot():
                asyncio.create_task(handle_bot_turns_and_actions(room_code))

    # 2. If in IMPOSTER_STEAL and eliminated player is a bot -> wait 2 seconds and guess!
    elif room.phase == "IMPOSTER_STEAL":
        eliminated = room.players.get(room.eliminated_player_id)
        if eliminated and eliminated.is_bot:
            await asyncio.sleep(2)
            r = game_manager.get_room(room_code)
            if r and r.phase == "IMPOSTER_STEAL":
                r.auto_bot_steal()
                await broadcast_room_state(room_code)

async def broadcast_room_state(room_code: str):
    room = game_manager.get_room(room_code)
    if not room:
        return
    await manager.broadcast_sanitized_state(
        room_code,
        lambda client_id: {
            "type": "state_update",
            "state": room.get_sanitized_state(client_id)
        }
    )

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(client_id, websocket)
    try:
        # Check if reconnecting to an existing room
        existing_room = game_manager.find_player_room(client_id)
        if existing_room:
            manager.join_room(existing_room.room_code, client_id)
            existing_room.reconnect_player(client_id)
            await broadcast_room_state(existing_room.room_code)

        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            room_code = data.get("room_code", "").upper().strip()
            
            if action == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            elif action == "create_room":
                name = data.get("name", "Host").strip() or "Host"
                avatar = data.get("avatar", "🦊")
                room = game_manager.create_room(client_id)
                room.add_player(client_id, name, avatar)
                manager.join_room(room.room_code, client_id)
                await broadcast_room_state(room.room_code)

            elif action == "join_room":
                room = game_manager.get_room(room_code)
                if not room:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Room '{room_code}' not found. Please check the 4-letter code."
                    })
                    continue
                
                name = data.get("name", "Player").strip() or "Player"
                avatar = data.get("avatar", "🦊")
                
                # Check if this player is rejoining or new
                if client_id in room.players:
                    room.reconnect_player(client_id)
                    room.players[client_id].name = name
                    room.players[client_id].avatar = avatar
                else:
                    if room.phase != "LOBBY":
                        await websocket.send_json({
                            "type": "error",
                            "message": "Game is already in progress in this room."
                        })
                        continue
                    room.add_player(client_id, name, avatar)

                manager.join_room(room.room_code, client_id)
                await broadcast_room_state(room.room_code)

            elif action == "add_bot":
                room = game_manager.get_room(room_code)
                if room and room.host_id == client_id and room.phase == "LOBBY":
                    room.add_bot()
                    await broadcast_room_state(room.room_code)

            elif action == "remove_bot":
                room = game_manager.get_room(room_code)
                if room and room.host_id == client_id and room.phase == "LOBBY":
                    bot_id = data.get("bot_id")
                    room.remove_bot(bot_id)
                    await broadcast_room_state(room.room_code)

            elif action == "update_settings":
                room = game_manager.get_room(room_code)
                if room and room.host_id == client_id:
                    new_settings = data.get("settings", {})
                    room.settings.update(new_settings)
                    await broadcast_room_state(room.room_code)

            elif action == "start_game":
                room = game_manager.get_room(room_code)
                if room and room.host_id == client_id:
                    success = room.start_game()
                    if not success:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Need at least 3 players to start the game. (Tip: Use '+ Add Bot' to fill slots!)"
                        })
                        continue
                    await broadcast_room_state(room.room_code)

            elif action == "mark_role_seen":
                room = game_manager.get_room(room_code)
                if room:
                    room.mark_role_seen(client_id)
                    await broadcast_room_state(room.room_code)

            elif action == "advance_to_clues":
                room = game_manager.get_room(room_code)
                if room and room.host_id == client_id:
                    room.advance_to_clues()
                    await broadcast_room_state(room.room_code)
                    if room.is_active_player_bot():
                        asyncio.create_task(handle_bot_turns_and_actions(room.room_code))

            elif action == "next_turn":
                room = game_manager.get_room(room_code)
                if room:
                    # Allow active player or host to advance turn
                    room.next_turn()
                    if room.phase == "VOTING":
                        room.auto_cast_bot_votes()
                        if room.all_votes_submitted():
                            room.tally_votes()
                            if room.phase == "IMPOSTER_STEAL":
                                asyncio.create_task(handle_bot_turns_and_actions(room.room_code))
                    await broadcast_room_state(room.room_code)
                    if room.phase == "CLUE_TURNS" and room.is_active_player_bot():
                        asyncio.create_task(handle_bot_turns_and_actions(room.room_code))

            elif action == "submit_clue":
                room = game_manager.get_room(room_code)
                clue = data.get("clue", "")
                if room:
                    success = room.submit_clue(client_id, clue)
                    if success:
                        if room.phase == "VOTING":
                            room.auto_cast_bot_votes()
                            if room.all_votes_submitted():
                                room.tally_votes()
                                if room.phase == "IMPOSTER_STEAL":
                                    asyncio.create_task(handle_bot_turns_and_actions(room.room_code))
                        await broadcast_room_state(room.room_code)
                        if room.phase == "CLUE_TURNS" and room.is_active_player_bot():
                            asyncio.create_task(handle_bot_turns_and_actions(room.room_code))

            elif action == "reaction":
                room = game_manager.get_room(room_code)
                emoji = data.get("emoji", "🧐")
                if room and client_id in room.players:
                    sender = room.players[client_id]
                    await manager.broadcast_to_room(
                        room.room_code,
                        {
                            "type": "reaction",
                            "player_id": client_id,
                            "player_name": sender.name,
                            "avatar": sender.avatar,
                            "emoji": emoji
                        }
                    )

            elif action == "vote":
                room = game_manager.get_room(room_code)
                target_id = data.get("target_id")
                if room and target_id:
                    room.cast_vote(client_id, target_id)
                    room.auto_cast_bot_votes()
                    if room.all_votes_submitted():
                        room.tally_votes()
                        if room.phase == "IMPOSTER_STEAL":
                            asyncio.create_task(handle_bot_turns_and_actions(room.room_code))
                    await broadcast_room_state(room.room_code)

            elif action == "imposter_steal":
                room = game_manager.get_room(room_code)
                guess = data.get("guess", "")
                if room and room.eliminated_player_id == client_id:
                    room.imposter_steal_guess(guess)
                    await broadcast_room_state(room.room_code)

            elif action == "play_again":
                room = game_manager.get_room(room_code)
                if room and room.host_id == client_id:
                    room.reset_for_next_round()
                    await broadcast_room_state(room.room_code)

    except WebSocketDisconnect:
        room_code = manager.disconnect(client_id)
        if room_code:
            room = game_manager.get_room(room_code)
            if room:
                room.remove_or_disconnect_player(client_id)
                await broadcast_room_state(room_code)
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
        room_code = manager.disconnect(client_id)
        if room_code:
            await broadcast_room_state(room_code)

# Mount static files (React SPA built in client/dist)
if hasattr(sys, '_MEIPASS'):
    CLIENT_DIST = os.path.join(getattr(sys, '_MEIPASS'), "client", "dist")
else:
    CLIENT_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "client", "dist")

if os.path.exists(CLIENT_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(CLIENT_DIST, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(CLIENT_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(CLIENT_DIST, "index.html"))
else:
    @app.get("/")
    async def index_placeholder():
        return JSONResponse({
            "status": "Imposter backend running",
            "network_url": SERVER_URL,
            "message": "Frontend not yet built. Run 'npm run build' inside client/."
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
