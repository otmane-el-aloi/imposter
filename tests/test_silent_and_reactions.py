import asyncio
from fastapi.testclient import TestClient
from backend.main import app, game_manager, manager

client = TestClient(app)

def test_silent_mode_and_reactions():
    with client.websocket_connect("/ws/client_s1") as ws1, \
         client.websocket_connect("/ws/client_s2") as ws2, \
         client.websocket_connect("/ws/client_s3") as ws3:

        # 1. Create Room
        ws1.send_json({"action": "create_room", "name": "AgentAlpha", "avatar": "🦊"})
        state1 = ws1.receive_json()["state"]
        room_code = state1["room_code"]

        # 2. Join Room
        ws2.send_json({"action": "join_room", "room_code": room_code, "name": "AgentBravo", "avatar": "🐼"})
        ws2.receive_json() # self state
        ws1.receive_json() # peer sync

        ws3.send_json({"action": "join_room", "room_code": room_code, "name": "AgentCharlie", "avatar": "🦁"})
        ws3.receive_json() # self state
        ws1.receive_json() # peer sync
        ws2.receive_json() # peer sync

        # 3. Update Settings to Silent Mode
        ws1.send_json({
            "action": "update_settings",
            "room_code": room_code,
            "settings": {"clue_mode": "silent"}
        })
        up1 = ws1.receive_json()["state"]
        up2 = ws2.receive_json()["state"]
        up3 = ws3.receive_json()["state"]

        assert up1["settings"]["clue_mode"] == "silent"
        assert up2["settings"]["clue_mode"] == "silent"
        print("[PASS] Host successfully toggled settings to Silent (Text) Clue Mode")

        # 4. Start Game
        ws1.send_json({"action": "start_game", "room_code": room_code})
        ws1.receive_json()
        ws2.receive_json()
        ws3.receive_json()

        # Mark seen & advance to clues
        ws1.send_json({"action": "mark_role_seen", "room_code": room_code})
        ws1.receive_json()
        ws2.receive_json()
        ws3.receive_json()

        ws1.send_json({"action": "advance_to_clues", "room_code": room_code})
        c_state1 = ws1.receive_json()["state"]
        ws2.receive_json()
        ws3.receive_json()

        assert c_state1["phase"] == "CLUE_TURNS"
        active_id = c_state1["active_turn_player_id"]
        assert active_id in ["client_s1", "client_s2", "client_s3"]
        print(f"[PASS] Entered CLUE_TURNS phase, active turn: {active_id}")

        # 5. Quick Reactions test
        ws2.send_json({"action": "reaction", "room_code": room_code, "emoji": "🧐"})
        r1 = ws1.receive_json()
        r2 = ws2.receive_json()
        r3 = ws3.receive_json()

        assert r1["type"] == "reaction"
        assert r1["emoji"] == "🧐"
        assert r1["player_name"] == "AgentBravo"
        assert r2["type"] == "reaction" and r2["emoji"] == "🧐"
        assert r3["type"] == "reaction" and r3["emoji"] == "🧐"
        print("[PASS] Quick Reaction '🧐' broadcast received by all connected peers in room!")

        # 6. Silent Clue Submission test
        active_ws = ws1 if active_id == "client_s1" else (ws2 if active_id == "client_s2" else ws3)
        active_ws.send_json({
            "action": "submit_clue",
            "room_code": room_code,
            "clue": "Mysterious Coffee"
        })

        s_state1 = ws1.receive_json()["state"]
        ws2.receive_json()
        ws3.receive_json()

        assert len(s_state1["clue_history"]) == 1
        clue_record = s_state1["clue_history"][0]
        assert clue_record["player_id"] == active_id
        assert clue_record["clue"] == "Mysterious Coffee"
        assert clue_record["cycle"] == 1
        print(f"[PASS] Text clue submitted and stored in clue_history: '{clue_record['clue']}' by {clue_record['player_name']}")

        # 7. Test bot auto-clue generation in silent mode
        room = game_manager.get_room(room_code)
        room.add_bot()
        bot_id = [p.client_id for p in room.players.values() if p.is_bot][0]
        bot_player = room.players[bot_id]
        bot_clue = room.generate_bot_clue(bot_player)
        assert isinstance(bot_clue, str) and len(bot_clue) > 0
        print(f"[PASS] Bot generated intelligent clue: '{bot_clue}'")

        print("\n🎉 SILENT MODE AND QUICK REACTIONS TESTS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    test_silent_mode_and_reactions()
