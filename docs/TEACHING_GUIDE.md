# Shadow Bearings — Teacher's Field Guide

## Aim

Students apply **three-figure bearings measured clockwise from north** to navigate connected roads, reverse bearings, evaluate uncertainty and combine evidence from several rounds of an unseen opponent's movement. Rather than choosing a rule because a worksheet labels it, they choose a method because it helps a real in-game decision.

Best suited to a 15–25 minute lesson activity or a short follow-up after introducing bearings; students can use **Solo Hunt** individually or **Pass & Play** with another student.

## Preparation

- Start with **Intro** for new learners; the 14-location map has simpler roads, exact earned trace bearings and periodic watcher sightings in every mode. Guided is only needed for the optional visual clue overlay.
- **Apprentice** introduces 30°-wide clue sectors and ±1-road distance bands in both Standard and Guided.
- **Tracker** and **Expert** increase graph complexity, reduce information and increase Monster evasiveness.
- Students need a device supporting keyboard or touch; no external calculator or additional app is required. The optional on-map **360° protractor** can be used during every movement turn.
- Interactive Field Training is available from the main menu and during the Hunter turn.
- No account, sign-in, grading backend or saved progress is required for the prototype.

## Suggested 20-minute teaching sequence

**1. Model (3 minutes).** Draw a north arrow and a road to the southeast. Remind students to measure clockwise from north. Enter a three-figure bearing. Ask which *point* the bearing statement starts from.

**2. Scaffolding (4 minutes).** Use the four practice challenges: cardinal bearings, reverse directions, “bearing of Hunter from Monster” wording, and a compass interval wrapping through 000°.

**3. Independent play (9 minutes).** Students play Solo Hunt on Intro or Apprentice in **Standard mode**. Give the instruction: *read the bearing clues, then measure on the map before moving*. The notebook still supplies numerical bearings and distance information, but never draws them automatically. Use the optional draggable protractor and encourage handwritten or in-game notes.

**4. Deduction (3 minutes).** Once a few clues exist, ask students to mark their candidate locations manually. In a separate Guided demonstration, open the Clues tab's **Combine Clues on the Map** tool. Check the dates. Choose two clues and discuss why older clues cover more candidate locations when the Monster has already moved since the observation.

**5. Reflect (1 minute).** Discuss which bearings required re-measurement and which earned clue changed their decision. Mathematical feedback and bearing-entry accuracy remain visible in all modes. A student can retry with a new random Monster route.


## Manual protractor and text-first clues

When a movement turn begins, the map and bearing entry sit on a **fixed-height gameplay screen**. The round, active role, current location, movement count and mission objective are all visible. Clues, Notes and Mission are tabs; the secondary content may scroll internally, but the game page itself should not.

Students can select **Protractor** above the map. The transparent 360° protractor starts at their current location. Ask them to place the instrument's centre on the origin, rotate the **gold measuring tip** until it lines up with the chosen road, read the number **clockwise from north** and independently enter the three-figure bearing. The centre and tip are separately draggable by mouse or touch; +/− buttons adjust the displayed measure by a degree for keyboard users. There is no road snapping or auto-filling.

In **Standard mode**, opening and scheduled watcher sightings, track clues, distance bands on easier levels, connected-road descriptions, mathematical feedback, public mission events and Signal Lantern clues remain available. Students read these as text. **The game does not draw the given bearing as a line or sector**: they must interpret it themselves. An invalid bearing entry still does not consume a move.

For a scaffolded group, select **Enable Tutorial Help** before starting a hunt. Guided mode does not add or remove numerical clues; it makes the optional **Combine Clues on the Map** button available. The overlay is initially off and only draws a bearing or sector after a player clicks it. Return to Standard when students are ready to interpret all written clues without a plotting aid.

**Suggested differentiation:** Let students use the protractor for their first three moves, then ask them to estimate bearings before checking with the protractor. At the end, ask for written justification of one reverse bearing.

## Working with the four monsters (PR9)

The illustrated level-introduction screen explains the opponent *before play starts*. The monsters have escalating powers and a deliberate evidence-literacy progression:

| Difficulty | Creature | Mathematical focus |
|---|---|---|
| Intro | The Lantern Wisp | Honest bearings, connected routes and recent trace clues; no power |
| Apprentice | The Briar Shade | **Time-indexed location fixes.** A teleport moves 2–3 connected roads; the starting place of the jump is publicly known |
| Tracker | The Mire Mimic | **Reliable vs unreliable evidence.** An unverified report might be false. Students must investigate the claimed location |
| Expert | The Eclipse Herald | **Combining constraints with exceptions.** Students account for both public teleports and rumours without conflating them with certain observations |

**Suggested classroom discussion:** Ask which clue can be used to *prove* something. An actual trail trace, a watcher bearing, a beacon location and a teleport **origin** are genuine game evidence. An unconfirmed local rumour is not. Until the Hunter visits that node, the claim must be kept separate rather than fed into mathematical intersections.

A teleport reported in round 5 says only that the Monster was at the named starting location just before its round-5 movement and travelled **between two and three connected roads** during that turn. It does not reveal where the Monster ended up. The clue-combination tool therefore advances older observations across a bounded multi-road jump, not one ordinary road. This distinction is especially useful for AO2/AO3 reasoning.

After every valid Hunter move, a large illustrated **investigation report** says either that the search yielded no evidence, gives the discovered bearing in a local-witness sentence, exposes a fake sighting or announces capture. The report is a narrative representation of the actual game result, not an extra hint or a new separate turn. Students can dismiss it to resume the same single-screen dashboard. A false sighting becomes disproved **only when the Hunter physically lands on it**.

For 4MA1 Foundation, the most accessible progression is Intro followed by Apprentice. Introduce the Tracker's unverified sightings as an extension, asking students to distinguish credible mathematical evidence from a statement that needs verification. Class balancing of advanced Monster cooldowns has not yet been completed.

## Mathematical conventions

| Concept | Example |
|---|---|
| Three-figure bearings | North 000°, east 090°, south 180°, west 270° |
| Clockwise | From north toward the direction of travel |
| Reverse bearing | 065° becomes 245°; 240° becomes 060° |
| Wording | “Bearing of Hunter **from** Monster” starts at the Monster |
| Wrap through north | Sector 350°–010° covers north, not 340° |
| Interval width | 045°–075° covers 30°, not “exactly 060°” |
| Route distance | Count minimum connected road segments, not physical straight-line distance |
| Observation age | A clue from the end of round 3 may be outdated by round 6, because the Monster moved since then |

### Worked clue example: reverse direction

The clue says **“At the end of round 5, the bearing of the Hunter from the Monster was 250°.”** This starts at the Monster. To find the bearing of the Monster from the Hunter, subtract 180°:

250° − 180° = **070°**.

Draw a ray from the Hunter's recorded position toward 070°. If the clue is a sector, reverse *both endpoints* by 180°; the included range remains an interval rather than an exact line. Do not assume the monster is currently on that line if the clue is from an older round.

### Worked clue example: movement after the snapshot

A clue puts the Monster somewhere in a 040°–080° sector as of the **end of round 4**. At the beginning of round 6, the Monster has made **one completed move** since that observation (during round 5). First identify nodes inside the old sector, then include **their neighbours** as possible present positions. Crossing with another clue at a different observation time is more accurate than simply overlapping the two old sectors.

### Why sector midpoint is not secretly the answer

In PR3, the game places each true direction inside a fixed compass interval. For example, a direction of 037° may be reported as **015°–045°**, rather than automatically reporting 022°–052°. Thus the student cannot infer the precise angle merely by finding the midpoint. The range is truthful and its stated uncertainty matters.

### Distance bands

On Intro, in either mode, a recent track can say **“exactly 3 connected roads away”** as of the clue's observation time. This means shortest-path graph distance is three. In Apprentice, a band of **2–4 roads** includes the true route distance but does not narrow it to one figure. Later movements can invalidate an immediate distance deduction, so always read the round number.

## Assessment objective ideas

- **AO1:** use three-figure notation correctly; determine cardinal and diagonal bearings; calculate a reverse bearing.
- **AO2:** explain whether a clue measures from Hunter to Monster or Monster to Hunter; interpret an uncertain sector; distinguish graph distance from straight-line distance.
- **AO3:** combine time-indexed clues and legal movement paths; identify assumptions; predict likely escape routes; justify a hunter route under uncertainty.

## Scaffolding and differentiation

- **Model → first step → last step → independent:** initially show which direction a ray starts from, then remove this prompt, then ask students to justify their own deductions without overlays.
- If a student repeatedly enters a two-digit bearing, use the mini-tutorial to reinforce the leading zero.
- If reverse bearings are insecure, work with a 065° bearing and rotate a compass arrow by 180° before resuming play.
- For advanced students, turn off the analysis overlay and ask them to write a set of possible nodes **before** checking the computed candidates.
- If sensory load is an issue, use the text notebook and location list rather than reading all of the decorative map art.

## Privacy and fair play

In two-player pass-and-play, **only one player should view the device at a time**. The game shows a fully sealed transition screen before revealing the next role; app switching re-seals the screen. Hunter notes and map marks never appear on the Monster's screen. This is an **honour-based shared-device safeguard**, not cryptographic protection against a person inspecting browser memory. Competitive two-device multiplayer is a separate future project.

The optional candidate overlay uses **only Hunter-visible clue data and map topology**. It never reads the Monster's secret position, random seed or trail. Candidate locations are not guaranteed correct guesses, and a student’s manual marks are not treated as game evidence.

## Prototype limits and future work

Game balance is based on repeatable automated simulations, not yet calibrated against a class of students. No persistent saves, cloud multiplayer, polished art, or hosted deployment are included in PR3. Those are later milestones. Consider collecting students' gameplay feedback on confusion around bearing wording, density of clues, and whether the monster is catchable without overlay assistance.
