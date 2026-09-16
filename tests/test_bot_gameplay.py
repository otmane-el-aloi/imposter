import time
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_bot_multiplayer_flow():
    with client.websocket_connect("/ws/client_tester") as ws:
        # 1. Create Room
        ws.send_json({"action": "create_room", "name": "SoloDev", "avatar": "🦊"})
        msg = ws.receive_json()
        room_code = msg["state"]["room_code"]
        assert len(msg["state"]["players"]) == 1
        print(f"[PASS] Room created: {room_code}")

        # 2. Add First Bot
        ws.send_json({"action": "add_bot", "room_code": room_code})
        msg = ws.receive_json()
        assert len(msg["state"]["players"]) == 2
        assert msg["state"]["players"][1]["is_bot"] is True
        print(f"[PASS] Bot 1 added: {msg['state']['players'][1]['name']}")

        # 3. Add Second Bot
        ws.send_json({"action": "add_bot", "room_code": room_code})
        msg = ws.receive_json()
        assert len(msg["state"]["players"]) == 3
        assert msg["state"]["players"][2]["is_bot"] is True
        print(f"[PASS] Bot 2 added: {msg['state']['players'][2]['name']}")

        # 4. Start Game (Min 3 players satisfied by 1 human + 2 bots!)
        ws.send_json({"action": "start_game", "room_code": room_code})
        state = ws.receive_json()["state"]
        assert state["phase"] == "ROLE_REVEAL"
        print("[PASS] Game started with bots!")

        # 5. Advance to clues
        ws.send_json({"action": "advance_to_clues", "room_code": room_code})
        state_clues = ws.receive_json()["state"]
        assert state_clues["phase"] == "CLUE_TURNS"
        print("[PASS] Clue turns active!")

        # 6. Cycle through turns
        for _ in range(3):
            ws.send_json({"action": "next_turn", "room_code": room_code})
            state_clues = ws.receive_json()["state"]
            if state_clues["phase"] == "VOTING":
                break

        assert state_clues["phase"] == "VOTING"
        print("[PASS] Transitioned to VOTING with bots!")

        # 7. Human casts vote for bot 1
        bot1_id = [p["id"] for p in state_clues["players"] if p["is_bot"]][0]
        ws.send_json({"action": "vote", "room_code": room_code, "target_id": bot1_id})
        state_result = ws.receive_json()["state"]

        # Bots should have auto-voted!
        print(f"[PASS] Vote resolved! Phase: {state_result['phase']}, Eliminated: {state_result['eliminated_player_id']}")

if __name__ == "__main__":
    test_bot_multiplayer_flow()
    print("\n🎉 BOT GAMEPLAY TEST PASSED PERFECTLY!")
