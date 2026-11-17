# Shadow Bearings — Game Design Specification (v0.1)

> **Status:** design proposal, pending playtesting. An original bearings-based hidden-movement game; not an adaptation of another game's protected characters, story or artwork.

## 1. Player experience

The **Hunter** navigates an illustrated network of connected locations while following an unseen **Monster**. The Monster's previous visits leave **traces**, which can give directional information when investigated. The Hunter must use clues and the geometry of the map to narrow down possibilities, predict escape routes, and intercept. In solo mode the Monster is AI-controlled; pass-and-play supports one Hunter and one Monster.

**Design pillars:** (1) meaningful bearings every turn, (2) deduction rather than guessing, (3) genuine hidden information, (4) clear feedback, (5) a fair, replayable cat-and-mouse contest.

## 2. Board and coordinates

- Board is a graph of numbered **nodes** (villages, crossroads, ruins) connected by visually obvious routes. Each node has fixed (x,y) coordinates; north is screen-up.
- Routes may be straight or curved for artwork but their movement bearing is calculated from node center to node center; mark routes with exact bearings or a compass tool as needed.
- All playable edges must have bearings differing by enough to select unambiguously. For v1, require at least 12° separation between outgoing edges at each node, and snap entered bearings to the intended edge within a clearly displayed tolerance (e.g. ±5°). Do not randomly accept an ambiguous bearing.
- Use **three-figure clockwise bearings from north**: `000°` north, `090°` east, `180°` south, `270°` west. Coordinates: `bearing = (atan2(dx, -dy)*180/PI+360)%360` for screen y increasing downwards.
- A visual compass/north arrow remains visible. Support typed bearings and, later, optional drawing/rotating protractor; learning mode can show allowable exits.
- Maps should be hand-authored and validated, not naïvely random: graph connectivity, no isolated spawn, distinct local exit bearings, multiple viable pursuit paths, reasonable clue density, and fair capture opportunities.

## 3. Turn sequence (first playable ruleset)

1. Game setup: Hunter starts at a known base. Monster chooses or is assigned a **secret starting node**. Avoid immediate capture and guarantee at least two valid first moves.
2. **Hunter turn:** choose a route by entering its three-figure bearing. Hunter can traverse **up to two graph edges**. Each entered bearing applies from the current node. The Hunter may stop after one edge, inspect locations visited, review unlocked clues, annotate the map, and optionally attempt capture.
3. **Investigation:** entering a node triggers a trace investigation if the Monster visited recently, including if the Monster is there. Previously collected traces should not award the same clue repeatedly.
4. **Capture:** when the Hunter arrives at the Monster's *current* node during the Hunter's movement, the Hunter wins immediately. Do not reveal capture results only after the pass screen.
5. **Monster turn:** after the Hunter completes the turn, the Monster moves **one edge** by entering a bearing, or optionally **rests** (limited uses; resting leaves a stronger trail). The Monster sees their own location and previous trail, and the Hunter's public position. Hidden movement is never shown to the Hunter.
6. Increment the full-round counter after the Monster move. If the Monster survives through the final allowed Hunter turn, the Monster wins. For a later scenario mode, add a distinct escape objective instead of just survival.

**Important:** Monster's movement always occurs *after* Hunter's movement, but clues should always have an explicit sampling time, e.g. 'relative to the monster at the end of round 5'. Clues must be computed from a valid historical snapshot, not from a subsequently updated Monster location.

## 4. Traces and clue types

A trace is associated with a Monster node visit and can persist for a specified number of rounds. On entering such a node the Hunter receives **a clue**. Exact clue contents depend on scenario difficulty:

- **Exact reverse bearing:** 'At the end of round 6, the bearing of the Hunter's current location from the Monster was 245°.' Geometrically this means the Monster was located along the **reverse bearing** (065°) from the Hunter's sample position. Display both the wording and the time index clearly. Crucial: use positions **at clue sampling time**, not positions at discovery time.
- **Directional sector:** 'The bearing of the Monster from this trace location at the end of round 6 was between 040° and 080°.' Draw an optional translucent compass sector.
- **Distance band:** 'At the end of round 6, the Monster was between 2 and 4 route-steps from this location.'
- **Combined clue:** direction sector **and** route-step distance band, stronger than either by itself.
- **Freshness/age clue:** tells how many completed rounds ago the trail was laid (exact on easy, band on hard).
- **Public pulse (optional):** periodic approximate location, or one of several map regions, to avoid stalemates.

**Time consistency:** The simplest prototype makes traces a *record of a visit*, while the clue is calculated from the Monster position at the **moment the trace was left**, where it could be zero distance and thus bearing would be undefined. Therefore v1 must instead fix each clue's reference to the **Monster's position at a later recorded round boundary** (for example the most recent Monster position **before the Hunter investigates**), and record that snapshot's round number. The trace is the trigger to release the later positional clue. This prevents meaningless bearings to the Monster at the trace itself.

**Suggested v1 canonical clue:** on Hunter arrival at a trail node, create a directional sector **from that trail node toward the Monster's most recently completed location**, as of the beginning of the Hunter turn. Store `originNodeId`, `targetMonsterNodeId` (private), `observedRound`, `bearingMin`, `bearingMax`, `type`, and `discoveredRound`. If target equals origin, give a unique 'the monster was here at the last observation' proximity clue instead of a bearing. The Hunter sees the clue but never the private target node.

**Critical distinction:** 'bearing of the Hunter from the Monster' is the opposite of 'bearing of the Monster from the Hunter'. Teach both wordings; render bearing lines from the correct reference point.

**Example:** Monster at node M, Hunter at node H. 'Bearing of Hunter from Monster = 240°' implies bearing of Monster from Hunter = 060°. A 040°–080° clue means the Monster may be anywhere along that sector, subject to legal movement.

## 5. Difficulty design

Tune **several orthogonal dimensions** rather than only map size:

| Setting | Intro | Apprentice | Tracker | Expert |
|---|---|---|---|---|
| Nodes | ~12 | ~18 | ~26 | ~36 |
| Hunter edges per turn | 2 | 2 | 2 | 2 |
| Monster edges per turn | 1 | 1 | 1 | 1 |
| Trail lifetime | 5 rounds | 4 | 3 | 2 |
| Clue quality | exact (±0°) | ±15° | ±30° | ±45° |
| Clue age | exact | exact | ±1 round | age band |
| Directional help | highlighted exits | compass + tolerance | compass only | compass only |
| AI evasiveness | low | moderate | high | high |
| Public signal | frequent | occasional | rare | rare |
| Round cap | playtest | playtest | playtest | playtest |

These are **initial experimental values**, not claims of proven balance. Clues should never contain false information; wider ranges indicate uncertainty, not deception. Guarantee trail encounters at lower levels or provide scheduled clues to avoid long information droughts.

AI must not use private Hunter intentions or future moves. It may use already-visible Hunter locations, map graph and its own trail. Start with a weighted strategy: increase distance from Hunter, avoid choke points, limit backtracking into fresh traces, choose between plausible routes at random. Difficulty may change weights and lookahead, not grant supernatural knowledge.

## 6. Solo play

- Choose difficulty then see a short interactive tutorial (three-figure bearings, compass, finding the reverse bearing).
- Hunter player enters bearings and receives normal feedback: intended route, accepted bearing, distance of error.
- AI Monster takes its turn behind an automatic neutral transition, with a short non-revealing movement cue; it never displays Monster position.
- Allow restart with same map seed or new generated scenario; end-game replay can reveal the hidden route.
- Record optional maths-focused stats: bearing accuracy, number of clues used, turns to capture, and false leads; avoid rewarding aimless grinding.

## 7. Pass-and-play privacy

Game state machine must have **sealed role screens**, not merely a transparent overlay. Example:

`HUNTER_ACTIVE -> HANDOFF_TO_MONSTER -> MONSTER_ACTIVE -> HANDOFF_TO_HUNTER -> HUNTER_ACTIVE`.

Required handoff display, completely full-screen, no map, minimap, clue, history, coordinates, hover text, preview or revealing animation:

> **Pass this device to the monster and look away**

A single large button **'I am the Monster — reveal my turn'** opens the Monster screen. After the Monster finishes, hide *all* Monster-specific information and display:

> **Pass this device to the hunter and look away**

Then **'I am the Hunter — reveal my turn'**. Ensure both transitions occur even for resting / turn skip / capture edge cases. Inactivity or app backgrounding should re-seal the private view; browser back/forward or refresh must not inadvertently display the wrong role. Turn logs, browser console, local storage, and accessibility annotations should not casually expose secret state in the UI. For a genuinely adversarial online mode, private game state needs to live on a server and each client must receive only authorised data.

Pass-and-play relies on players following look-away instructions: it is a practical classroom privacy safeguard, **not an anti-cheat guarantee** against a determined person holding the same device.

## 8. Visual and UX direction

- Original moody illustrated landscape: misty woods, crossing rivers, abandoned observatories, lantern-lit villages. Avoid using characters or art from existing franchises.
- Legible board with consistent node symbols and high-contrast connections; accessibility mode with reduced motion, larger text, stronger contrast and non-colour clues.
- Hunter: visible compass, current location, collected clue notebook, annotated bearing rays/sectors, round counter and remaining actions.
- Monster: visible private position and recent path, Hunter's latest public location, allowable next connections, remaining stealth abilities.
- Responsive on classroom projector and touch devices; input via keyboard and on-screen keypad.
- Three-figure bearing formatting and examples in all modes; distinguish bearing from direction, and avoid fake mathematical precision on curved roads.

## 9. Edge cases and validation

- Hunter and Monster may share a node after a Monster turn; capture occurs only when Hunter arrives or begins a valid check on that node, at the next Hunter turn.
- Revisits must not generate duplicate infinite rewards; clue ages/fade are deterministic.
- No bearing exists from a location to itself; use proximity alternative.
- Exact 000° vs 360°: display `000°` as standard and optionally accept `360°` as equivalent in student input.
- Angular clue intervals wrapping north need modular treatment, e.g. 350°–020°.
- A hunter with 2 edges can stop early. Validate movement per edge, not one long straight line across multiple nodes.
- Handle disconnected-looking map art, close bearings, stale clues, browser resize, refresh, end of game and role-transition privacy.
- Add seeded deterministic scenarios and unit tests for bearing computations, reverse bearings, angular ranges, trail expiry, clue provenance, capture and state transitions.

## 10. Questions for playtesting

- Does the Hunter find enough traces for the game to involve deduction rather than random wandering?
- Is two Hunter edges versus one Monster edge too strong on small maps?
- Do bearing clues genuinely eliminate candidate nodes?
- Does the Monster have meaningful risk/reward choices?
- How many rounds make a satisfying 10–15-minute classroom session?
- Can a student unfamiliar with hidden movement understand the game after a one-minute tutorial?
