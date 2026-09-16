# Imposter Party Game — Agent & Developer Guide (`agents.md`)

This document provides complete instructions, architecture details, and runbook guidelines for any AI agent or developer continuing work on this codebase.

---

## 1. Project Overview

**Imposter** is a multiplayer, browser-based party game (inspired by *Undercover*, *Spyfall*, and *The Chameleon*).
- **Backend**: Python 3.9+ with **FastAPI**, **Uvicorn**, and native **WebSockets**. Dependency management via **Poetry**.
- **Frontend**: **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, and **React Router** (`react-router-dom`).
- **Networking**: Offline-first Local Area Network (LAN). Runs with or without an active internet connection on home Wi-Fi or mobile personal hotspots (e.g. iPhone 5G hotspot `172.20.10.x`, Android hotspot `192.168.43.x`).
- **Audio**: Procedurally synthesized sound effects via native browser **Web Audio API** (100% offline, zero MP3 downloads).

---

## 2. Directory Structure

```
imposter/
├── backend/
│   ├── main.py                  # FastAPI app, static mount to client/dist, IP detector, terminal ASCII QR, WebSocket endpoint
│   ├── game_manager.py          # Authoritative game state machine, role assignment, turn clues, voting, bots
│   ├── connection_manager.py    # WebSocket connection tracking, room multicasting, anti-cheat state sanitization
│   └── words/
│       ├── en.json              # English word pairs (civilian, imposter, category, hint)
│       └── fr.json              # French word pairs
├── client/
│   ├── src/
│   │   ├── types/
│   │   │   └── game.ts          # Central TypeScript interfaces (GameState, Player, GameSettings, etc.)
│   │   ├── hooks/
│   │   │   ├── useGameSocket.ts # Auto-reconnecting WebSocket hook with session token & heartbeats
│   │   │   └── useSoundEffects.ts # Pure Web Audio API procedural sound synthesizer
│   │   ├── components/
│   │   │   ├── LobbyView.tsx    # Join / Create room, avatar picker, QR code, settings, Dev Bot controls
│   │   │   ├── SecretWordCard.tsx # "Hold to Peek" privacy card
│   │   │   ├── TurnPhase.tsx    # Clue speaker spotlight, timer countdown bar, turn order strip
│   │   │   ├── VotingPhase.tsx  # Suspect selection grid, vote confirmation, live vote counters
│   │   │   └── ResultPhase.tsx  # Imposter Steal mini-game, winner reveal, confetti, scoreboard
│   │   ├── App.tsx              # React Router setup (`/` and `/room/:roomCode`)
│   │   ├── main.tsx             # React entry point with BrowserRouter
│   │   └── index.css            # Tailwind directives & glow animations
│   ├── dist/                    # Compiled production build served by FastAPI
│   ├── package.json             # Scripts ("build": "tsc && vite build")
│   └── tsconfig.json            # Strict TypeScript configuration
├── tests/
│   ├── test_game_flow.py        # Automated multiplayer loop & anti-cheat wire sanitization test
│   ├── test_bot_gameplay.py     # Automated Dev Bot creation, auto-turns, and voting test
│   └── test_settings.py         # Automated test for clue rounds before voting & timer settings
├── run.sh                       # One-click launch script (builds client if needed + starts FastAPI)
├── build_standalone.sh          # One-click script to build single 16MB executable with PyInstaller
├── Dockerfile                   # Multi-stage production container build (for Render, Fly.io, Railway)
├── pyproject.toml               # Poetry dependencies (FastAPI, Uvicorn, Pydantic, QRCode, PyInstaller)
└── README.md                    # User quickstart
```

---

## 3. Essential Commands

### Run the App Locally (Development)
```bash
./run.sh
```
Or manually:
```bash
# Terminal 1 (Backend):
poetry run python -m backend.main

# Terminal 2 (Optional Vite Dev Server):
cd client && npm run dev
```

### Build Frontend (TypeScript + Vite)
```bash
cd client
npm run build
```
*(Always run this after modifying files in `client/src/` to update `client/dist/`).*

### Run All Automated Tests
```bash
poetry run python tests/test_game_flow.py && \
poetry run python tests/test_bot_gameplay.py && \
poetry run python tests/test_settings.py
```

### Build Standalone Executable (Zero Dependencies)
```bash
./build_standalone.sh
```
Produces `dist/imposter-party` (a 16 MB binary bundling Python, FastAPI, and the React app).

---

## 4. Key Architectural Rules for Future Agents

### A. Authoritative Server & Anti-Cheat Wire Protection
- **Never broadcast full unredacted state to clients.**
- Civilians must **never** receive the Imposter's identity or the Imposter's secret word in their WebSocket payloads during an active round.
- In `backend/game_manager.py`, `get_sanitized_state(viewer_id)` tailors the payload per player socket. Roles and secret words are only revealed when `phase in ['REVEAL_RESULT', 'ROUND_OVER']`.

### B. Mobile Hotspot & Local IP Discovery
- In `backend/main.py`, `get_local_ip()` inspects system network interfaces via `ifconfig` to discover the LAN IPv4 address.
- iPhone Personal Hotspots use `172.20.10.x` (Gateway is `.1`, Mac is typically `.3`).
- Android Hotspots use `192.168.43.x` or `192.168.1.x`.
- Avoid using loopback `127.0.0.1` for QR codes or public client links, as mobile phones scanning `127.0.0.1` will try to reach their own internal loopback.

### C. Standalone Bundling with PyInstaller
- When packaged with PyInstaller (`--onefile`), temporary extracted files live in `sys._MEIPASS`.
- Always access bundled directories using `sys._MEIPASS` fallbacks:
  - `CLIENT_DIST`: `os.path.join(getattr(sys, '_MEIPASS', ...), 'client', 'dist')`
  - `WORDS_DIR`: `os.path.join(getattr(sys, '_MEIPASS', ...), 'backend', 'words')`
- When invoking `uvicorn.run()` in `backend/main.py`, pass the `app` instance directly (`uvicorn.run(app, ...)`), **not** the import string `"backend.main:app"`.
- Set `PYINSTALLER_CONFIG_DIR="$PWD/.pyinstaller_cache"` during builds to avoid sandbox permission errors with `~/Library/Application Support/pyinstaller`.

### D. Game Phases & Flow
1. **`LOBBY`**: Players join via 4-letter room code or QR code. Host can add Dev Bots (`add_bot`) or adjust settings.
2. **`ROLE_REVEAL`**: Roles & words distributed. Players use the "Hold to Peek" privacy card. Bots auto-memorize.
3. **`CLUE_TURNS`**: Players take turns speaking a 1-word or 1-sentence clue aloud. Bots auto-advance after 2 seconds. The cycle repeats based on `settings.rounds_of_clues`.
4. **`VOTING`**: Alive players cast their vote. Bots cast random votes. Once all votes are in, votes are tallied.
5. **`IMPOSTER_STEAL`**: If the Imposter is eliminated, they get a final chance to type/guess the Civilians' word to steal the win! (If the eliminated imposter is a bot, it auto-guesses).
6. **`REVEAL_RESULT` / `ROUND_OVER`**: Scores updated, secret words revealed with celebratory fanfare & confetti. Host can trigger `play_again` to reset to lobby.

### E. Frontend Typing & Routing
- All frontend components are in TypeScript (`.tsx`).
- React Router manages client routes:
  - `/`: Home screen (Join room or Create new room).
  - `/room/:roomCode`: Player game controller.
- When adding new settings or state attributes, update `client/src/types/game.ts` first.
