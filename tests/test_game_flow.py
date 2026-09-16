import asyncio
from fastapi.testclient import TestClient
from backend.main import app, game_manager, manager

client = TestClient(app)

def test_static_and_network_endpoints():
    # 1. Test Network Info Endpoint
    res = client.get("/api/network-info")
    assert res.status_code == 200
    data = res.json()
    assert "local_ip" in data
    assert "server_url" in data
    assert data["port"] == 8000
    print("[PASS] /api/network-info returns correct LAN data:", data["server_url"])

    # 2. Test SPA index delivery
    res = client.get("/")
    assert res.status_code == 200
    assert "<!doctype html>" in res.text.lower()
    assert "IMPOSTER" in res.text
    print("[PASS] GET / serves built SPA index.html")

def test_websocket_multiplayer_game_loop():
    with client.websocket_connect("/ws/client_host") as ws_host, \
         client.websocket_connect("/ws/client_p2") as ws_p2, \
         client.websocket_connect("/ws/client_p3") as ws_p3:

        # 1. Host creates room
        ws_host.send_json({"action": "create_room", "name": "HostPlayer", "avatar": "🦊"})
        msg_host = ws_host.receive_json()
        assert msg_host["type"] == "state_update"
        room_code = msg_host["state"]["room_code"]
        assert len(room_code) == 4
        print(f"[PASS] Room created successfully with code: {room_code}")

        # 2. Player 2 joins room
        ws_p2.send_json({"action": "join_room", "room_code": room_code, "name": "PlayerTwo", "avatar": "🐼"})
        msg_p2 = ws_p2.receive_json()
        assert msg_p2["type"] == "state_update"
        assert len(msg_p2["state"]["players"]) == 2
        
        # Host also receives update for P2 join
        msg_host_sync = ws_host.receive_json()
        assert len(msg_host_sync["state"]["players"]) == 2
        print("[PASS] Player 2 joined and state synchronized across peers")

        # 3. Player 3 joins room
        ws_p3.send_json({"action": "join_room", "room_code": room_code, "name": "PlayerThree", "avatar": "🦁"})
        msg_p3 = ws_p3.receive_json()
        assert msg_p3["type"] == "state_update"
        assert len(msg_p3["state"]["players"]) == 3
        ws_host.receive_json() # host sync
        ws_p2.receive_json()   # p2 sync
        print("[PASS] Player 3 joined (3 players in room)")

        # 4. Host starts the game
        ws_host.send_json({"action": "start_game", "room_code": room_code})
        
        state_host = ws_host.receive_json()["state"]
        state_p2 = ws_p2.receive_json()["state"]
        state_p3 = ws_p3.receive_json()["state"]

        assert state_host["phase"] == "ROLE_REVEAL"
        assert state_p2["phase"] == "ROLE_REVEAL"
        assert state_p3["phase"] == "ROLE_REVEAL"

        # ANTI-CHEAT VALIDATION: Verify information hiding over the wire!
        states = [state_host, state_p2, state_p3]
        roles = [s["my_role"] for s in states]
        imposters = [s for s in states if s["my_role"] == "IMPOSTER"]
        civilians = [s for s in states if s["my_role"] == "CIVILIAN"]

        assert len(imposters) == 1, f"Expected 1 imposter, got {len(imposters)}"
        assert len(civilians) == 2, f"Expected 2 civilians, got {len(civilians)}"

        # Verify that civilians DO NOT receive all_roles or civilian_word/imposter_word during game!
        for civ in civilians:
            assert civ["all_roles"] == {}, "Civilian must not know other players' roles!"
            assert civ["civilian_word"] is None, "Civilian word reveal must be None during active game!"
            assert civ["imposter_word"] is None, "Imposter word must not be leaked to civilians!"
        print("[PASS] Anti-cheat verification passed: Wire payloads are strictly sanitized per client!")

        # 5. Players mark role seen
        ws_host.send_json({"action": "mark_role_seen", "room_code": room_code})
        ws_host.receive_json()
        ws_p2.receive_json()
        ws_p3.receive_json()

        # 6. Host advances to clue turns
        ws_host.send_json({"action": "advance_to_clues", "room_code": room_code})
        state_turns = ws_host.receive_json()["state"]
        ws_p2.receive_json()
        ws_p3.receive_json()
        assert state_turns["phase"] == "CLUE_TURNS"
        assert state_turns["active_turn_player_id"] is not None
        print(f"[PASS] Clue turns started, active speaker: {state_turns['active_turn_player_id']}")

        # 7. Advance turn to next players until voting
        ws_host.send_json({"action": "next_turn", "room_code": room_code})
        ws_host.receive_json(); ws_p2.receive_json(); ws_p3.receive_json()
        ws_host.send_json({"action": "next_turn", "room_code": room_code})
        ws_host.receive_json(); ws_p2.receive_json(); ws_p3.receive_json()
        ws_host.send_json({"action": "next_turn", "room_code": room_code})
        state_voting = ws_host.receive_json()["state"]
        ws_p2.receive_json(); ws_p3.receive_json()
        assert state_voting["phase"] == "VOTING"
        print("[PASS] Clue turns completed -> Transitioned to VOTING phase")

        # 8. Players vote for the imposter
        imposter_client_id = imposters[0]["viewer_id"]
        # All 3 vote for the imposter
        ws_host.send_json({"action": "vote", "room_code": room_code, "target_id": imposter_client_id})
        ws_host.receive_json(); ws_p2.receive_json(); ws_p3.receive_json()
        ws_p2.send_json({"action": "vote", "room_code": room_code, "target_id": imposter_client_id})
        ws_host.receive_json(); ws_p2.receive_json(); ws_p3.receive_json()
        ws_p3.send_json({"action": "vote", "room_code": room_code, "target_id": imposter_client_id})
        
        # When all votes in -> tallies and eliminates imposter -> IMPOSTER_STEAL phase
        state_steal = ws_host.receive_json()["state"]
        ws_p2.receive_json(); ws_p3.receive_json()
        assert state_steal["phase"] == "IMPOSTER_STEAL"
        assert state_steal["eliminated_player_id"] == imposter_client_id
        print("[PASS] Imposter caught! Transitioned to IMPOSTER_STEAL phase")

        # 9. Imposter attempts guess (wrong guess)
        imposter_ws = ws_host if imposter_client_id == "client_host" else (ws_p2 if imposter_client_id == "client_p2" else ws_p3)
        imposter_ws.send_json({"action": "imposter_steal", "room_code": room_code, "guess": "WrongGuess123"})
        
        state_final = ws_host.receive_json()["state"]
        ws_p2.receive_json(); ws_p3.receive_json()
        assert state_final["phase"] == "REVEAL_RESULT"
        assert state_final["winner"] == "CIVILIANS"
        assert state_final["civilian_word"] is not None
        assert state_final["imposter_word"] is not None
        print(f"[PASS] Winner declared: {state_final['winner']}! Words revealed: Civilian='{state_final['civilian_word']}', Imposter='{state_final['imposter_word']}'")

if __name__ == "__main__":
    test_static_and_network_endpoints()
    test_websocket_multiplayer_game_loop()
    print("\n🎉 ALL TESTS PASSED PERFECTLY!")
