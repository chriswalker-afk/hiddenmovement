# Implementation plan

## PR1 — playable vertical slice (priority)

- TypeScript + Vite web app, lightweight SVG/Canvas illustrated map (no copied franchise artwork).
- One hand-authored ~12-node introductory connected map, validated outgoing bearings.
- Three-figure bearing input, compass, legal route selection and accessible error/validation messages.
- Hunter movement of up to two edges; Monster movement of one edge.
- Reliable game state machine and deterministic round logic, win/loss conditions.
- Local two-player pass-and-play with **two fully opaque sealed handoff screens**, including exact monster handoff wording.
- Hidden Monster location from Hunter; no secret data in visible hints.
- Basic trail markers and mathematically consistent trace-triggered clue snapshots.
- End-game reveal and restart.
- Tests: geometry, clue timeline, legal moves, state machine, capture, refresh/role privacy.

**Acceptance test:** two people can finish a full game without a hidden location leaking on a handoff screen, and every directional clue corresponds to a recorded Monster position at the labelled observation time.

## PR2 — solo Monster AI and difficulty

- Evasion AI with seeded randomness, no hidden future information.
- Intro / Apprentice / Tracker / Expert presets with tunable map size, clue widths and trail lifetime.
- 2–3 hand-authored maps; map graph validation.
- Debug AI decision trace available in developer tests only.
- Balance simulation across seeds (capture rate, average turns, number of clues used).

## PR3 — deduction and learning tools

- Hunter clue notebook, bearing ray/sector overlay, annotations and candidate-region tools.
- Bearing/reverse-bearing onboarding and short practice tutorial.
- Optional route distance-band clues and scheduled pulse to avoid stalemates.
- Classroom feedback mode with optional bearing accuracy statistics.
- Accessibility and keyboard/touch pass.

## PR4 — polish and variety

- Original cohesive art and atmospheric effects without reducing clarity.
- Scenario variety / map themes / distinct objectives.
- Multiple Monster behavior profiles and fair stealth powers (with counters).
- Save/resume designed to keep roles sealed.
- Deploy GitHub Pages and test desktop/mobile/projector.

## Future (separate scope)

- Genuine two-device multiplayer with a server-authoritative role-specific state API and reconnect logic; never ship the complete secret Monster path to a Hunter-controlled client in that mode.
- Optional teacher-configurable lesson mode and custom maps.
