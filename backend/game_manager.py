import json
import random
import string
import os
import sys
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

if hasattr(sys, '_MEIPASS'):
    WORDS_DIR = os.path.join(getattr(sys, '_MEIPASS'), "backend", "words")
else:
    WORDS_DIR = os.path.join(os.path.dirname(__file__), "words")

def load_word_pack(lang: str = "en") -> List[dict]:
    filepath = os.path.join(WORDS_DIR, f"{lang}.json")
    if not os.path.exists(filepath):
        filepath = os.path.join(WORDS_DIR, "en.json")
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return [
            { "category": "Food & Drinks", "civilian": "Coffee", "imposter": "Tea", "hint": "Beverage" }
        ]

class Player:
    def __init__(self, client_id: str, name: str, avatar: str = "detective", is_host: bool = False, is_bot: bool = False):
        self.client_id = client_id
        self.name = name
        self.avatar = avatar
        self.is_host = is_host
        self.is_bot = is_bot
        self.is_connected = True
        self.score = 0
        
        # Round-specific state
        self.role: str = "CIVILIAN"   # CIVILIAN, IMPOSTER, MR_WHITE
        self.word: str = ""
        self.has_seen_role: bool = False
        self.voted_for: Optional[str] = None  # client_id of target
        self.is_eliminated: bool = False

    def to_public_dict(self) -> dict:
        """Returns safe player info visible to everyone during gameplay."""
        return {
            "id": self.client_id,
            "name": self.name,
            "avatar": self.avatar,
            "is_host": self.is_host,
            "is_bot": self.is_bot,
            "is_connected": self.is_connected,
            "score": self.score,
            "has_seen_role": self.has_seen_role,
            "has_voted": self.voted_for is not None,
            "is_eliminated": self.is_eliminated
        }

class GameRoom:
    def __init__(self, room_code: str, host_id: str):
        self.room_code = room_code
        self.host_id = host_id
        self.players: Dict[str, Player] = {}
        
        # Settings
        self.settings = {
            "mode": "undercover",      # "undercover" (similar word) or "chameleon" (no word, hint only)
            "clue_mode": "voice",      # "voice" (speak aloud) or "silent" (in-app text)
            "language": "en",          # "en" or "fr"
            "imposter_count": 1,       # 1 or 2
            "mr_white_enabled": False, # 1 player has no clues at all
            "clue_timer_seconds": 30,  # Turn timer (0 = untimed)
            "rounds_of_clues": 1       # Number of clue loops before voting
        }
        
        # State machine
        # LOBBY -> ROLE_REVEAL -> CLUE_TURNS -> VOTING -> REVEAL_RESULT -> IMPOSTER_STEAL -> ROUND_OVER
        self.phase: str = "LOBBY"
        self.round_number: int = 0
        self.clue_history: List[dict] = []
        self.current_word_pair: Optional[dict] = None
        self.civilian_word: str = ""
        self.imposter_word: str = ""
        self.category: str = ""
        self.hint: str = ""
        
        # Turn tracking
        self.turn_order: List[str] = [] # list of client_ids
        self.current_turn_index: int = 0
        self.current_clue_cycle: int = 1
        
        # Results
        self.eliminated_player_id: Optional[str] = None
        self.winner: Optional[str] = None # "CIVILIANS", "IMPOSTER", "MR_WHITE"
        self.imposter_guess: Optional[str] = None
        self.imposter_guess_correct: Optional[bool] = None
        self.vote_counts: Dict[str, int] = {}

    def add_player(self, client_id: str, name: str, avatar: str = "detective") -> Player:
        is_host = (client_id == self.host_id) or (len(self.players) == 0)
        if is_host:
            self.host_id = client_id
        player = Player(client_id, name, avatar, is_host=is_host)
        self.players[client_id] = player
        return player

    def add_bot(self) -> Optional[Player]:
        bot_names = ["Bot Sherlock", "Bot Watson", "Bot Poirot", "Bot Marple", "Bot Clouseau"]
        existing_names = {p.name for p in self.players.values()}
        available_names = [n for n in bot_names if n not in existing_names]
        name = available_names[0] if available_names else f"Bot {len(self.players) + 1}"
        bot_id = f"bot_{random.randint(1000, 9999)}"
        player = Player(bot_id, name, avatar="cyborg", is_host=False, is_bot=True)
        self.players[bot_id] = player
        return player

    def remove_bot(self, bot_id: Optional[str] = None):
        if bot_id and bot_id in self.players and self.players[bot_id].is_bot:
            del self.players[bot_id]
        else:
            # remove last added bot
            for pid, p in list(reversed(list(self.players.items()))):
                if p.is_bot:
                    del self.players[pid]
                    break

    def remove_or_disconnect_player(self, client_id: str):
        if client_id in self.players:
            if self.phase == "LOBBY":
                del self.players[client_id]
                # Reassign host if host left
                if client_id == self.host_id and self.players:
                    new_host_id = next(iter(self.players))
                    self.host_id = new_host_id
                    self.players[new_host_id].is_host = True
            else:
                # During game, mark disconnected to allow reconnection
                self.players[client_id].is_connected = False

    def reconnect_player(self, client_id: str):
        if client_id in self.players:
            self.players[client_id].is_connected = True

    def start_game(self) -> bool:
        active_players = [p for p in self.players.values() if p.is_connected]
        if len(active_players) < 3:
            return False  # Minimum 3 players required

        self.round_number += 1
        self.phase = "ROLE_REVEAL"
        self.clue_history = []
        self.imposter_guess = None
        self.imposter_guess_correct = None
        self.winner = None
        self.eliminated_player_id = None
        self.vote_counts = {}

        # Reset per-round player flags
        for p in self.players.values():
            p.role = "CIVILIAN"
            p.word = ""
            p.has_seen_role = p.is_bot  # Bots automatically memorize role
            p.voted_for = None
            p.is_eliminated = False

        # Load words and select random pair
        pack = load_word_pack(self.settings["language"])
        pair = random.choice(pack)
        self.current_word_pair = pair
        self.category = pair.get("category", "General")
        self.hint = pair.get("hint", "")
        self.civilian_word = pair["civilian"]
        self.imposter_word = pair["imposter"]

        # Assign roles
        player_ids = [p.client_id for p in active_players]
        random.shuffle(player_ids)

        imposter_count = min(self.settings["imposter_count"], len(player_ids) // 2)
        imposter_ids = player_ids[:imposter_count]
        remaining = player_ids[imposter_count:]

        mr_white_id = None
        if self.settings["mr_white_enabled"] and len(remaining) >= 2:
            mr_white_id = remaining.pop()

        for pid in player_ids:
            p = self.players[pid]
            if pid in imposter_ids:
                p.role = "IMPOSTER"
                if self.settings["mode"] == "undercover":
                    p.word = self.imposter_word
                else:  # chameleon mode: imposter has no word, just category
                    p.word = "???"
            elif pid == mr_white_id:
                p.role = "MR_WHITE"
                p.word = "???"
            else:
                p.role = "CIVILIAN"
                p.word = self.civilian_word

        # Shuffle turn order for clues
        self.turn_order = [pid for pid in player_ids]
        random.shuffle(self.turn_order)
        self.current_turn_index = 0
        self.current_clue_cycle = 1

        return True

    def mark_role_seen(self, client_id: str):
        if client_id in self.players:
            self.players[client_id].has_seen_role = True

    def all_roles_seen(self) -> bool:
        active = [p for p in self.players.values() if p.is_connected and not p.is_eliminated]
        return all(p.has_seen_role for p in active)

    def advance_to_clues(self):
        self.phase = "CLUE_TURNS"
        self.current_turn_index = 0
        self.current_clue_cycle = 1

    def next_turn(self):
        """Advances to the next player's clue turn, or to voting when all turns done."""
        alive_turns = [pid for pid in self.turn_order if not self.players[pid].is_eliminated and self.players[pid].is_connected]
        if not alive_turns:
            self.phase = "VOTING"
            return

        self.current_turn_index += 1
        if self.current_turn_index >= len(alive_turns):
            # One cycle of clues completed
            if self.current_clue_cycle >= self.settings["rounds_of_clues"]:
                self.phase = "VOTING"
                # Reset votes
                for p in self.players.values():
                    p.voted_for = None
            else:
                self.current_clue_cycle += 1
                self.current_turn_index = 0

    def is_active_player_bot(self) -> bool:
        alive_turns = [pid for pid in self.turn_order if not self.players[pid].is_eliminated and self.players[pid].is_connected]
        if self.phase == "CLUE_TURNS" and alive_turns and self.current_turn_index < len(alive_turns):
            active_id = alive_turns[self.current_turn_index]
            return self.players[active_id].is_bot
        return False

    def auto_cast_bot_votes(self):
        """Bots cast random votes for any other alive player."""
        alive_players = [p for p in self.players.values() if p.is_connected and not p.is_eliminated]
        for p in alive_players:
            if p.is_bot and p.voted_for is None:
                targets = [target.client_id for target in alive_players if target.client_id != p.client_id]
                if targets:
                    p.voted_for = random.choice(targets)

    def auto_bot_steal(self):
        """If the eliminated player is a bot in IMPOSTER_STEAL, make a random guess."""
        if not self.eliminated_player_id:
            return
        eliminated = self.players.get(self.eliminated_player_id)
        if eliminated and eliminated.is_bot and self.phase == "IMPOSTER_STEAL":
            random_guesses = [
                self.imposter_word, "Coffee", "Pizza", "Airplane", "Elephant", "Submarine",
                "Smartphone", "Chocolate", "Telescope", self.civilian_word
            ]
            if random.random() < 0.3:
                guess = self.civilian_word
            else:
                wrong_guesses = [g for g in random_guesses if g.lower() != self.civilian_word.lower()]
                guess = random.choice(wrong_guesses) if wrong_guesses else "Something"
            self.imposter_steal_guess(guess)

    def submit_clue(self, client_id: str, clue: str) -> bool:
        """Submits a text clue from the active player in silent mode and advances the turn."""
        if self.phase != "CLUE_TURNS":
            return False
        alive_turns = [pid for pid in self.turn_order if not self.players[pid].is_eliminated and self.players[pid].is_connected]
        if not alive_turns or self.current_turn_index >= len(alive_turns):
            return False
        active_id = alive_turns[self.current_turn_index]
        if client_id != active_id:
            return False
        
        player = self.players.get(client_id)
        if not player:
            return False

        clean_clue = clue.strip()[:40] if clue and clue.strip() else "..."
        self.clue_history.append({
            "player_id": player.client_id,
            "player_name": player.name,
            "avatar": player.avatar,
            "cycle": self.current_clue_cycle,
            "clue": clean_clue
        })
        self.next_turn()
        return True

    def generate_bot_clue(self, bot_player: Player) -> str:
        """Generates a realistic clue for a bot player based on their assigned word/role."""
        word = bot_player.word
        category = self.category.lower() if self.category else ""
        
        sample_clues = {
            "coffee": ["Morning", "Warm", "Dark", "Aroma", "Cup", "Beans", "Cafe"],
            "tea": ["Leaves", "Steep", "Hot", "Cup", "Afternoon", "Herbal", "Pot"],
            "pizza": ["Cheese", "Crust", "Slice", "Oven", "Italian", "Delivery", "Topping"],
            "burger": ["Bun", "Patty", "Grill", "Fries", "Fast", "Bite", "Beef"],
            "cat": ["Purr", "Whiskers", "Paws", "Pet", "Fur", "Nap", "Feline"],
            "dog": ["Bark", "Loyal", "Leash", "Tail", "Pet", "Walk", "Canine"],
            "airplane": ["Wings", "Sky", "Flight", "Clouds", "Pilot", "Travel", "Airport"],
            "helicopter": ["Blades", "Hover", "Rotor", "Sky", "Rescue", "Air", "Cockpit"],
            "doctor": ["Hospital", "Care", "Heal", "Stethoscope", "Clinic", "Coat", "Health"],
            "nurse": ["Care", "Patient", "Hospital", "Help", "Shift", "Uniform", "Kind"],
            "sun": ["Bright", "Yellow", "Hot", "Sky", "Day", "Warmth", "Shine"],
            "moon": ["Night", "Crescent", "Tides", "Orbit", "Glow", "Dark", "Space"],
            "guitar": ["Strings", "Music", "Acoustic", "Strum", "Rock", "Melody", "Fret"],
            "piano": ["Keys", "Ivory", "Classical", "Melody", "Grand", "Pedal", "Concert"]
        }
        
        if word and word.lower() in sample_clues:
            return random.choice(sample_clues[word.lower()])
        
        if word and word != "???":
            return f"Vibes of {word[:3]}..."
            
        if self.hint:
            return f"{self.hint} vibes"
        if category:
            cat_first = category.split()[0].capitalize()
            return f"{cat_first} thing"
        return "Secret..."

    def cast_vote(self, voter_id: str, target_id: str) -> bool:
        if self.phase != "VOTING":
            return False
        if voter_id not in self.players or target_id not in self.players:
            return False
        if self.players[voter_id].is_eliminated:
            return False

        self.players[voter_id].voted_for = target_id
        return True

    def all_votes_submitted(self) -> bool:
        active_voters = [p for p in self.players.values() if p.is_connected and not p.is_eliminated]
        return all(p.voted_for is not None for p in active_voters)

    def tally_votes(self):
        """Resolves votes, eliminates player with most votes, and transitions to REVEAL_RESULT or IMPOSTER_STEAL."""
        tally: Dict[str, int] = {pid: 0 for pid in self.players}
        for p in self.players.values():
            if p.voted_for and p.voted_for in tally:
                tally[p.voted_for] += 1
        
        self.vote_counts = tally

        # Find player with max votes
        max_votes = -1
        candidate = None
        tie = False
        for pid, count in tally.items():
            if count > max_votes:
                max_votes = count
                candidate = pid
                tie = False
            elif count == max_votes and max_votes > 0:
                tie = True

        self.eliminated_player_id = candidate
        if candidate and not tie:
            eliminated = self.players[candidate]
            eliminated.is_eliminated = True
            
            if eliminated.role in ["IMPOSTER", "MR_WHITE"]:
                # Caught! Transition to last chance steal attempt
                self.phase = "IMPOSTER_STEAL"
            else:
                # Civilian voted out
                self.check_win_conditions()
                self.phase = "REVEAL_RESULT"
        else:
            # Tie: no one eliminated this round
            self.phase = "REVEAL_RESULT"

    def imposter_steal_guess(self, guess: str):
        """The eliminated imposter or Mr. White attempts to guess the civilian word."""
        self.imposter_guess = guess.strip()
        target = self.civilian_word.lower().strip()
        # Case insensitive, punctuation tolerant match
        clean_guess = "".join(c for c in guess.lower() if c.isalnum())
        clean_target = "".join(c for c in target if c.isalnum())

        if clean_guess == clean_target:
            self.imposter_guess_correct = True
            self.winner = "IMPOSTER"
            if self.eliminated_player_id:
                self.players[self.eliminated_player_id].score += 3
        else:
            self.imposter_guess_correct = False
            self.winner = "CIVILIANS"
            for p in self.players.values():
                if p.role == "CIVILIAN":
                    p.score += 2

        self.phase = "REVEAL_RESULT"

    def check_win_conditions(self):
        """Checks if civilians or imposters have achieved victory."""
        alive_civilians = [p for p in self.players.values() if p.role == "CIVILIAN" and not p.is_eliminated]
        alive_imposters = [p for p in self.players.values() if p.role in ["IMPOSTER", "MR_WHITE"] and not p.is_eliminated]

        if len(alive_imposters) == 0:
            self.winner = "CIVILIANS"
            for p in self.players.values():
                if p.role == "CIVILIAN":
                    p.score += 2
        elif len(alive_imposters) >= len(alive_civilians):
            self.winner = "IMPOSTER"
            for p in self.players.values():
                if p.role in ["IMPOSTER", "MR_WHITE"]:
                    p.score += 3

    def reset_for_next_round(self):
        self.phase = "LOBBY"
        self.clue_history = []

    def get_sanitized_state(self, viewer_id: str) -> dict:
        """
        Anti-cheat state generation:
        Returns tailored payload for viewer_id.
        Secret words and imposter roles are only sent to the authorized player.
        """
        viewer = self.players.get(viewer_id)
        
        # Public players list
        players_list = [p.to_public_dict() for p in self.players.values()]

        # Active turn player
        active_turn_player_id = None
        alive_turns = [pid for pid in self.turn_order if not self.players[pid].is_eliminated and self.players[pid].is_connected]
        if self.phase == "CLUE_TURNS" and alive_turns and self.current_turn_index < len(alive_turns):
            active_turn_player_id = alive_turns[self.current_turn_index]

        # Is game in reveal phase?
        reveal_all = (self.phase in ["REVEAL_RESULT", "ROUND_OVER"])

        # Determine what secret info this specific viewer is allowed to see
        my_role = viewer.role if viewer else "SPECTATOR"
        my_word = viewer.word if viewer else ""
        
        # During reveal, everyone sees the words and roles
        all_roles = {}
        if reveal_all:
            all_roles = {pid: p.role for pid, p in self.players.items()}

        return {
            "room_code": self.room_code,
            "phase": self.phase,
            "round_number": self.round_number,
            "settings": self.settings,
            "category": self.category if (viewer and (viewer.role != "MR_WHITE" or reveal_all)) else "???",
            "hint": self.hint if (viewer and viewer.role == "IMPOSTER" and self.settings["mode"] == "chameleon") or reveal_all else None,
            "players": players_list,
            "viewer_id": viewer_id,
            "is_host": viewer.is_host if viewer else False,
            
            # Private player card (Anti-cheat: sent only to this specific socket)
            "my_role": my_role,
            "my_word": my_word,
            
            # Turn context
            "active_turn_player_id": active_turn_player_id,
            "clue_cycle": self.current_clue_cycle,
            "total_clue_cycles": self.settings["rounds_of_clues"],
            "clue_history": self.clue_history,
            
            # Voting context
            "vote_counts": self.vote_counts if reveal_all else None,
            "eliminated_player_id": self.eliminated_player_id,
            "winner": self.winner,
            "imposter_guess": self.imposter_guess,
            "imposter_guess_correct": self.imposter_guess_correct,
            "civilian_word": self.civilian_word if reveal_all else None,
            "imposter_word": self.imposter_word if reveal_all else None,
            "all_roles": all_roles
        }

class GameManager:
    def __init__(self):
        self.rooms: Dict[str, GameRoom] = {}

    def generate_room_code(self) -> str:
        chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" # avoid easily confused O, 0, 1, I
        for _ in range(100):
            code = "".join(random.choices(chars, k=4))
            if code not in self.rooms:
                return code
        return "IMPO"

    def create_room(self, host_id: str) -> GameRoom:
        code = self.generate_room_code()
        room = GameRoom(code, host_id)
        self.rooms[code] = room
        return room

    def get_room(self, code: str) -> Optional[GameRoom]:
        return self.rooms.get(code.upper().strip())

    def find_player_room(self, client_id: str) -> Optional[GameRoom]:
        for room in self.rooms.values():
            if client_id in room.players:
                return room
        return None

game_manager = GameManager()
