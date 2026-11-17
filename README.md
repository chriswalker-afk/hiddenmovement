# Shadow Bearings

**A bearings-based hidden-movement game for the mathematics classroom.**

One student plays the **Hunter**, seeking a hidden **Monster** across the Hollow Moor. Both players travel by entering **three-figure bearings clockwise from north**, and the Hunter collects time-stamped directional clues when visiting a location the Monster has recently passed through.

## Playable PR1: pass-and-play prototype

The first working version includes:

- An original, illustrated 14-location map with connected routes and a clear north compass.
- Validated three-figure bearings (e.g. \`035\`, \`180\`, \`270\`) and helpful input errors.
- Hunter movement up to **two roads per turn** and Monster movement **one road per turn**.
- Secret Monster starting location, chosen at least **three route-steps** from the Hunter's Watchtower.
- Trails that last **five rounds**; fresh traces give bearings with a **±15°** sector, recorded against an explicit observation round.
- Alternating *bearing of the monster from a location* and *bearing of that location from the monster*, introducing reverse bearings.
- Clue notebook and optional map overlay for the latest clue.
- Pass-the-device screens that **show no map or role secrets**. Private views also re-seal when the page is backgrounded.
- Hunter win on capture; Monster win if not found by the end of round 13.
- End-of-game reveal of the full Monster route.
- Automated unit tests and GitHub Actions checks.

### How to try it

No build or package install is needed. Serve the repository as static files and open it in a browser:

\`\`\`bash
python3 -m http.server 8000
\`\`\`

Then visit **http://localhost:8000/**. (On some Windows setups, \`py -m http.server 8000\` is the available command.)

Because the game uses native ES modules, **do not** open \`index.html\` directly as a \`file://\` URL.

### How to play

1. Choose **Pass & Play**. Hand the device to the Monster on the blank privacy screen.
2. The Monster chooses an eligible starting point from the purple locations and confirms. The game automatically hides the map and asks for the device to be handed back.
3. The Hunter enters three-figure bearings to travel along connected roads, for up to **two edges**. They may finish early.
4. When the Hunter reaches a location on a recent Monster trail, they gain a clue specifying a compass direction (or reverse bearing) **at the end of a particular round**.
5. The Monster receives the device on a completely blank transition screen, reveals their private map, and enters the bearing of **one road** to move. The Monster sees the Hunter's public location and their own hidden trail.
6. The Hunter wins by arriving at the Monster's current location. The Monster wins by surviving the final Hunter turn.

**Privacy limitation:** the handoff is intended for cooperative classroom pass-and-play, not for security against an adversary able to inspect browser memory, developer tools, or source code. Two-device competitive multiplayer should use a server-authoritative design.

## Not yet implemented

- **Solo AI / difficulty presets:** planned PR2.
- **Advanced deduction and tutorial scaffolding:** planned PR3.
- **Artwork polish, scenario variety, GitHub Pages deployment:** planned PR4.

## Development

\`\`\`bash
npm test
npm run check
\`\`\`

Node.js 20+ is needed for tests, but not for playing in the browser. The application has no runtime package dependencies.

The source is split into \`src/geometry.mjs\` (bearings), \`src/map.mjs\` (validated map graph), \`src/engine.mjs\` (game rules / state isolation), and \`src/app.mjs\` (role-specific screens and UI).

See [Game Design](docs/GAME_DESIGN.md) and [Build Plan](docs/BUILD_PLAN.md).

This is an **original game** inspired by the hidden-movement genre. It does not reuse copyrighted art, named characters, or lore from existing games.
