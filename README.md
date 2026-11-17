# Shadow Bearings

**A hidden-movement adventure that makes three-figure bearings part of the strategy.**

One player is the **Hunter**, following an unseen **Monster** through connected locations. Both roles travel using three-figure clockwise bearings measured from north. The Hunter discovers time-stamped clues by entering places recently visited by the Monster and may combine these with occasional public sightings in solo mode. Bearing values appear as text, not automatically drawn rays or sectors on the map.

## Playable modes (PR1–PR9)

### Solo Hunt — Hunter versus Monster AI

On the title screen, choose **Solo Hunt**, then one of four difficulty levels. The Monster automatically takes a hidden move or uses a level-specific power after each completed Hunter turn. The Hunter sees only public information and does not need to pass the device.

| Difficulty | Locations | Trail clue accuracy | Trail lasts | Solo sightings | Monster style | Maximum rounds |
|---|---:|---|---:|---|---|---:|
| Intro | 14 — Hollow Moor | Exact | 5 rounds | Every 2 rounds | Wandering | 13 |
| Apprentice | 18 — Thornwood Vale | ±15° | 4 rounds | Every 3 rounds | Wary | 15 |
| Tracker | 26 — Sunken Lowlands | ±30° | 3 rounds | Every 4 rounds | Elusive | 18 |
| Expert | 36 — Eclipse Marches | ±45° | 2 rounds | Every 5 rounds | Cunning | 21 |

**Map readability:** every location now has its full name printed next to the node, including on the Tracker and Expert maps. The larger maps retain their two-digit index references inside each node marker for quick look-up. The three generated networks have been expanded into a consistent board footprint without changing their road connections or distorting the bearings shown to players.

**Opening and periodic watcher sightings remain available in every solo difficulty, regardless of Standard or Guided mode.** Their bearings are given in the clue notebook as text; they are not drawn on the map. Every timed sighting remains stamped with its observation round. Hunters also earn trace clues when visiting recent Monster locations.

Monster AI uses legal roads (except for announced bounded teleports), the public Hunter location and history, and its own private recent trail. Four AI profiles vary evasion, avoidance of recent traces, route look-ahead and randomness. **The AI cannot see the Hunter's future decisions.** Given the same seed and moves, its decisions are reproducible for tests.

The Tracker and Expert modes provide progressively less precise information about *when* a trail was left. The clue itself is always mathematically truthful for its recorded observation round.

**PR3 improvement:** approximate bearings are now fixed compass sectors containing the true bearing. Their midpoint no longer reveals the monster's precise direction.

### Pass & Play — Hunter versus a human Monster

The original 14-location Hollow Moor mode remains available. The Monster picks a secret starting point, then the two players alternate.

**Handoff privacy:** all board, clue and position information is replaced by an entirely blank role-transition view containing only the requested handoff text and a reveal button. Switching away from the page re-seals an active two-player role view. In Solo Hunt, the Monster never has a visible role view.

## Monsters, powers and investigation reports (PR9)

Every Solo Hunt difficulty introduces a different illustrated monster before the first move. Four original portraits are bundled in the site at `assets/monsters/` and reused on the level cards, introductions, search pop-ins and final result.

| Level | Monster | Signature ability | Counterplay |
|---|---|---|---|
| Intro — Hollow Moor | **The Lantern Wisp** | None | A straightforward hunt with ordinary bearings and tracks |
| Apprentice — Thornwood Vale | **The Briar Shade** | Briar Step teleport, 4-turn cooldown | Leaps 2–3 connected roads, but publicly exposes its previous location |
| Tracker — Sunken Lowlands | **The Mire Mimic** | False Sighting, 4-turn cooldown | Plants an **unconfirmed** reported location that is debunked when the Hunter visits |
| Expert — Eclipse Marches | **The Eclipse Herald** | Eclipse Shift teleport (5-turn cooldown) and Phantom Echo decoy (4-turn cooldown) | Combines the two fair rules, never both on one Monster turn |

The powers currently belong to Solo Hunt levels; Pass & Play uses the Intro board and its powerless Lantern Wisp. Existing scenario-specific Veil and Signal Lantern rules are unchanged.

**Why teleport clues remain mathematically useful:** a jump discloses where the Monster was immediately before it vanished and how many connected roads it could jump, not its secret destination. The deduction solver uses the public move event to propagate older clues across the 2–3-road teleport instead of incorrectly treating that turn as a one-road move.

**Why decoys are fair:** the reported position is labelled an **unconfirmed local sighting** and is shown with a question mark, not as a confirmed exact bearing. The Hunter must visit the node to expose the false report. The candidate solver never treats a rumour as certain evidence.

**After every valid Hunter move**, a large illustrated report appears: an empty search names the place and creature; a real trace includes the actual historical bearing clue from locals; a decoy triggers a false-sighting reveal; and a capture gets a victory report. Invalid bearing attempts do not consume a move or generate a pop-in.

Saved games retain power cooldowns, unresolved decoys and which reports have been acknowledged. These elements never appear on an opaque shared-device handoff screen, and the Monster's hidden destination remains private.

## Dry riverbank locations (merged PR8)

**Tracker / The Sunken Lowlands** and **Expert / The Eclipse Marches** now place their rivers through channels **between** rows of dry land nodes, rather than underneath named locations. The rows adjacent to each watercourse have been moved slightly onto the banks without removing any places or changing a single road connection. All 26 Tracker and 36 Expert locations remain playable with their original IDs, clues and scenario objectives. Routes crossing a watercourse remain connected roads.

The painted rivers are defined in `src/waterways.mjs`. Automated geometry tests measure the actual Bezier centreline, including the painted bank width and node radius, and require clear land space around every location. Screenshot QA checks all four maps at desktop and mobile sizes.

## Single-screen HUD, optional protractor and teaching support (PR6)

The active game is designed around a **single viewport**, rather than a vertically scrolling page. On desktop and projector screens, the map fills the left side; current location, remaining moves and bearing entry remain on the right. A compact status strip always shows the round and public mission objective. On portrait tablets/phones, the map is above a compact two-column control and information dock. You can browse long clue histories **within** the Clues tab, without scrolling the entire game. Tabs expose Clues, Notes, Mission details and mathematical Feedback in every mode; none of these can reveal the Monster's private location.

**Manual protractor:** Select **Protractor** above the map at any time during a movement turn. The translucent 360° instrument starts at the active player's location, with 000° north. **Drag its gold tip** to rotate the measuring arm clockwise; **drag its centre** to reposition the ring. Use the +/− buttons for precise one-degree adjustments and **Center** to align it with the current location again. Read the three-figure value and *enter it yourself* to move. The protractor does not choose roads, snap to exits, autofill the input or disclose a correct answer. Hide it whenever you wish.

**Standard (default):** all the original *textual* gameplay hints remain, including watcher reports, earned track clues, route-distance bands on easier difficulties, bearing accuracy feedback and the Signal Lantern. However, clue bearings are **never automatically drawn as rays or sectors on the map**. Players must interpret the text and may use the optional, manually operated protractor.

**Guided / Tutorial mode:** select **Enable Tutorial Help** on the title screen, mission selection or difficulty selection before starting. It provides **the same textual clues and hints** as Standard, but offers an optional **Combine Clues on the Map** control. This overlay remains off until a player deliberately opens it; it can then draw the selected clues for demonstration and be hidden again. The optional manual protractor is available in both modes.

The existing four-question interactive Bearings Field Training is available separately from the menu and from either role’s navigation panel. Guided mode is a setting for the game itself, not a replacement for the training sequence.

Saved games remember whether optional visual assistance was enabled. Older solo saves continue with the same textual clues and their previous visual-assistance setting.

## Learning and deduction tools (PR3)

**Interactive field training.** Select **Interactive Bearings Training** on the home screen or **Bearings Field Training** during the movement turn. Four exercises cover clockwise-from-north bearings, opposite bearings, careful "bearing of A from B" wording, and ranges wrapping across 000°. Every exercise checks a three-figure answer and explains the method.

**Combine clues in Guided mode.** In the Hunter's Clues tab, choose **Combine clues on the map**. Tick or untick observations to see their rays/sectors, highlight possible Monster locations, and list remaining candidate places. The analysis uses only *public observations*: for each time-stamped clue it finds possible locations at the recorded round, advances those possibilities through ordinary one-road moves or publicly announced two-to-three-road teleports, then intersects the sets. It does NOT overlap old clues as if the Monster remained stationary. The overlay may be turned off to restore unaided problem solving.

**Mark and annotate the map.** Click a location or use keyboard/Enter to cycle it through *suspected*, *ruled out*, and unmarked. A location selector offers the same action on phones or when keyboard navigation is preferred. The Hunter can keep written working in a private note area during the current game. Personal marks do not automatically change the mathematically computed candidate set. Marks and notes never appear on Monster or handoff screens and clear when a new game starts.

**Route-distance hints in every mode.** Solo Intro traces show exact shortest-path road distance at their observation time. Apprentice gives a ±1-road band. Tracker and Expert stay direction-only. These refer to connected roads, not straight-line screen distance.

**Mathematics feedback in every mode.** Each successful route reports how far the entered bearing differed from the actual road direction. Invalid bearings never cost a movement. A Hunter progress panel shows successful routes, corrections and average angular error, with a short summary after the game.

See the [Teacher's Guide](docs/TEACHING_GUIDE.md) for curriculum alignment and suggested activities.

## Story missions and counterplay (PR4)

Choose **Explore Story Missions** on the main menu. All three missions work in Solo Hunt or Pass & Play.

| Mission | Monster wins by | Hunter's strategic focus |
|---|---|---|
| **The Long Hunt** | Evading capture through the last round | Decode the trail and intercept |
| **The Last Gate** | Reaching a *publicly marked escape gate* on or after round 5, or surviving the round limit | Guard the gate, cut off road junctions, use the dated clues |
| **Lanternfall** | Visiting both *publicly marked signal beacons*, or surviving the round limit | Protect the beacons and exploit the confirmed sighting from each extinguished beacon |

The gate and beacon locations are deliberately visible to both roles. Monster spawns cannot start directly on the mission objectives. A beacon extinguished by the Monster creates a **public location clue**, labelled with its observation round; historical clues still need movement-time propagation before they can be combined with current evidence.

Special missions give each player one meaningful power:

- **Monster Veil:** once per hunt, check **Use the Veil** when entering a road bearing. It consumes the Veil and hides the new trail *at the arrival location*. The Hunter sees a public notice that the Veil was used, without learning the location. A Veil never defeats direct capture or conceals the loss of a public beacon.
- **Hunter Signal Lantern:** once per hunt, trade **one remaining movement action** for a new approximate compass-sector sighting. The observation is dated, accurate within its stated interval, and works even if the Monster hid a trail with its Veil.

Standard Long Hunt intentionally has no special powers, preserving the original simpler rules.

## Saving and returning to a hunt (PR4)

Games are automatically saved **to the current device's browser storage** while active. You can also choose the compact **Save** control at the bottom of an active Hunter or Monster screen. A home-screen card presents the mission, game mode and round with a **Resume Safely** button.

In **Pass & Play**, loading a saved game always shows the opaque **handoff screen** first, even when it was saved in the middle of a private turn. This prevents a reopened tab from immediately revealing the prior player's map. Hunter's hand-written notes and manual annotations are restored only within the Hunter view; they never appear during Monster or handoff turns.

A save is not tied to a user account, is not synced between devices, and is lost if browser storage is cleared. A person with access to developer tools or browser storage can inspect the hidden state; the shared-device privacy mechanism is an **honour-based classroom safeguard**, not cryptographic anti-cheat. No private game data is uploaded to GitHub.

## New original scenery and responsive maps

The Hollow Moor, Thornwood Vale, Sunken Lowlands and Eclipse Marches have different original SVG scenery: woods, water, reeds, ruins and twilight landmarks. Public objective nodes are highlighted on the maps. The map has **+/− zoom controls**, a scrollable larger view on small screens, descriptive location labels, a numbered location index on larger boards and reduced-motion support.

## Preview and publishing

The repository is a fully static browser game; there is no backend. Two GitHub Actions workflows are included:

- **Build reviewable Shadow Bearings preview:** runs tests and packages a downloadable preview ZIP on PRs. The archive contains the allowlisted website files and no test code or browser save data. Unzip and serve it with a local HTTP server to play.
- **Publish Shadow Bearings to GitHub Pages:** on pushes to main (or manually), runs tests and publishes the website at the Pages URL. In repository **Settings → Pages**, select **GitHub Actions** as the publishing source if GitHub Pages has not been enabled. The publishing run must succeed before a live URL can be claimed.

See [Deployment Guide](docs/DEPLOYMENT.md) for the exact review, launch and rollback workflow.

## Movement and winning

- Use exactly **three digits** such as `035`, `180` or `270`, clockwise from north. `360` is treated as north, `000`.
- Enter an exit bearing to move along a **connected road**; tolerance is ±6°.
- The Hunter moves **up to two roads per turn**, stopping early if desired. A human or computer Monster moves **one road after the Hunter finishes**.
- Reaching the Monster's current location wins immediately. The Monster wins if the Hunter finishes the final round without capture.
- Recent visit traces trigger a bearing clue, sometimes worded in reverse (the bearing of the trace location *from* the Monster). Observation rounds are explicitly labelled.
- In Guided mode, the clue notebook can draw exact rays or sectors, combine evidence from different rounds, and optionally identify candidate locations. On larger maps, use the **Location Index** to match numbered locations to names.
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
npm run build:site
```

`npm test` covers bearings, map validity, north wrapping, clue provenance, quantized uncertainty, exact graph-step propagation, equal textual hint availability in Standard and Guided play, no automatic clue plotting, manual protractor maths, responsive HUD markup, tutorial answers, solo AI, role privacy and browser-UI smoke tests. GitHub Actions runs this test suite on pull requests.

`npm run simulate` runs **60 fixed-seed games per difficulty** with a baseline Hunter bot. That bot uses only its public view, not the Monster's hidden position. Override the sample size with `SIM_GAMES=200 npm run simulate`. The results report capture rates, average rounds, trace discoveries and sightings. They are debugging benchmarks, **not evidence of classroom balance**; student playtesting is still needed.

The application remains dependency-free at runtime. Sources:

- `src/geometry.mjs` — bearings, angle ranges, graph distance
- `src/map.mjs` — four connected maps with validation
- `src/ai.mjs` — deterministic random generator, spawning and evasion logic
- `src/scenarios.mjs` — original mission goals, public landmarks and legal spawns
- `src/scenery.mjs` — four original vector landscapes and title illustration
- `src/persistence.mjs` — validated local saves, Guided setting and safely resealed resume
- `src/protractor.mjs` — manually rotatable SVG 360° bearings measuring tool
- `src/deduction.mjs` — public-clue sector checks and time-aware candidate intersections
- `src/tutorial.mjs` — four interactive bearings practice activities
- `src/engine.mjs` — game rules and strictly role-specific view projections
- `src/app.mjs` — screens, movement controls, clues and illustrated SVG maps
- `scripts/simulate.mjs` — reproducible public-information playtest baseline
- `scripts/package-site.mjs` — allowlisted deployable-site builder

## Future work

**Post-PR4:** classroom difficulty calibration, more narrative maps, genuine server-authoritative two-device online multiplayer, and real-device accessibility improvements. The GitHub Pages workflow publishes once PR4 reaches main and Pages is enabled.

**Security note:** pass-and-play is a practical classroom look-away safeguard, not protection against a malicious person inspecting browser memory or developer tools. Competitive two-device online play would require server-authoritative hidden state.

[Game design](docs/GAME_DESIGN.md) · [Build plan](docs/BUILD_PLAN.md)

This is an **original hidden-movement game**; its artwork, setting, characters and terms do not reuse copyrighted elements of existing games.
