# Shadow Bearings

**A hidden-movement adventure that makes three-figure bearings part of the strategy.**

One player is the **Hunter**, following an unseen **Monster** through connected locations. Both roles travel using three-figure clockwise bearings measured from north. The Hunter discovers time-stamped clues by entering places recently visited by the Monster and can combine these with occasional public sightings in solo mode.

## Playable modes (PR1 + PR2 + PR3)

### Solo Hunt — Hunter versus Monster AI

On the title screen, choose **Solo Hunt**, then one of four difficulty levels. The Monster automatically takes a hidden move after each completed Hunter turn. The Hunter sees only public information and does not need to pass the device.

| Difficulty | Locations | Trail clue accuracy | Trail lasts | Sightings | Monster style | Maximum rounds |
|---|---:|---|---:|---|---|---:|
| Intro | 14 — Hollow Moor | Exact | 5 rounds | Every 2 rounds | Wandering | 13 |
| Apprentice | 18 — Thornwood Vale | ±15° | 4 rounds | Every 3 rounds | Wary | 15 |
| Tracker | 26 — Sunken Lowlands | ±30° | 3 rounds | Every 4 rounds | Elusive | 18 |
| Expert | 36 — Eclipse Marches | ±45° | 2 rounds | Every 5 rounds | Cunning | 21 |

All solo difficulties begin with a public sighting at round 0. Its direction is approximate, with uncertainty that increases at higher levels. Subsequent sightings are calculated **after the Monster moves** and stamped with the observed round. Traces still award separate clues only when the Hunter reaches a recent Monster visit.

Monster AI uses legal roads, the publicly visible Hunter location and history, and its own private recent trail. Four AI profiles vary evasion, avoidance of recent traces, route look-ahead and randomness. **The AI cannot see the Hunter's future decisions.** Given the same seed and moves, its decisions are reproducible for tests.

The Tracker and Expert modes provide progressively less precise information about *when* a trail was left. The clue itself is always mathematically truthful for its recorded observation round.

**PR3 improvement:** approximate bearings are now fixed compass sectors containing the true bearing. Their midpoint no longer reveals the monster's precise direction.

### Pass & Play — Hunter versus a human Monster

The original 14-location Hollow Moor mode remains available. The Monster picks a secret starting point, then the two players alternate.

**Handoff privacy:** all board, clue and position information is replaced by an entirely blank role-transition view containing only the requested handoff text and a reveal button. Switching away from the page re-seals an active two-player role view. In Solo Hunt, the Monster never has a visible role view.

## Learning and deduction tools (PR3)

**Interactive field training.** Select **Interactive Bearings Training** on the home screen or **Compass & Reverse Bearing Training** during the Hunter turn. Four exercises cover clockwise-from-north bearings, opposite bearings, careful "bearing of A from B" wording, and ranges wrapping across 000°. Every exercise checks a three-figure answer and explains the method.

**Combine clues optionally.** In the Hunter's notebook, choose **Combine clues on the map**. Tick or untick observations to see their rays/sectors, highlight possible Monster locations, and list remaining candidate places. The analysis uses only *public observations*: for each time-stamped clue it finds possible locations at the recorded round, advances those possibilities through the correct number of single-road Monster moves, then intersects the sets. It does NOT overlap old clues as if the Monster remained stationary. The overlay may be turned off to restore unaided problem solving.

**Mark and annotate the map.** Click a location or use keyboard/Enter to cycle it through *suspected*, *ruled out*, and unmarked. A location selector offers the same action on phones or when keyboard navigation is preferred. The Hunter can keep written working in a private note area during the current game. Personal marks do not automatically change the mathematically computed candidate set. Marks and notes never appear on Monster or handoff screens and clear when a new game starts.

**Route-distance hints.** In solo Intro, discovered traces also show exact shortest-path road distance at their observation time. Apprentice gives a ±1-road band. Tracker and Expert stay direction-only. These refer to connected roads, not straight-line screen distance.

**Mathematics feedback.** Each successful route reports how far the entered bearing differed from the actual road direction. Invalid bearings never cost a movement. A Hunter progress panel shows successful routes, corrections and average angular error, with a short summary after the game.

See the [Teacher's Guide](docs/TEACHING_GUIDE.md) for curriculum alignment and suggested activities.

## Movement and winning

- Use exactly **three digits** such as `035`, `180` or `270`, clockwise from north. `360` is treated as north, `000`.
- Enter an exit bearing to move along a **connected road**; tolerance is ±6°.
- The Hunter moves **up to two roads per turn**, stopping early if desired. A human or computer Monster moves **one road after the Hunter finishes**.
- Reaching the Monster's current location wins immediately. The Monster wins if the Hunter finishes the final round without capture.
- Recent visit traces trigger a bearing clue, sometimes worded in reverse (the bearing of the trace location *from* the Monster). Observation rounds are explicitly labelled.
- The clue notebook can draw exact rays or sectors, combine evidence from different rounds, and optionally identify candidate locations. On larger maps, use the **Location Index** to match numbered locations to names.
- At the end of the game, the full Monster trail is revealed.

## Running locally

No application dependencies or compilation are required. Serve the files with any static HTTP server:

```bash
python3 -m http.server 8000
```

Open **http://localhost:8000/**. Windows often uses `py -m http.server 8000`.

**Do not** double-click `index.html` via `file://`: native JavaScript modules require an HTTP server.

## Testing and tuning

Node.js 20+ is used for development checks:

```bash
npm test
npm run check
npm run simulate
```

`npm test` covers bearings, map validity, north wrapping, clue provenance, quantized uncertainty, exact graph-step propagation, distance hints, tutorial answers, mathematical feedback, solo AI, role privacy and browser-UI smoke tests. GitHub Actions runs this test suite on pull requests.

`npm run simulate` runs **60 fixed-seed games per difficulty** with a baseline Hunter bot. That bot uses only its public view, not the Monster's hidden position. Override the sample size with `SIM_GAMES=200 npm run simulate`. The results report capture rates, average rounds, trace discoveries and sightings. They are debugging benchmarks, **not evidence of classroom balance**; student playtesting is still needed.

The application remains dependency-free at runtime. Sources:

- `src/geometry.mjs` — bearings, angle ranges, graph distance
- `src/map.mjs` — four connected maps with validation
- `src/ai.mjs` — deterministic random generator, spawning and evasion logic
- `src/deduction.mjs` — public-clue sector checks and time-aware candidate intersections
- `src/tutorial.mjs` — four interactive bearings practice activities
- `src/engine.mjs` — game rules and strictly role-specific view projections
- `src/app.mjs` — screens, movement controls, clues and illustrated SVG maps
- `scripts/simulate.mjs` — reproducible public-information playtest baseline

## Future work

**PR4:** further original artwork, scenarios, save/resume, and hosted deployment. Keyboard and mobile accessibility still need real-device classroom validation.

**Security note:** pass-and-play is a practical classroom look-away safeguard, not protection against a malicious person inspecting browser memory or developer tools. Competitive two-device online play would require server-authoritative hidden state.

[Game design](docs/GAME_DESIGN.md) · [Build plan](docs/BUILD_PLAN.md)

This is an **original hidden-movement game**; its artwork, setting, characters and terms do not reuse copyrighted elements of existing games.
