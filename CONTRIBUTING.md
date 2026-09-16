# Contributing to Imposter Party Game 🕵️‍♂️🎉

First off, thank you for considering contributing to **Imposter**! Projects like this thrive thanks to open-source contributions, bug reports, and community ideas.

Whether you are fixing a typo, adding a new language pack, designing a new sound effect, or building full game features, this guide will help you get started quickly.

---

## Table of Contents

1. [Code of Conduct](#-code-of-conduct)
2. [Core Architecture & Philosophy](#-core-architecture--philosophy)
3. [Local Development Setup](#-local-development-setup)
4. [Contribution Workflow](#-contribution-workflow)
5. [How to Contribute](#-how-to-contribute)
   - [Adding Custom Word Packs](#adding-custom-word-packs)
   - [Extending Backend Game Logic](#extending-backend-game-logic)
   - [Anti-Cheat Wire Sanitization](#anti-cheat-wire-sanitization)
   - [Procedural Audio Synthesis](#procedural-audio-synthesis)
   - [Frontend UI & Client Improvements](#frontend-ui--client-improvements)
6. [Testing & Quality Assurance](#-testing--quality-assurance)
7. [Building Standalone Executables & Docker](#-building-standalone-executables--docker)
8. [Submitting a Pull Request](#-submitting-a-pull-request)

---

## 📜 Code of Conduct

This project is governed by the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

---

## 🏛️ Core Architecture & Philosophy

Before diving into code, keep these core principles in mind:

1. **Authoritative Server**: The Python backend (`backend/game_manager.py`) is the single source of truth. All game phase transitions, timers, word assignments, and vote tallies occur on the server.
2. **Anti-Cheat Wire Protection**: Never trust the client. WebSocket payloads sent to each player are sanitized individually via `get_sanitized_state(viewer_id)`. Civilians must never receive the Imposter's role or secret word in memory or network traffic during active rounds.
3. **100% Offline-First & LAN Ready**: The game must run seamlessly without an internet connection (on mobile hotspots, camping routers, or home Wi-Fi). Avoid external CDN links or remote API calls in runtime game logic.
4. **Procedural Zero-Asset Audio**: Sound effects are generated mathematically in pure code via the Web Audio API (`client/src/hooks/useSoundEffects.ts`). No MP3/WAV assets to download, zero latency, and zero bandwidth overhead.

---

## 💻 Local Development Setup

### Prerequisites

- **Python 3.9+** and [Poetry](https://python-poetry.org/docs/#installation)
- **Node.js 18+** and `npm`

### Step 1: Clone the Repository

```bash
git clone https://github.com/otmane-el-aloi/imposter.git
cd imposter
```

### Step 2: Set Up Backend

```bash
# Install Python dependencies
poetry install

# Run backend test suite to confirm everything is working
poetry run python tests/test_game_flow.py
```

### Step 3: Set Up Frontend

```bash
cd client
npm install
npm run build
cd ..
```

### Step 4: Run in Dual-Terminal Dev Mode

For rapid development with hot-reloading:

**Terminal 1 (FastAPI Backend with WebSockets):**
```bash
poetry run python -m backend.main
```

**Terminal 2 (Vite Frontend with Hot-Module-Replacement):**
```bash
cd client
npm run dev
```

The FastAPI backend will serve on `http://localhost:8000`, and Vite development server will run on `http://localhost:5173`.

> [!TIP]
> To test mobile devices on the same Wi-Fi or phone hotspot, open the server URL printed in Terminal 1 (e.g. `http://192.168.1.X:8000` or `http://172.20.10.X:8000`), or scan the ASCII QR code printed in the terminal.

---

## 🔄 Contribution Workflow

1. **Check Existing Issues**: Search the [Issue Tracker](https://github.com/otmane-el-aloi/imposter/issues) to avoid duplicating work.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/my-new-feature
   # or
   git checkout -b fix/issue-description
   # or
   git checkout -b words/spanish-pack
   ```
3. **Keep Commits Focused**: Use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add spectator mode`
   - `fix: prevent double vote submission`
   - `docs: update setup guide for Windows`
   - `words: add Spanish language word pack`
   - `test: add edge cases for 8-player rounds`
4. **Run Tests & Verify Builds**:
   Make sure all tests and builds pass before pushing (see [Testing](#-testing--quality-assurance)).

---

## 🛠️ How to Contribute

### Adding Custom Word Packs

Word packs reside in `backend/words/` as JSON files (`en.json`, `fr.json`, etc.).

To add a new language or category pack:
1. Create a JSON file in `backend/words/<lang_or_name>.json`.
2. Follow this structure:
   ```json
   [
     {
       "civilian": "Coffee",
       "imposter": "Tea",
       "category": "Beverages",
       "hint": "Popular morning hot drink"
     },
     {
       "civilian": "Bicycle",
       "imposter": "Motorcycle",
       "category": "Vehicles",
       "hint": "Two-wheeled transportation"
     }
   ]
   ```
3. Ensure pairs are distinct but closely related so neither Civilians nor Imposters can immediately give away their role.
4. Word packs placed in `backend/words/` are automatically detected and available in game settings.

### Extending Backend Game Logic

The backend logic is centralized in:
- `backend/game_manager.py`: Authoritative game state machine (`LOBBY` -> `ROLE_REVEAL` -> `CLUE_TURNS` -> `VOTING` -> `IMPOSTER_STEAL` -> `REVEAL_RESULT`).
- `backend/connection_manager.py`: WebSocket connection manager with per-viewer wire sanitization.
- `backend/main.py`: FastAPI application, endpoints, and WebSocket dispatch.

### Anti-Cheat Wire Sanitization

Whenever you add new state fields:
- Check `backend/game_manager.py:get_sanitized_state(viewer_id)`.
- **Never** leak sensitive fields (`civilian_word`, `imposter_word`, `imposter_id`, `all_roles`) to any player whose role should not know them during active phases.
- Add an assertion to `tests/test_game_flow.py` verifying your new field is scrubbed over the wire.

### Procedural Audio Synthesis

We deliberately avoid external MP3/WAV files:
- All audio is defined in `client/src/hooks/useSoundEffects.ts`.
- Uses native `AudioContext`, `OscillatorNode`, and `GainNode`.
- When adding a new sound:
  1. Define a function using pure Web Audio primitives (e.g., frequency ramps, envelope shaping).
  2. Expose it through the `useSoundEffects` hook interface.
  3. Wire it to the corresponding UI transition or event.

### Frontend UI & Client Improvements

- **Framework**: React 18 with TypeScript.
- **Styling**: Tailwind CSS with dark cyberpunk / neon aesthetics.
- **Routing**: `react-router-dom` (`/` for home/join, `/room/:roomCode` for active game).
- **Types**: Always declare interfaces and types in `client/src/types/game.ts`.

---

## 🧪 Testing & Quality Assurance

All pull requests must pass the test suite and typechecks.

### 1. Run Backend Tests

```bash
# Run all tests
poetry run python tests/test_game_flow.py
poetry run python tests/test_bot_gameplay.py
poetry run python tests/test_settings.py
```

- `test_game_flow.py`: Verifies full multiplayer loop with multiple WebSockets and strict anti-cheat payload verification.
- `test_bot_gameplay.py`: Simulates solo dev bots, auto clue advancement, and automated bot voting.
- `test_settings.py`: Tests customizable clue rounds before voting and timer configurations.

### 2. Frontend Typecheck & Build

```bash
cd client
npm run build
```

This executes `tsc && vite build`. Ensure there are zero TypeScript compiler warnings or build failures.

---

## 📦 Building Standalone Executables & Docker

### Standalone Binary (PyInstaller)

To test building the self-contained single executable:
```bash
./build_standalone.sh
# Binary created at dist/imposter-party
./dist/imposter-party
```

### Docker Container

To verify the Docker container build locally:
```bash
docker build -t imposter-party .
docker run -p 8000:8000 imposter-party
```

---

## 🚀 Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feat/my-new-feature
   ```
2. Open a Pull Request against the `main` branch.
3. Fill out the provided [PR Template](.github/pull_request_template.md).
4. Verify all GitHub Actions CI checks turn green:
   - ✅ Backend tests (Python 3.10, 3.11, 3.12)
   - ✅ Frontend build & TypeScript checks (Node 18, 20)
   - ✅ Docker container build
5. Address any review comments or feedback from the maintainers.

Thank you for helping make **Imposter Party Game** amazing! 🕵️🎉
