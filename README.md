# Shadow Bearings

**A hidden-movement adventure that makes three-figure bearings part of the strategy.**

One player is the **Hunter**, following an unseen **Monster** through connected locations. Both roles travel using three-figure clockwise bearings measured from north. The Hunter discovers time-stamped clues by entering places recently visited by the Monster and may combine these with occasional public sightings in solo mode. Bearing values appear as text, not automatically drawn rays or sectors on the map.

## Playable modes (PR1–PR13)

### Solo Hunt — Hunter versus Monster AI

On the title screen, choose **Solo Hunt**, then one of four difficulty levels. The Monster automatically takes a hidden move or uses a level-specific power after each completed Hunter turn. The Hunter sees only public information and does not need to pass the device.

| Difficulty | Locations | Trail clue accuracy | Trail lasts | Solo sightings | Monster style | Maximum rounds |
|---|---:|---|---:|---|---|---:|
| Intro | 14 — Blackfen Marsh | Exact | 5 rounds | Every 2 rounds | Wandering | 13 |
| Apprentice | 18 — Duskmere Village | ±15° | 4 rounds | Every 3 rounds | Wary | 15 |
| Tracker | 26 — Rookgate District | ±30° | 3 rounds | Every 4 rounds | Elusive | 18 |
| Expert | 36 — Eclipse Marches | ±45° | 2 rounds | Every 5 rounds | Cunning | 21 |

**Map readability:** every location now has its full name printed next to the node, including on the Tracker and Expert maps. The larger maps retain their two-digit index references inside each node marker for quick look-up. The three generated networks have been expanded into a consistent board footprint without changing their road connections or distorting the bearings shown to players.

**Opening and periodic watcher sightings remain available in every solo difficulty, regardless of Standard or Guided mode.** Their bearings are given in the clue notebook as text; they are not drawn on the map. Every timed sighting remains stamped with its observation round. Hunters also earn trace clues when visiting recent Monster locations.

Monster AI uses legal roads (except for announced bounded teleports), the public Hunter location and history, and its own private recent trail. Four AI profiles vary evasion, avoidance of recent traces, route look-ahead and randomness. **The AI cannot see the Hunter's future decisions.** Given the same seed and moves, its decisions are reproducible for tests.

The Tracker and Expert modes provide progressively less precise information about *when* a trail was left. The clue itself is always mathematically truthful for its recorded observation round.

**PR3 improvement:** approximate bearings are now fixed compass sectors containing the true bearing. Their midpoint no longer reveals the monster's precise direction.

### Pass & Play — Hunter versus a human Monster

The original 14-location graph now appears as the fully illustrated **Blackfen Marsh** countryside. The Monster picks a secret starting point, then the two players alternate.

**Handoff privacy:** all board, clue and position information is replaced by an entirely blank role-transition view containing only the requested handoff text and a reveal button. Switching away from the page re-seals an active two-player role view. In Solo Hunt, the Monster never has a visible role view.

## Blackfen Marsh — first complete landmark world (PR15)

The introductory map is now **Blackfen Marsh**, an original dark, ink-and-watercolour countryside. Its **14 named locations** match 14 distinct locally rendered SVG landmarks rather than generic trees: a timber watch post, pine crossroads, ruined watermill, crow farm, whispering wood, fen chapel, lantern-lit inn, mossy bridge, Blackwater dock, barrow hill, standing stones, timber escape gate, swamp pools and an old quarry.

A single illustrated **Blackfen Run** replaces the previous decorative river that did not match the geography. It visibly connects **Old Swamp → Broken Mill → Moss Bridge → Blackwater Landing**. Where existing road segments cross the stream, compact road-aligned bridge decks are placed from the real shared cubic-water geometry; overlapping generic decks are suppressed around the landmark bridge and dock. The old unrelated decorative terrain captions are gone.

All 14 node IDs **A–N**, 29 connected roads, exact world coordinates, bearings, Hunter start, secret Monster spawns and scenario objectives are unchanged. The Last Gate still uses node L (**East Fen Gate**); Lanternfall beacons remain at L and G (**Lantern Inn**). Existing saved games use those stable IDs and remain valid. The original illustration uses no remote assets and is layered below the interactive node markers, protractor, clues and the customised moving Hunter.

**Blackfen Marsh, Duskmere Village and Rookgate District** now have completed matching names and artwork. **Ravenmarch County** is the final world awaiting its planned regional-art pass in the [Map World Bible](docs/MAP_WORLD_BIBLE.md). Student review should consider landmark recognisability and place-label legibility at 100% and 300% zoom.

## Duskmere Village — illustrated village and millstream (PR16)

The **Apprentice map** is now **Duskmere Village**: 18 named, individually drawn landmarks, each tied to its original, stable node. Distinctive buildings and public spaces include Bell Chapel, North Gate, the leaning Crooked Inn, Baker's Row, Dovecote Hill, West Watch, Market Cross, Village Green, Old Well, Apple Orchard, Smithy Yard and South Beacon. The village uses original vector artwork with muted slate roofs, timber frames, warm windows, cobbled courts and apple-green common land.

A coherent **Duskmere Millstream** winds along the southern node band. It crosses only three real connected roads: **A12–A16**, **A13–A17** and **A14–A18**. The central **Stone Bridge** is drawn exactly at the existing A13–A17 crossing and replaces the overlapping generic bridge decal; the other crossings retain small road-aligned decks. The stream passes Mill Stream, a dammed **Mill Pond** east of the causeway, and **Willow Bank**. No node position, bearing or Monster movement has changed.

Duskmere keeps **18 node IDs, 33 connected roads and Hunter start A08**. The Last Gate goal remains **A03 (North Gate)** and Lanternfall retains **A03 (North Gate)** and **A18 (South Beacon)**. Existing saved games and replays use those same IDs. Artwork stays beneath the interactive map, with desktop, portrait-mobile and landscape checks.

## Rookgate District — Gothic Canal City (PR17)

The Tracker region is now a coherent **26-location canal city**, not a generic wetland. Every approved Rookgate location has an original, identifiable inked SVG landmark, including the North Gate, Bell Tower, Cloth Market, Canal Steps, Salt Wharf, Customs House, Lantern Square, Guildhall Court, Tanner's Row, Foundry Yard, Rat Alley, Prison Yard, Ferry Landing, Miller's Wharf and Flood Lock. Slate rooftops, warehouses, stone streets, city walls, gas lanterns, industrial quays and civic squares have a distinctly urban palette and scale.

The northern deep navigable **Rookgate North Canal** and the southern industrial **Rookgate South Canal** reuse the actual validated centreline geometry used by graph-road crossing detection. The northern canal has **four** real road bridges; the southern canal has **five**. All nine road-aligned crossings are rendered as granite city bridges, not mistaken for new playable connections. Wharves, canal steps, the ferry boat and lock gates now sit physically beside or over their named canals. The roads and node centres remain safely on dry banks.

**The original 26 nodes, 46 edges, node coordinates and bearings are unchanged.** The Hunter still begins at **T10 West Watch**. The Last Gate objective still uses **T04 North Gate**; Lanternfall still uses **T04 North Gate** and **T23 South Watch**. Existing saved games and postgame replays continue to use the stable location IDs. The revised city scenery sits below roads, numbered nodes, the personal Hunter character and clues, with full-location name labels on all zoom levels.

## Monsters, powers and investigation reports (PR9)

Every Solo Hunt difficulty introduces a different illustrated monster before the first move. Four original portraits are bundled in the site at `assets/monsters/` and reused on the level cards, introductions, search pop-ins and final result.

| Level | Monster | Signature ability | Counterplay |
|---|---|---|---|
| Intro — Blackfen Marsh | **The Lantern Wisp** | None | A straightforward hunt with ordinary bearings and tracks |
| Apprentice — Duskmere Village | **The Briar Shade** | Briar Step teleport, 4-turn cooldown | Leaps 2–3 connected roads, but publicly exposes its previous location |
| Tracker — Rookgate District | **The Mire Mimic** | False Sighting, 4-turn cooldown | Plants an **unconfirmed** reported location that is debunked when the Hunter visits |
| Expert — Eclipse Marches | **The Eclipse Herald** | Eclipse Shift teleport (5-turn cooldown) and Phantom Echo decoy (4-turn cooldown) | Combines the two fair rules, never both on one Monster turn |

The powers currently belong to Solo Hunt levels; Pass & Play uses the Intro board and its powerless Lantern Wisp. Existing scenario-specific Veil and Signal Lantern rules are unchanged.

**Why teleport clues remain mathematically useful:** a jump discloses where the Monster was immediately before it vanished and how many connected roads it could jump, not its secret destination. The deduction solver uses the public move event to propagate older clues across the 2–3-road teleport instead of incorrectly treating that turn as a one-road move.

**Why decoys are fair:** the reported position is labelled an **unconfirmed local sighting** and is shown with a question mark, not as a confirmed exact bearing. The Hunter must visit the node to expose the false report. The candidate solver never treats a rumour as certain evidence.

**After every valid Hunter move**, a large illustrated report appears: an empty search names the place and creature; a real trace includes the actual historical bearing clue from locals; a decoy triggers a false-sighting reveal; and a capture gets a victory report. Invalid bearing attempts do not consume a move or generate a pop-in.

Saved games retain power cooldowns, unresolved decoys and which reports have been acknowledged. These elements never appear on an opaque shared-device handoff screen, and the Monster's hidden destination remains private.

## Illustrated mission briefings and Tutorial Help (PR10)

**Every Solo level begins with an illustrated mission briefing**, showing the Monster Hunter and that level's own monster portrait. It explains that you are the Hunter, that visiting places recently occupied by the Monster can reveal dated evidence, that the creature keeps moving secretly, and how its particular power changes the search. The victory message uses the real difficulty's limit: **Intro 13 rounds, Apprentice 15, Tracker 18, Expert 21**. The message also warns of early-win objectives in The Last Gate and Lanternfall missions. No hidden Monster position is revealed.

Choose **HOW TO PLAY** from the level briefing, **HOW TO HUNT & BEARINGS TRAINING** during a Hunter turn, or the training option on the main menu. This now opens **seven illustrated How to Hunt steps**, in sequence:
1. Your role and victory condition.
2. Moving along connected roads using three-figure clockwise bearings.
3. Finding a recent trail and reading collected evidence.
4. Interpreting “bearing of A from B”, reverse bearings and ranges.
5. Accounting for the Monster's movements *after* an older sighting.
6. Distinguishing disclosed teleport origins from unconfirmed false sightings.
7. A repeatable turn-by-turn checklist.

After these steps, the original **four interactive bearings exercises** remain available, with immediate answer feedback. Players can also skip directly to the exercises and close the tutorial without losing the current hunt.

**Guided mode now includes a COACH tab**. It gives contextual, student-friendly instructions at the start of the hunt and after searches, invalid bearing attempts, announced special powers or the final rounds. It can show the bearing of **one connected road as a worked *text-only* example on request**, and offers shortcuts to Clues, the manual protractor and the full guide. The Coach and worked example operate on public Hunter information, not secret Monster state.

**Standard play is unchanged:** it receives the same earned clues, sightings and bearing-entry feedback, but not the Coach or optional combined-clue plotting. Neither mode automatically draws bearing rays or sectors on the map: the optional Guided clue overlay is activated deliberately from Clues.

## Hunter Forge on the board — matching travelling Hunter (PR13)

Your saved Hunter Forge design is now **the actual visible Hunter piece on the map**. The mini figure uses the very same SVG head, torso, legs, complexion and palette drawings that appear in the character creator, level briefing and HUD. It is a compact shield-backed, dark-fantasy figurine positioned beside the **highlighted, numbered location marker**, rather than covering that marker. The Hunter stays identifiable on all four map sizes, all Solo difficulties, Pass & Play Hunter/Monster turns, the endgame results and the **The Hunt, Replayed** timeline.

A successful entered bearing advances the figure along the actual road from the previous node to the new one in a short 380 ms movement. The animation is displayed after the Hunter search-result report closes, rather than wasting the movement behind that modal. Invalid bearings do not animate or move the figure. The figure is not draggable: the movement rules still require **three-figure bearings** and connected roads. The miniature does not intercept taps, clicks, key presses, map annotations, protractor gestures or zoom controls. It remains within the map boundary near northern, eastern and southern edges.

**Accessibility:** when the device asks for reduced motion, the miniature jumps instantly to the correct location. The underlying numbered location and label remain visible and usable. The chosen outfit remains stored locally, just as in PR11; no new gameplay save data is required, and secret Monster movement cannot be revealed through the avatar. Endgame replay uses the same miniature as its Hunter marker and a distinct Monster marker.

## The Hunt, Replayed — optional post-game chase reveal (PR12)

After every completed Solo Hunt or Pass & Play game, **The Hunt, Replayed** automatically begins once any final investigation report is dismissed. Both characters' positions become visible on the original illustrated map, starting with their previously hidden initial locations and advancing **in the exact recorded order**. Hunter travel, turns where the Hunter chose to remain in place, optional Signal Lantern use and the Monster's secret movements each have their own replay step. Signature teleports are labelled and drawn as distinct dashed jumps, and the Veil is explained without rewriting the historical movement. Both routes build up as the replay advances; the screen never shows the future portion of either path early.

Two high-contrast **H / M** map pieces identify the Hunter and Monster, including offset pieces when they occupy the same location. The right-hand panel names both current locations and explains the action that just happened. The existing map's zoom controls remain available.

Use **Pause / Play**, **Back**, **Next**, the accessible **timeline scrubber**, **1× / 2× speed**, **From Start**, or **Skip Replay · See Results** at any point. The final move stays on screen until **See Final Results** is chosen. The results screen retains the original outcome, numerical learning stats and full Monster route and adds **Watch the Hunt Again**. Auto-play respects the device's reduced-motion preference (start paused when reduced motion is requested).

Replay data is constructed **only** from the finished game's chronological history; neither an active Hunter or Monster view nor any sealed two-player handoff can access the replay data. Active saved games preserve the same history to allow a complete replay after resuming. Older saves with sparse history display only what was actually recorded, never invented movement. Completing the game still clears the active-game local save as before.

## Hunter Forge — create your own Monster Hunter (PR11)

**Hunter Forge** is an original modular gothic-fantasy character creator, accessible on the home screen, mission selection and difficulty selection. It uses a hand-drawn inked SVG figure assembled from **4 heads × 4 torsos × 4 leg styles × 6 coordinated colour palettes = 384 outfit combinations**, plus four independently selectable complexions.

Choose from a shadow hood, witchfinder hat, iron visor or windswept hair; longcoat, ranger cloak, stitched gambeson or warden armour; and trail boots, greaves, marsh gaiters or riding boots. Six palettes include Moss & Leather, Ash & Crimson and Midnight & Steel. The visual style has dark fantasy and monster-hunting influences but consists entirely of original, deterministic vector drawing — no artwork or protected characters from existing game franchises.

Use **Randomise**, **Reset to Default**, or **Save My Hunter**. Selections have live visual feedback. Cancel returns to the previous menu without overwriting the saved design. The appearance is saved in the browser's device-local storage under a separate `shadow-bearings.hunter-forge.v1` key, with strict validation and a session-only fallback when storage is disabled; it does not alter gameplay saves or give strategic advantages.

The selected Hunter appears on the **level introduction** alongside that level's unique Monster, in the first How to Hunt tutorial step and in the **Hunter's HUD** as a compact, consistent bust. The pass-and-play handoff screen remains fully blank apart from the required instruction and reveal control, preserving role privacy.

**Hunter Forge board integration (PR13):** the same customised outfit is now visible as the moving Hunter figurine on each map, while the numbered location marker and bearing-entry movement rules remain unchanged.

## Dry riverbank locations (merged PR8)

**Tracker / Rookgate District** and **Expert / The Eclipse Marches** now place their rivers through channels **between** rows of dry land nodes, rather than underneath named locations. The rows adjacent to each watercourse have been moved slightly onto the banks without removing any places or changing a single road connection. All 26 Tracker and 36 Expert locations remain playable with their original IDs, clues and scenario objectives. Routes crossing a watercourse remain connected roads.

The painted rivers are defined in `src/waterways.mjs`. Automated geometry tests measure the actual Bezier centreline, including the painted bank width and node radius, and require clear land space around every location. Screenshot QA checks all four maps at desktop and mobile sizes.

## Single-screen HUD, optional protractor and teaching support (PR6)

The active game is designed around a **single viewport**, rather than a vertically scrolling page. On desktop and projector screens, the map fills the left side; current location, remaining moves and bearing entry remain on the right. A compact status strip always shows the round and public mission objective. On portrait tablets/phones, the map is above a compact two-column control and information dock. You can browse long clue histories **within** the Clues tab, without scrolling the entire game. Tabs expose Clues, Notes, Mission details and mathematical Feedback in every mode; none of these can reveal the Monster's private location.

**Manual protractor:** Select **Protractor** above the map at any time during a movement turn. The translucent 360° instrument starts at the active player's location, with 000° north. **Drag its gold tip** to rotate the measuring arm clockwise; **drag its centre** to reposition the ring. Use the +/− buttons for precise one-degree adjustments and **Center** to align it with the current location again. Read the three-figure value and *enter it yourself* to move. The protractor does not choose roads, snap to exits, autofill the input or disclose a correct answer. Hide it whenever you wish.

**Standard (default):** all the original *textual* gameplay hints remain, including watcher reports, earned track clues, route-distance bands on easier difficulties, bearing accuracy feedback and the Signal Lantern. However, clue bearings are **never automatically drawn as rays or sectors on the map**. Players must interpret the text and may use the optional, manually operated protractor.

**Guided / Tutorial mode:** select **Enable Tutorial Help** on the title screen, mission selection or difficulty selection before starting. It preserves **the same textual clues and hints** as Standard and adds a contextual **Coach tab**, optional text-only worked road bearing and **Combine Clues on the Map** control. The combined-clue overlay remains off until the player chooses it; the manual protractor is available in both modes.

The seven-step illustrated How to Hunt guide leads into the existing four-question interactive Bearings Field Training. It is available from the menu, pre-level briefing and during a movement turn. Guided mode is a setting for the game itself, not a requirement to access the guide.

Saved games remember whether optional visual assistance was enabled. Older solo saves continue with the same textual clues and their previous visual-assistance setting.

## Learning and deduction tools (PR3)

**Illustrated How to Hunt and interactive field training.** Open Tutorial Help from the menu, briefing or a Hunter turn. Seven illustrated game-play steps come first, followed by four practice exercises covering clockwise-from-north bearings, opposite bearings, "bearing of A from B" wording and ranges wrapping through 000°. Each exercise checks a three-figure answer and explains the method.

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

Blackfen Marsh, Duskmere Village and Rookgate District have complete location-specific inked SVG scenery. The final Eclipse Marches map retains its earlier scenery until the planned Ravenmarch County replacement. Public objective nodes are highlighted on the maps. The map has **+/− zoom controls**, a scrollable larger view on small screens, descriptive location labels, a numbered location index on larger boards and reduced-motion support.

## Preview and publishing

The repository is a fully static browser game; there is no backend. GitHub Actions runs test, visual QA, preview packaging and Pages publishing workflows:

- **Build reviewable Shadow Bearings preview:** runs tests and packages a downloadable preview ZIP on PRs. The archive contains the allowlisted website files and no test code or browser save data. Unzip and serve it with a local HTTP server to play.
- **Shadow Bearings viewport visual QA:** uses Chromium to verify opening artwork, tutorial, Coach, clue visibility, mobile/desktop layout and game navigation, with screenshots available as a workflow artifact.
- **Publish Shadow Bearings to GitHub Pages:** on pushes to main (or manually), runs tests and publishes the website at the Pages URL. In repository **Settings → Pages**, select **GitHub Actions** as the publishing source if GitHub Pages has not been enabled. The publishing run must succeed before a live URL can be claimed.

See [Deployment Guide](docs/DEPLOYMENT.md) for the exact review, launch and rollback workflow.

## Movement and winning

- Use exactly **three digits** such as `035`, `180` or `270`, clockwise from north. `360` is treated as north, `000`.
- Enter an exit bearing to move along a **connected road**; tolerance is ±6°.
- The Hunter moves **up to two roads per turn**, stopping early if desired. A human or computer Monster normally moves **one road after the Hunter finishes**, except for announced Solo-monster teleports.
- Reaching the Monster's current location wins immediately. The Monster wins if the Hunter finishes the final round without capture.
- Recent visit traces trigger a bearing clue, sometimes worded in reverse (the bearing of the trace location *from* the Monster). Observation rounds are explicitly labelled.
- In Guided mode, the clue notebook can draw exact rays or sectors, combine evidence from different rounds, and optionally identify candidate locations. On larger maps, use the **Location Index** to match numbered locations to names.
- At the end of the game, a skippable chronological replay reveals both actual movement routes before the original results and full Monster trail.

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

`npm test` covers modular mini Hunter artwork, avatar map placement and animation, bearings, map validity, north wrapping, clue provenance, quantized uncertainty, exact graph-step propagation, equal textual hint availability in Standard and Guided play, no automatic clue plotting, manual protractor maths, responsive HUD markup, all four illustrated and round-accurate monster briefings, seven-step guide content, contextual public-information Coach, tutorial answers, solo AI, role privacy and browser-UI smoke tests. GitHub Actions runs the suite on pull requests.

`npm run simulate` runs **60 fixed-seed games per difficulty** with a baseline Hunter bot. That bot uses only its public view, not the Monster's hidden position. Override the sample size with `SIM_GAMES=200 npm run simulate`. The results report capture rates, average rounds, trace discoveries and sightings. They are debugging benchmarks, **not evidence of classroom balance**; student playtesting is still needed.

The application remains dependency-free at runtime. Sources:

- `src/geometry.mjs` — bearings, angle ranges, graph distance
- `src/map.mjs` — four connected maps with validation
- `src/ai.mjs` — deterministic random generator, spawning and evasion logic
- `src/scenarios.mjs` — original mission goals, public landmarks and legal spawns
- `src/scenery.mjs` — shared original vector landscapes and title illustration
- `src/blackfen.mjs` — Blackfen's canonical 14 place names, site artwork and hydrology-tied SVG countryside
- `src/duskmere.mjs` — Duskmere's 18 named village landmarks, market/green, millpond and stream-backed artwork
- `src/rookgate.mjs` — Rookgate's 26 individual Gothic city landmarks, illustrated quays, rooftops and two true canals
- `src/persistence.mjs` — validated local saves, Guided setting and safely resealed resume
- `src/protractor.mjs` — manually rotatable SVG 360° bearings measuring tool
- `src/deduction.mjs` — public-clue sector checks and time-aware candidate intersections
- `src/tutorial.mjs` — four interactive bearings practice activities
- `src/hunter-guide.mjs` — seven illustrated How to Hunt lessons, level briefings and public-information Guided Coach
- `src/hunter-forge.mjs` — validated modular SVG Hunter artwork, mini board figure, palettes, randomisation and device-local persistence
- `src/hunt-replay.mjs` — privacy-safe post-game event reconstruction, progressive paths and replay map projections
- `src/engine.mjs` — game rules and strictly role-specific view projections
- `src/app.mjs` — screens, movement controls, clues and illustrated SVG maps
- `scripts/simulate.mjs` — reproducible public-information playtest baseline
- `scripts/package-site.mjs` — allowlisted deployable-site builder

## Future work

**Post-PR17:** Build Ravenmarch County's 36-location regional map, including its coherent Blackwater river, mountains, farms, ruins and frontier. Then undertake cross-world visual consistency and classroom playtesting. Continue student review of Hunter Forge miniature readability and movement timing; classroom difficulty calibration, genuine server-authoritative two-device online multiplayer, and real-device accessibility improvements. The GitHub Pages workflow publishes main-branch changes when Pages is enabled.

**Security note:** pass-and-play is a practical classroom look-away safeguard, not protection against a malicious person inspecting browser memory or developer tools. Competitive two-device online play would require server-authoritative hidden state.

[Game design](docs/GAME_DESIGN.md) · [Build plan](docs/BUILD_PLAN.md)

This is an **original hidden-movement game**; its artwork, setting, characters and terms do not reuse copyrighted elements of existing games.
