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

## PR3 — deduction and learning tools (implemented; PR #3)

- Extend the clue notebook with optional selected-clue overlays, personal map marks and time-aware intersections of candidate regions.
- Bearing/reverse-bearing onboarding and short practice tutorial.
- Optional shortest-route distance-band clues in introductory solo levels; timed public sightings already added in PR2.
- Bearing-angle accuracy, corrections and successful movements in Hunter view and end-game report.
- Accessible keyboard/touch map annotation controls, labelled form inputs and low-motion styling; real-device classroom QA remains ongoing.

## PR4 — polish and variety (implemented in PR #4; pending review)

- Original themed SVG scenery for four regions, illustrated title art, colour/accessibility and legibility refinements.
- Three scenarios: Long Hunt, Last Gate, Lanternfall, with public objective markers and timed beacon clues.
- One-use Monster Veil and Hunter Signal Lantern with visible use, limited charges, fair opportunity costs and direct-capture precedence.
- Validated device-local save/resume (automatic and manual), with forced role re-sealing on refresh.
- Provide a GitHub Pages deployment workflow, allowlisted static packaging, preview artifact, mobile/projector zoom controls and CI checks. Live hosting requires enabling Pages and merging PR4.

## Future (separate scope)

- Genuine two-device multiplayer with a server-authoritative role-specific state API and reconnect logic; never ship the complete secret Monster path to a Hunter-controlled client in that mode.
- Optional teacher-configurable lesson mode and custom maps.


## PR1 implementation outcome (17 November 2026)

**Implemented in pull request #1** on branch `design/initial-game-spec`:
- Static browser game with original illustrated 14-node map, bearings input, hunter and monster turns, secret spawning, clues, notebook and endgame route reveal.
- Role-specific view projection and fully blank role handoff (except instruction and necessary reveal button), including re-sealing when the app is backgrounded.
- Deterministic test scenarios for geometry, turn order, secrets, trails, reverse bearings, capture and a completed 13-round game.
- A GitHub Actions test workflow.

**Scope decisions:** Solo AI and selectable difficulty were scheduled for PR2 and are implemented there. Full onboarding, advanced deduction and accessibility polish remain PR3. Hosting/deployment and artwork polish remain PR4. This is an early gameplay prototype and has not yet been classroom-playtested.


## PR2 implementation outcome (17 November 2026)

**Implemented in pull request #2** on branch `feature/pr2-solo-ai-difficulty`:
- Solo Hunter mode with an automatically moving, hidden AI Monster. No Monster interface or handoff is shown in solo games.
- Four selectable difficulty presets: **Intro (14 nodes)**, **Apprentice (18)**, **Tracker (26)**, **Expert (36)**. They vary map size, clue precision (exact to ±45°), trail lifetime (5 to 2 rounds), public-sighting frequency, round limit and AI evasiveness.
- Three new deterministic map networks, each validated for connectivity, safe starting points, unique outgoing bearings and non-crossing roads.
- Reproducible seeded spawning and AI choices; AI uses only the public Hunter location and history, the graph and its own trail.
- Public, time-stamped watcher sightings and consistent trace clues, with approximate trail-age descriptions on harder levels.
- Dynamic map rendering, different region themes and a numbered location index for larger maps.
- Automated tests for all four difficulties, AI legality, snapshot clue correctness, role-privacy regression, seeded repeatability and browser UI flows.
- `npm run simulate` reproducible baseline Hunter-vs-AI trials using **public information only**; capture statistics are diagnostic, not calibrated classroom rates.

**Out of scope:** PR3 provides deeper deduction teaching tools; PR4 provides richer art and hosted deployment. The design remains in playtesting and tuning rather than claiming final difficulty balance.


## PR3 implementation outcome (17 November 2026)

**Implemented in pull request #3** on branch feature/pr3-deduction-learning-tools:
- Four interactive compass exercises covering clockwise bearings, reverse bearings, phrasing and 000° sector wrap; can be opened from home or Hunter view and skipped at any time.
- **Time-aware public deduction engine**: convert each selected clue to possible Monster locations at its observation round, propagate along exactly one road per elapsed completed round, then intersect. Optional map rays/sectors and candidate rings/list. No private Monster state used.
- Click/keyboard-accessible **Hunter location annotations** (suspected / ruled out / clear), keyboard/mobile alternate selector, and private working notes visible only on Hunter screens.
- Route-distance clue bands on the two easiest solo difficulties, computed from shortest graph paths as of the clue observation round.
- Student bearing feedback with valid route count, invalid attempts and mean angular error; no movement cost for incorrect bearings.
- **Clue uncertainty correction**: wide angular ranges now snap to *fixed compass sectors* that contain the true direction without revealing it by placing the exact direction at the midpoint. Includes wrapped sectors and reverse directions.
- Extended automated tests for time-indexed clue intersections, exact graph-step propagation, sector truthfulness, distance clues, maths statistics, tutorial checks and browser UI privacy.
- New Teacher's Field Guide with worked bearings examples, 20-minute lesson structure and AO1/AO2/AO3 suggestions.

**Still not covered:** final classroom balance, device-matrix accessibility QA, hosted deployment, server-authoritative online multiplayer, saved progress or richer art/scenarios (PR4 and future work).


## PR4 implementation outcome (17 November 2026)

**PR #3 was squashed into main before PR4 work began.** PR #4 is the follow-up branch feature/pr4-polish-scenarios-save-pages and is **not merged** as part of this milestone.

- Added original region-specific SVG art, ornamental home illustration, responsive mission cards, visible mission goal markers, map zoom controls and an icon/manifest.
- Added two original scenarios: **The Last Gate** (public escape gate opens from round 5) and **Lanternfall** (Monster must extinguish two publicly known beacons). The original **Long Hunt** remains unchanged by default.
- Added once-per-mission Monster **Veil** to conceal one destination trace (public notice), plus Hunter **Signal Lantern** to trade one move for an approximate, time-stamped sighting. Capture still takes priority over Veil.
- Integrated scenario targets into the seeded solo AI and ensured beacon reports participate in observation-time-aware deduction.
- Implemented validated browser-local saving with explicit Save & Return, automatic updates, safe Resume, and full shared-device role resealing. No cloud saves or anti-cheat claims.
- Added explicit deployable-site package script, PR preview ZIP workflow and GitHub Pages publishing workflow restricted to main.
- Added regression and scenario-specific tests; see PR4 Checks for latest verification.
- Added deployment and rollback guidance; a public site URL is **not confirmed live until Pages is enabled and the main-branch deployment succeeds**.

**Remaining after PR4:** real classroom difficulty tuning; optional server-authoritative two-device multiplayer; additional locations, narrative variety and accessibility certification.
