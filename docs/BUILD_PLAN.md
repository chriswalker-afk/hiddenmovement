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


## PR9 — unique monsters, truth-preserving powers and search feedback

**Implemented and merged in PR #9** (after PR #8):

- Four new named Solo monsters: **Lantern Wisp** (no special ability), **Briar Shade** (public-origin 2–3-road teleport, 4-round cooldown), **Mire Mimic** (unconfirmed decoy location, 4-round cooldown), and **Eclipse Herald** (both abilities on 5- and 4-round cooldowns, never both the same Monster turn).
- Four cohesive, original, locally bundled SVG portrait assets with level-introduction cards, difficulty-screen previews and game-over art.
- High-visibility, dismissible Hunter search-result pop-ins after every valid movement, with distinct outcomes for empty searches, earned bearing clues, decoy exposure and capture.
- Public exact teleport origins and bounded destination range, but no landing location disclosure. The public clue solver propagates through actual announced teleports without excluding the true Monster.
- Rumour clues remain **unverified** and do not constrain the automatic deduction solver. They are shown as reported locations rather than automatically plotted bearing lines. Visiting a reported site visibly disproves the decoy.
- Seeded AI ability selection, state validation and device-local persistence of cooldowns/decoys and modal acknowledgement. Pass-and-play handoff privacy unchanged.
- Test suite expanded to cover power cooldowns, true bearings, decoy investigation, local persistence, class-specific behaviour, and visual QA verifying each portrait and search result on desktop/mobile.
- Follow-up: actual classroom feedback and playtests to adjust ability frequency and tune report writing, especially on Expert.

**Shipping gate:** merge only after tests, seeded AI benchmarks, deployable site build, all four introduction images and desktop/mobile visual QA succeed. PR9 does not replace the live game until merged.


## PR10 — illustrated Monster Hunter briefings and Guided help

**Implementation (17 November 2026):**
- Solo levels begin with an original Hunter illustration paired with the existing **unique monster portrait**. The text introduces the Hunter's role, the evidence-search loop, the Monster's specific power, secret movement, and the win condition; it derives **13/15/18/21 rounds** from the actual difficulty state.
- The briefing also warns about early Monster victory on The Last Gate and Lanternfall story missions.
- Seven illustrated **How to Hunt** pages teach movement bearings, trace clues, clue wording/reverse bearings, old observation timestamps, teleports, false sightings and a turn checklist. The original four interactive compass challenges follow; students can skip ahead or close the tutorial.
- Opt-in **Guided / Tutorial** mode adds a contextual Coach panel. Its example bearing is revealed only on request **as text**, uses a connected road and public Hunter state, and does not draw lines or sectors automatically. Standard clue/sighting frequency remains unchanged.
- The allowlisted preview/Page deployment copies `assets/characters/monster-hunter.svg`, and regression tests cover the briefings, round limits, guide structure, powers and non-secret Coach advice.
- Browser viewport QA captures all four briefings, tutorial and Guided Coach with mobile/desktop layout checks. **Final gate:** tests, syntax checks, site packaging and browser visual QA must pass before merging.

**Still to tune with students:** relative usefulness of Guide versus Coach and how often each monster power ought to activate.

## PR11 — Hunter Forge custom character system (17 November 2026)

**Implementation:**
- Add an original illustrated hunter-creation screen called **Hunter Forge** with accessible part choices, live layered SVG rendering, randomise/reset/save/cancel controls, and a clear device-local saving explanation.
- Four interchangeable **heads**, **torsos**, and **legs**, six coordinated colour schemes, and four optional complexions. Art favours angular hand-inked shapes, weathered leather and armour, sombre colours, and distinctive silhouette readability; it is not copied from any established franchise.
- Share a strictly validated `hunterAppearance` model across editor, compact menu preview, Solo level briefing, the How-to-Hunt guide and Hunter HUD. The board token still uses its original visible marker until the follow-up token milestone.
- Persist the appearance separately from the existing hunt save format, safe on old saves and storage failure. Saved choices are cosmetic and never enter the secret Monster state or influence rules.
- Regression suite for option counts, malicious/corrupt storage data, deterministic randomisation, SVG variants and source integration. Browser QA covers character editing, saved reload, briefing and HUD rendering at desktop and mobile resolutions.
- Update the standard test and syntax-check workflows. Keep the allowlisted build compatible with the new src module.
- Preserve opaque Pass & Play handoff, normal clue timing and bearings, and the PR10 tutorial/monster abilities.

**Follow-up after replay (planned PR13):** create a legible avatar-matched moving character token for each map, retaining tappable node interactions, bearings, clue overlays and device zoom. Add animation only if motion cannot obscure investigation markers, and test on phone/projector.

**Shipping gate:** green CI tests, site preview and responsive browser QA. PR11 is a reviewable feature branch; it should be merged only after these gates pass.

## PR12 — automatic, skippable endgame movement replay (17 November 2026)

**Scope:** Each completed Solo Hunt or Pass & Play game now proceeds to **The Hunt, Replayed**, a responsive original-map timeline revealing the actual positions of **both** participants in the exact order their successful moves occurred. Early objective victories, captures (including a Monster walking onto the Hunter), normal turn-limit survival, and all four difficulties use the same actual recorded events.

- Append explicit end-of-turn and Signal Lantern events, and annotate Monster teleports/Veil moves; preserve the validated v1 active save format and current move histories.
- Expose a copy of this chronological history only in the **over** game projection, never on live Hunter/Monster views or opaque pass-and-play transitions. Avoid guessing where the Monster went when the older save has no recorded movement.
- Build initial-position and event-specific frames with progressive paths, current locations, round labels, monster art/identity and explanations. Mark teleport segments differently from ordinary roads; two high-contrast pieces remain visible when both actors occupy one node.
- Automatically run replay after the final report, with controls for play/pause, step back/forward, speed toggle, timeline scrub, restart and skip-to-results. Offer **Watch the Hunt Again** from the results page.
- Maintain the existing result statistics and full Monster route, with original replay-safe map zoom. Respect reduced-motion settings and do not autoplay behind the last search-report modal.
- Add unit regressions for chronological positions, round-zero starts, captures, idle turns, secret-state isolation, teleport/Veil/Signal Lantern, incomplete histories and UI wiring; browser QA verifies desktop/mobile/landscape replay controls and layouts.

**Remaining after PR12:** finish Hunter Forge by replacing the generic live map marker with the matching modular Hunter board character; add a cohesive miniature token, smooth route movement and responsive art QA. Planned as **PR13 — Hunter Forge board piece**.


## PR13 — Hunter Forge's moving board piece (17 November 2026)

**Scope:** Complete the visual link between saved Hunter Forge appearance and playable board, without changing movement legality, bearings, clues, monster AI, turns or victory conditions.

- Reuse original modular drawing helpers for all heads, torsos, legs, complexions and six palettes; do not flatten or replace the designed outfit with an unrelated icon.
- Render one shield-backed compact figure alongside the highlighted Hunter location; leave the numbered location centre interactive and keep the artwork inside the map edges at 100–300% zoom.
- Animate a valid Hunter move from its actual old node to its destination with a brief SVG translation after the search report closes. Illegal moves never animate. Respect reduced-motion accessibility preferences.
- Support the same saved appearance in every difficulty, both local Pass & Play roles, Solo play and the endgame replay. In replay replace the generic H marker but retain the M marker.
- Preserve opaque handoffs, tap/keyboard node marks, the protractor, map zoom, clues and save/resume.
- Test rejected malformed costume/coordinates, all modular variants, animation and responsive browser screenshots.

**Quality gate:** tests, AI simulation, preview build and desktop/mobile/landscape visual checks before merging.

**Follow-up:** collect student feedback on miniature size and movement timing.


## PR15 — Blackfen Marsh completed illustrated Intro map (17 November 2026)

- Implement all **14 World Bible names** at their exact unchanged A–N IDs and coordinates, maintaining **29 roads**, safe spawns, three-figure bearings and scenario goal IDs L/G.
- Draw hand-inked, muted gothic countryside: individual SVG landmarks for watch, pine crossroads, ruined watermill, crow farm, whispering wood, ruined chapel, lit inn, Moss Bridge, Blackwater dock, barrow, standing stones, passable exit gate, swamp and quarry.
- Introduce a physically coherent Blackfen Run stream through wet south-west terrain and the mill/bridge/landing corridor; shared cubic control points in `WATERWAYS.moor` drive both drawn water and road crossing detection.
- Mark road-water crossings with actual road-aligned decks; use the custom landmark bridge/landing at H and I rather than three overlapping generic crossings.
- Remove unrelated generic landscape labels; preserve existing node hit areas, Hunter Forge miniature, clue rings, replay and map zoom.
- Add unit tests for geometry/name/landmark reconciliation, creek distance to named wet landmarks, noncrossing routes and scenario objective IDs, plus desktop/mobile browser screenshot QA.
- This is an **art and identity** pass: no gameplay, round, clues, powers or AI changes.

**Next recommended PR16:** Duskmere Village — develop its 18 named structures as a geographically coherent settlement, design a real southern millstream with road-aligned Stone Bridge and Mill Pond, then test at mobile/projector zoom before merging.


## PR16 — Duskmere Village completed Apprentice map (17 November 2026)

- Ship 18 named village sites A01–A18 from the locked World Bible, linked to 18 distinct original SVG landmarks in src/duskmere.mjs.
- Preserve the existing full **18-node/33-edge graph**, all coordinates and bearings, original A08 Hunter spawn, and objective node IDs **A03 North Gate** and **A18 South Beacon**.
- Give the region its own slate roofs, half-timbered cottages, chapel, gate, market cross, great oak, old well, shepherd's pasture, orchard, forge, warm windows and settled colour identity.
- Paint the shared-geometry WATERWAYS.woodland **Duskmere Millstream** and its connected Mill Pond south of the village; all playable nodes remain on dry ground.
- Verify crossings exclusively on existing A12–A16, A13–A17 and A14–A18 roads. Place a custom road-aligned Stone Bridge at the central A13–A17 crossing, suppressing stacked generic decks; use small decks at the others.
- Retain bearing entry, clue notebook, Hunter Forge token, Monster abilities and hidden trail, saved progress, replay, all overlays and sealed handoffs.
- Test unique site identity, name/art links, unchanged graph, actual water path/clearance, bridge crossings and responsive visual QA on desktop, portrait and landscape phones.

**Next planned PR17:** Rookgate District, the 26-location gothic city, with coherent blocks, two real canals, road-aligned stone bridges, dockyards, city gates and workshops. Then Ravenmarch County (PR18).



## PR17 — Rookgate District, completed Tracker canal city (18 November 2026)

- Rename Tracker to **Rookgate District**, preserving the original **26 nodes, 46 road edges, exact map coordinates, legal bearings, T10 Hunter start, T04 escape and T04/T23 Lanternfall beacon IDs**.
- Implement one locally generated original illustrated landmark for each site from the World Bible (Bell Tower through Fen Gate), with unique semantic art kinds and stable node IDs.
- Draw a coherent *inhabited city*, not a swamp: slate roofs, narrow civic lanes, markets, guildhall, city walls and gates, watchtowers, workshops, dockyards, lamps, and stone/cobble texture.
- Reuse the geometry of the north and south canal waterways in both the SVG illustration and bridge detection. Four connected roads cross the north canal and five cross the south canal. Bridges are granite city bridges aligned with existing roads, not new paths.
- Place canal steps, piers, ferry, mill wheel and flood-lock gates over the actual water corridor instead of on unrelated dry ground; all named node markers remain safely on shore.
- Reuse the Hunter Forge map character, original Monster portrait and False Sighting power, clue geometry, missions, active saves and end-of-game replay without gameplay changes.
- Extend unit regression coverage for art/label matching, shared stream shapes, nine crossings, safe banks, waterfront alignment, map order and mission goals; run full desktop, phone portrait/landscape visual screenshot QA.

**Next PR18:** **Ravenmarch County**, a 36-location regional landscape with mountain passes, forest, ruins, farm fields, Blackwater river valley and frontier outposts; retain its 65-road Expert graph and validate any water crossing against existing bearings.

