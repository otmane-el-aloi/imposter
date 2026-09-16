## Summary

Provide a concise description of the changes introduced by this pull request. Reference any relevant issue(s) with `Fixes #...` or `Closes #...`.

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] 📚 Word pack (added or updated language/category word pack)
- [ ] 🔊 Audio / UI enhancement (new Web Audio sound effects or styling)
- [ ] 🛠️ Refactoring / Performance improvement
- [ ] 📖 Documentation update
- [ ] ⚙️ CI/CD or build pipeline change

## Checklist

- [ ] My code adheres to the project's coding style and architecture principles.
- [ ] **Anti-cheat wire verification**: If altering game state, I ensured sensitive words/roles are NOT leaked in `get_sanitized_state` to unauthorized clients during active rounds.
- [ ] **Zero-asset audio**: If adding sound effects, I used procedural Web Audio API synthesis without external MP3/WAV files.
- [ ] **Offline-first**: No external network dependencies or online CDNs were introduced.
- [ ] I have run backend tests locally: `poetry run python tests/test_game_flow.py` (and others as applicable).
- [ ] I have built and typechecked the frontend: `cd client && npm run build`.
- [ ] I have updated relevant documentation / `README.md` if applicable.

## Testing Instructions

Describe how a reviewer can test your changes:
1. ...
2. ...
