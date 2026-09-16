from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_rounds_of_clues_setting():
    with client.websocket_connect("/ws/client_host_settings") as ws:
        # 1. Create Room
        ws.send_json({"action": "create_room", "name": "Host", "avatar": "🦊"})
        room_code = ws.receive_json()["state"]["room_code"]

        # 2. Update rounds_of_clues setting to 2
        ws.send_json({
            "action": "update_settings",
            "room_code": room_code,
            "settings": {"rounds_of_clues": 2, "clue_timer_seconds": 45}
        })
        state = ws.receive_json()["state"]
        assert state["settings"]["rounds_of_clues"] == 2
        assert state["settings"]["clue_timer_seconds"] == 45
        print("[PASS] Settings updated: rounds_of_clues = 2, timer = 45s")

        # 3. Add 2 bots to reach 3 players
        ws.send_json({"action": "add_bot", "room_code": room_code})
        ws.receive_json()
        ws.send_json({"action": "add_bot", "room_code": room_code})
        ws.receive_json()

        # 4. Start game & advance to clues
        ws.send_json({"action": "start_game", "room_code": room_code})
        ws.receive_json()
        ws.send_json({"action": "advance_to_clues", "room_code": room_code})
        state_clues = ws.receive_json()["state"]
        assert state_clues["phase"] == "CLUE_TURNS"
        assert state_clues["clue_cycle"] == 1
        print("[PASS] Clue cycle 1 started")

        # 5. Advance 3 turns (one per player)
        for _ in range(3):
            ws.send_json({"action": "next_turn", "room_code": room_code})
            state_clues = ws.receive_json()["state"]

        # After 3 turns, because rounds_of_clues = 2, it should advance to clue_cycle 2!
        assert state_clues["phase"] == "CLUE_TURNS", f"Expected CLUE_TURNS, got {state_clues['phase']}"
        assert state_clues["clue_cycle"] == 2, f"Expected clue_cycle 2, got {state_clues['clue_cycle']}"
        print("[PASS] Clue cycle 2 started (Rounds before voting honored!)")

        # 6. Advance another 3 turns for cycle 2
        for _ in range(3):
            ws.send_json({"action": "next_turn", "room_code": room_code})
            state_clues = ws.receive_json()["state"]

        # Now all 2 cycles are complete -> should transition to VOTING!
        assert state_clues["phase"] == "VOTING"
        print("[PASS] All 2 clue cycles completed -> Transitioned to VOTING!")

if __name__ == "__main__":
    test_rounds_of_clues_setting()
    print("\n🎉 ALL ROUNDS SETTINGS TESTS PASSED!")
