# Four-world visual consistency review — PR19

**Scope:** completed comparative design, code and viewport pass. It does not claim a real classroom playtest, which is the next milestone.

## Art identity matrix

| Map | Nodes | Roads | Identity | Visual anchors |
|---|---:|---:|---|---|
| Blackfen Marsh | 14 | 29 | Haunted countryside | Old Swamp, Broken Mill, Fen Chapel, Moss Bridge, Blackwater Landing |
| Duskmere Village | 18 | 33 | Village | Village Green, Bell Chapel, Crooked Inn, Stone Bridge, Mill Pond, Smithy |
| Rookgate District | 26 | 46 | Gothic canal city | Bell Tower, Cloth Market, Salt Wharf, Flood Lock, Customs House |
| Ravenmarch County | 36 | 65 | Wild county | Raven Pass, Mourn Abbey, Raven Keep, Blackwater Bridge, Frontier Gate |

**Total: 94 illustrated named places and 173 unchanged road connections.** Each map uses an intentionally distinct muted regional palette, with consistent foreground node markers, Hunter Forge character, compass, road markings and clue conventions.

## Audit findings and PR19 improvements

- **Place names match geography.** All 94 illustrated nodes are checked against the canonical roster, including stable IDs, artwork kind, world coordinates, and names; every picture is original local SVG.
- **Mixed artistic worlds remain coherent.** Blackfen has wetlands and countryside, Duskmere lived-in cottages and a central green, Rookgate urban roofs and quays, Ravenmarch mountain ranges and a broad valley. They should not be given one identical landscape palette.
- **Compact mobile legibility needed attention.** At a 390-pixel phone width, all 26 or 36 long labels cannot be comfortably legible simultaneously at a 100% strategic overview scale. We retained their full labels and 300% zoom instead of hiding the names or crowding the graph. All four maps now have a **Location Finder** listing every public place in readable buttons. Choose a place to highlight the true node in gold and centre it when the map is zoomed.
- **The finder is not a game move.** It may not alter turns, Hunter location, secret Monster state, clues, deduction marks or replay. It is a temporary public-map visual guide, cleared on rerender and never persisted.
- **Four shared visual contracts.** All four scenery layers are separately clipped inside the 1000×720 map; roads, nodes, compass, Hunter, interactive protractor and clue rays are outside these decorative clips. All maps share the same gold focus ring and keyboard focus outline.
- **Waterways remain genuine.** Blackfen Run, Duskmere Millstream, both Rookgate canals and the Ravenmarch Blackwater use their actual drawing geometry for road-crossing checks. The unchanged coordinates and original legal roads still determine bearings.

## Regression checks and output

CI runs the normal JavaScript tests, syntax check, portable preview build and Chromium visual QA. Automated checks cover: 94 place-to-art pairs; unique local materials; clipping; correct roads, crossings and landmarks; unobscured desktop labels; existing Monster/Hunter gameplay; secret-state privacy; and Finder selection without movement.

Screenshot QA checks the four 1280×800 maps in an identical viewport, plus 390×844 portrait and 844×390 short-landscape maps, map zoom and selected node focus. The workflow artifact includes desktop and mobile PNGs, the normal layout report, and **visual/four-world-consistency.json** listing verified finder views.

Do not infer real-device usability from headless browser checks alone.

## Classroom acceptance checklist (not yet completed)

- Can students identify the map identity and five major illustrated landmarks **before** reading the names?
- Can they locate a requested place on each map using the Location Finder in under ten seconds?
- Are map markers, routes and three-figure bearings recognisable at 100%, 150% and 300% on student phones and a classroom projector?
- Is the customised Hunter still distinct against Rookgate masonry and Ravenmarch woods when wearing a dark outfit?
- Does the river, bridge, mill, landing and quarry artwork genuinely match its actual labelled node?
- Do students recognise the Location Finder as a harmless **lookup**, not a hint or Hunter move?
- Can they distinguish Hunter and Monster trails during the postgame replay?

Collect comments by map, viewport and specific node. Fix artwork offsets and accessibility first; never move gameplay nodes silently to suit art.

## Next recommendation

Merge PR19 after all GitHub checks and inspect the generated four-map contact sheet. Then conduct a short student-led real-device visual review and make a focused polish PR only for issues that students actually encounter.
