# Shadow Bearings — Teacher's Field Guide

## Aim

Students apply **three-figure bearings measured clockwise from north** to navigate connected roads, reverse bearings, evaluate uncertainty and combine evidence from several rounds of an unseen opponent's movement. Rather than choosing a rule because a worksheet labels it, they choose a method because it helps a real in-game decision.

Best suited to a 15–25 minute lesson activity or a short follow-up after introducing bearings; students can use **Solo Hunt** individually or **Pass & Play** with another student.

## Preparation

- Start with **Intro** for new learners; the 14-location map has simple directions, exact trace bearings, and frequent broad watcher sightings.
- **Apprentice** introduces 30°-wide clue sectors and ±1-road distance bands.
- **Tracker** and **Expert** increase graph complexity, reduce information and increase Monster evasiveness.
- Students need a device supporting keyboard or touch; no external calculator or additional app is required.
- Interactive Field Training is available from the main menu and during the Hunter turn.
- No account, sign-in, grading backend or saved progress is required for the prototype.

## Suggested 20-minute teaching sequence

**1. Model (3 minutes).** Draw a north arrow and a road to the southeast. Remind students to measure clockwise from north. Enter a three-figure bearing. Ask which *point* the bearing statement starts from.

**2. Scaffolding (4 minutes).** Use the four practice challenges: cardinal bearings, reverse directions, “bearing of Hunter from Monster” wording, and a compass interval wrapping through 000°.

**3. Independent play (9 minutes).** Students play Solo Hunt on Intro or Apprentice. Give the instruction: *before you move, make a prediction*. Keep the automatic analysis overlay off at first. Encourage handwritten or in-game notes.

**4. Deduction (3 minutes).** Once a few clues exist, open the Field Notebook's optional **Combine Clues on the Map** tool. Check the dates. Choose two clues and discuss why older clues cover more candidate locations when the Monster has already moved since the observation.

**5. Reflect (1 minute).** Review successful bearings, corrections, mean angular error, and which clue changed the student's decision. A student can retry with a new random Monster route.

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

On Intro, a recent track can say **“exactly 3 connected roads away”** as of the clue's observation time. This means shortest-path graph distance is three. In Apprentice, a band of **2–4 roads** includes the true route distance but does not narrow it to one figure. Later movements can invalidate an immediate distance deduction, so always read the round number.

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
