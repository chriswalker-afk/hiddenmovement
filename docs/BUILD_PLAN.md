# Implementation plan

## PR1 — playable vertical slice (priority)

- Native JavaScript ES modules, static HTML/CSS and illustrated SVG map (no compilation and no copied franchise artwork).
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

## PR2 — solo Monster AI and difficulty (implemented; PR #2)

- Evasion AI with seeded randomness, no hidden future information.
- Intro / Apprentice / Tracker / Expert presets with tunable map size, clue widths and trail lifetime.
- Four region maps total: one hand-authored and three deterministic, curated network layouts with graph validation and original location names.
- AI decisions remain hidden from Hunter projections, with deterministic seeds for test diagnostics.
- Balance simulation across seeds (capture rate, average turns, number of clues used).

## PR3 — deduction and learning tools

- Extend the existing clue notebook and bearing overlays with player annotations, candidate-region tools and multi-clue intersections.
- Bearing/reverse-bearing onboarding and short practice tutorial.
- Optional route distance-band clues and further clue types (timed public sightings already added in PR2).
- Classroom feedback mode with optional bearing accuracy statistics.
- Accessibility and keyboard/touch pass.

## PR4 — polish and variety

- Original cohesive art and atmospheric effects without reducing clarity.
- Scenario variety / map themes / distinct objectives.
- Additional Monster abilities and fair stealth powers (with counterplay); initial AI behavior profiles are part of PR2.
- Save/resume designed to keep roles sealed.
- Deploy GitHub Pages and test desktop/mobile/projector.

## Future (separate scope)

- Genuine two-device multiplayer with a server-authoritative role-specific state API and reconnect logic; never ship the complete secret Monster path to a Hunter-controlled client in that mode.
- Optional teacher-configurable lesson mode and custom maps.


## PR1 implementation outcome (17 November 2026)

**Implemented in pull request #1** on branch \`design/initial-game-spec\`:
- Static browser game with original illustrated 14-node map, bearings input, hunter and monster turns, secret spawning, clues, notebook and endgame route reveal.
- Role-specific view projection and fully blank role handoff (except instruction and necessary reveal button), including re-sealing when the app is backgrounded.
- Deterministic test scenarios for geometry, turn order, secrets, trails, reverse bearings, capture and a completed 13-round game.
- A GitHub Actions test workflow.

**Scope decisions:** Solo AI and selectable difficulty were scheduled for PR2 and are implemented there. Full onboarding, advanced deduction and accessibility polish remain PR3. Hosting/deployment and artwork polish remain PR4. This is an early gameplay prototype and has not yet been classroom-playtested.


## PR2 implementation outcome (17 November 2026)

**Implemented in pull request #2** on branch \`feature/pr2-solo-ai-difficulty\`:
- Solo Hunter mode with an automatically moving, hidden AI Monster. No Monster interface or handoff is shown in solo games.
- Four selectable difficulty presets: **Intro (14 nodes)**, **Apprentice (18)**, **Tracker (26)**, **Expert (36)**. They vary map size, clue precision (exact to ±45°), trail lifetime (5 to 2 rounds), public-sighting frequency, round limit and AI evasiveness.
- Three new deterministic map networks, each validated for connectivity, safe starting points, unique outgoing bearings and non-crossing roads.
- Reproducible seeded spawning and AI choices; AI uses only the public Hunter location and history, the graph and its own trail.
- Public, time-stamped watcher sightings and consistent trace clues, with approximate trail-age descriptions on harder levels.
- Dynamic map rendering, different region themes and a numbered location index for larger maps.
- Automated tests for all four difficulties, AI legality, snapshot clue correctness, role-privacy regression, seeded repeatability and browser UI flows.
- \`npm run simulate\` reproducible baseline Hunter-vs-AI trials using **public information only**; capture statistics are diagnostic, not calibrated classroom rates.

**Out of scope:** PR3 provides deeper deduction teaching tools; PR4 provides richer art and hosted deployment. The design remains in playtesting and tuning rather than claiming final difficulty balance.
