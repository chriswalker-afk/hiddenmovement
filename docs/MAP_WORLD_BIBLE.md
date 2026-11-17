# Shadow Bearings — Map World Bible v1

> **Status: all four identities and matching locations/artwork are implemented.** Blackfen Marsh (PR15), Duskmere Village (PR16), Rookgate District (PR17) and Ravenmarch County (PR18) each use canonical names, original SVG landmarks and correctly aligned waterways. Existing bearings graphs, IDs, Hunter spawns and objective algorithms remain unchanged.

## Four locked identities

| Difficulty | Map title | Setting | Playable nodes | Existing theme key | Hunter start ID | Calculated Last Gate ID | Calculated Lanternfall IDs |
|---|---|---|---:|---|---|---|---|
| Intro | **Blackfen Marsh** | Haunted countryside | 14 | `moor` | `A` | `L` | `L`, `G` |
| Apprentice | **Duskmere Village** | Haunted village | 18 | `woodland` | `A08` | `A03` | `A03`, `A18` |
| Tracker | **Rookgate District** | Gothic canal city | 26 | `marsh` | `T10` | `T04` | `T04`, `T23` |
| Expert | **Ravenmarch County** | Wide dark-fantasy territory | 36 | `eclipse` | `E12` | `E36` | `E36`, `E01` |

The existing graph IDs, coordinates, edge lists, Hunter spawn and objective algorithm are immutable during the **naming-only pass**. The existing keys `moor`, `woodland`, `marsh`, and `eclipse` may remain internal identifiers while visible map names, landmark metadata and art systems are upgraded.

## Art and geography acceptance rules

1. **Every playable node needs one dominant, identifiable visual anchor**, within a carefully tested offset around its (x, y). The landmark should be recognisable even before reading the label.
2. Labels must not collide with art, roads, other labels, the custom Hunter token, overlays, or objective markers. The node centre and its numbered marker remain accessible.
3. Preserve all currently validated edges, bearings, spawn legality, graph connectivity and chosen `hunterStart`. Changing road geometry or moving nodes is a separate reviewed task because bearings and test fixtures depend on coordinates.
4. Keep geographical elements honest: a bridge spans water; a quay borders navigable water; a mill receives a millrace; a gate crosses a wall or boundary; a hill lies on higher terrain. If the painted water does not support a name, **change the scenery in the art pass or reconsider that name**, never paint a misleading bridge.
5. The currently drawn waterways in the `marsh` theme run roughly horizontally at y≈175 and y≈571. Reinterpret them as **Rookgate's northern and southern urban canals**, with quays and road-aligned bridges. The `eclipse` theme waterway is around y≈477, reinterpreted as **the Blackwater river in Ravenmarch County**. This is a proposed scenic retrofit and must pass existing river/bridge and node-clearance tests.
6. Preserve scenario behaviours: the actual Last Gate choice is graph-distance-derived and varies by difficulty; the two public Lanternfall beacons are also derived from graph distances. Their **currently computed** IDs are recorded above, but the calculation must be rechecked if geometry ever changes. Destination art must allow a gateway / lit beacon overlay without requiring fictional roads.
7. Use a consistent original **gothic, inked, painterly dark-fantasy** art language, with distinct per-map materials and color identity. Never copy external game assets or protected characters.
8. Gameplay is readable first. Scenic layers sit beneath roads, labels, node hits, Hunter tokens and clue rings; use silhouette clusters and negative space instead of excessive decoration.

## Proposed canonical node-by-node roster

### Blackfen Marsh — 14 nodes

**Implementation status: complete in PR15.** All 14 node names are live, backed by original location-specific SVG artwork. The previous generic stream was replaced with **Blackfen Run**, a shared-geometry watercourse connecting Old Swamp, Broken Mill, Moss Bridge and Blackwater Landing; non-overlapping road crossings are marked by bridge decks. Exact nodes, positions and 29 legal roads are preserved. Recheck these assertions during any future artwork retune.

**Scope:** Haunted countryside. **Palette:** peat-brown, muted moss green, blackwater teal, stone-grey, lantern amber.

**Geography:** Scattered farms, marsh, woodland, a mill-race and a single road leaving through the east fen boundary. The existing northern serpentine painted shore must be reworked to support the mill, bridge and landing rather than running arbitrarily behind them.

| Node ID | Proposed player-visible name | Artwork / recognisable landmark | Local zone |
|---|---|---|---|
| `A` | **Warden's Watch** | small timber watch hut and lantern outside the west marsh; fixed Hunter start | western approach |
| `B` | **Pine Crossing** | three-way meeting of muddy roads between tall pines | northwest copse |
| `C` | **Broken Mill** | abandoned watermill with a visibly broken wheel and narrow mill-race | west creek |
| `D` | **Crow Farm** | weathered barn, fenced cropland and a scarecrow | northern fields |
| `E` | **Whisper Wood** | gnarled trees, pale roots, low fog and a forked trail | central woodland |
| `F` | **Fen Chapel** | small ruined chapel on a raised dry hummock | southern fen |
| `G` | **Lantern Inn** | isolated warm-lit roadside inn and hitching posts; optional beacon overlay | northeast road |
| `H` | **Moss Bridge** | low mossy stone bridge over a specifically painted shallow creek | central stream crossing |
| `I` | **Blackwater Landing** | short timber jetty, dark water and mooring posts | eastern water edge |
| `J` | **Barrow Hill** | rounded burial mound with standing marker and sparse grass | northern heights |
| `K` | **Standing Stones** | ring of upright weathered stones on firm ground | southeast field |
| `L` | **East Fen Gate** | timber palisade gateway marking the eastern exit; escape-objective anchor | far eastern boundary |
| `M` | **Old Swamp** | muddy pools, reeds, rotten logs and stunted willow silhouettes | southwestern bog |
| `N` | **Stone Quarry** | small hand-cut stone pit and stacked blocks | south central dry ground |

### Duskmere Village — 18 nodes

**Implementation status: complete in PR16.** All 18 approved names correspond to distinctive original SVG village landmarks. The shared-geometry southern **Duskmere Millstream** is drawn beneath the row-three nodes with safe shore clearance. Exactly three existing roads cross the water: **A12–A16** (small footbridge), **A13–A17** (the named, road-aligned **Stone Bridge**) and **A14–A18** (small bridge/causeway). **Mill Pond** expands the connected water east of the A14–A18 road; Willow Bank visibly borders the same stream. Village Green and Market Cross anchor the centre, with northern houses/chapel and southern orchard/smithy. The original 18 nodes, 33 edges, bearings, A08 start and A03/A18 goal markers remain intact.

**Scope:** Haunted village. **Palette:** warm grey stone, smoky blue, oak brown, apple green and dim copper lanterns.

**Geography:** One readable settlement with a real centre around Market Cross and Village Green, cottages and trades around it, outskirts to west/north, and a coherent east-west millstream along the southern road band.

| Node ID | Proposed player-visible name | Artwork / recognisable landmark | Local zone |
|---|---|---|---|
| `A01` | **North Coppice** | small thicket of leafless alder and hazel with an open trail | northwest village edge |
| `A02` | **Bell Chapel** | plastered village chapel and modest bell tower | north ridge |
| `A03` | **North Gate** | stone village arch with cart track beyond; escape-objective anchor | northeastern approach |
| `A04` | **Shepherd's Fold** | wattle pens, hay bales, grazing meadow | northwest pasture |
| `A05` | **Crooked Inn** | leaning timber-framed tavern with a glowing sign and narrow lane | upper village |
| `A06` | **Baker's Row** | close-set cottages, bread oven and chimney smoke | northeast houses |
| `A07` | **Dovecote Hill** | rounded raised hill with a circular stone dovecote | far eastern ridge |
| `A08` | **West Watch** | small staffed watch hut and starting lantern; fixed Hunter start | west entrance |
| `A09` | **Market Cross** | cobbled crossroads and old carved market cross | west centre |
| `A10` | **Village Green** | open grass common with a single great oak and footpaths | central common |
| `A11` | **Old Well** | stone communal well and rope winch between cottages | east centre |
| `A12` | **Mill Stream** | narrow water channel passing under a timber footbridge near cottages | southwest stream edge |
| `A13` | **Stone Bridge** | short, old stone bridge clearly spanning the millstream; align the actual road | south central crossing |
| `A14` | **Mill Pond** | dammed pond, reeds and a low sluice beside the watermill outbuildings | southeast stream edge |
| `A15` | **Willow Bank** | several large willows shading the stream's eastern margin | east stream edge |
| `A16` | **Apple Orchard** | rows of old apple trees and low dry-stone walls | southwest outskirts |
| `A17` | **Smithy Yard** | forge hearth, anvil, wagon wheel and coal stacks | southern workshops |
| `A18` | **South Beacon** | small torch-lit beacon tower by the southern road; optional beacon overlay | southern approach |

### Rookgate District — 26 nodes

**Implementation status: complete in PR17.** All 26 names are keyed to distinct vector landmarks. The long north/south water corridors have become **Rookgate North Canal** and **Rookgate South Canal**, sharing painted Bezier geometry with bridge detection. Exactly **four northern** and **five southern** legal roads cross them, rendered as stone city bridges. Canal Steps, Salt Wharf, Customs House, East Wharf, Ferry Landing, Miller's Wharf and Flood Lock are physically situated by canal banks. A coherent city-wall, roof, industry and quay art pass replaces wetland reeds. The existing **26 nodes, 46 roads, T10 Hunter start, T04 escape and T04/T23 beacon objectives** remain stable.

**Scope:** Gothic canal city. **Palette:** slate roof grey, soot black, tarnished copper, canal green and lantern gold.

**Geography:** A coherent medieval canal-side district. Retain both existing horizontal waterways as northern and southern canals, but replace marsh reeds with quay walls and towpaths. Several graph roads cross the canals; render those crossing spans as stone or timber bridges. Build continuous urban blocks around, never over, node markers.

| Node ID | Proposed player-visible name | Artwork / recognisable landmark | Local zone |
|---|---|---|---|
| `T01` | **Bell Tower** | slender church bell tower above close northern rooftops | northern ward |
| `T02` | **North Barracks** | walled soldiers' yard, training dummies and a guardhouse | northern ward |
| `T03` | **Cloth Market** | covered stalls, awnings and folded dyed cloth | north market |
| `T04` | **North Gate** | massive gatehouse and city wall passage; escape-objective anchor | northern boundary |
| `T05` | **Canal Steps** | broad worn stairs dropping from northern quay to a narrow canal | north canal bank |
| `T06` | **Ropewalk Yard** | long rope-making sheds and drying lengths of rope | north quay industries |
| `T07` | **Salt Wharf** | barrels, mooring rings, warehouse and salt sacks | north canal waterfront |
| `T08` | **Customs House** | guarded counting house beside the canal with a crane | north canal waterfront |
| `T09` | **East Wharf** | timber piers and a waterside warehouse at the east edge | eastern canal basin |
| `T10` | **West Watch** | gate-side patrol booth and watch lantern; fixed Hunter start | western street entry |
| `T11` | **Tanner's Row** | narrow alley of vats, stretched hides and low workshops | western trades |
| `T12` | **Lantern Square** | compact cobbled public square with central iron lamps | city centre |
| `T13` | **Guildhall Court** | ornate merchant guild hall and paved courtyard | civic quarter |
| `T14` | **Foundry Yard** | furnace, coal carts and thick smoke from metalworking | eastern industry |
| `T15` | **East Gate** | fortified minor city entry with a short curtain wall | eastern wall |
| `T16` | **Rat Alley** | tight crooked alley, refuse bins and shadowed archways | southwest backstreets |
| `T17` | **Crow Market** | dense street bazaar and distinctive black banners | south market |
| `T18` | **Old Mint** | heavy stone civic building and secure barred doors | southern civic quarter |
| `T19` | **Physic Garden** | enclosed herb garden and glass-roofed medicinal hothouse | southern quiet quarter |
| `T20` | **Prison Yard** | high grey walls, iron gate and patrol walkway | southeast ward |
| `T21` | **South Bastion** | fortified round corner tower on the southern wall | far southeast wall |
| `T22` | **Ferry Landing** | stone riverside steps, moored ferry and boatman shelter | south canal bank |
| `T23` | **South Watch** | lit riverside watchtower, can serve as beacon objective | southern canal frontage |
| `T24` | **Miller's Wharf** | waterwheel mill, sacks and small loading platform | southern canal industries |
| `T25` | **Flood Lock** | massive canal lock gates, chains and spillway | southeast waterworks |
| `T26` | **Fen Gate** | smaller gate where the city road runs out into marshland | southern outskirts |

### Ravenmarch County — 36 nodes

**Implementation status: complete in PR18.** All 36 places have original, individual SVG illustrations keyed to their stable node IDs. Five geographic belts make Ravenmarch feel like a whole territory: northern highlands, forests/ruins, old inland roads, Blackwater river valley and southern frontier. The previous horizontal river is now **the Blackwater**, using the same geometry to paint the water and validate crossings. Exactly six old connected roads span the river: **E19–E26**, **E20–E27**, **E21–E28**, **E22–E29**, **E23–E30** and **E24–E31**. E21 is the bespoke **Blackwater Bridge**, drawn at the actual E21–E28 crossing; five smaller grey-stone decks cover the other crossings. Greywater Mill meets the water, Reedmere and the Weeping Willow occupy wet south-bank territory, and Hollow Mere is a distinct lowland lake. All 36 nodes, 65 legal roads, E12 Hunter start, E36 Last Gate and E36/E01 beacons are preserved.

**Scope:** Wide dark-fantasy territory. **Palette:** grey-green forest, cold blue mountains, ochre farmland, river slate, dusky plum and sparse gold.

**Geography:** A county-scale map, not a 36-building city. Use five geographic belts: northern highlands; woods and former settlements; central roads and farms; the Blackwater river valley; and southern frontier. Existing river at approximately y=477 remains the Blackwater. All crossings must coincide with real graph roads. A top-left watch beacon and a bottom-right frontier gateway anchor scenario objectives.

| Node ID | Proposed player-visible name | Artwork / recognisable landmark | Local zone |
|---|---|---|---|
| `E01` | **North Watch** | wind-swept watchtower with a brazier; can serve as beacon objective | northwest highlands |
| `E02` | **Raven Pass** | narrow gap through rocky northern hills and conifers | north mountain route |
| `E03` | **Crown Ridge** | high jagged skyline with a distinctive three-peaked crest | northern mountains |
| `E04` | **Frostmere** | small dark alpine lake with pale shores | northeast uplands |
| `E05` | **Highland Cairn** | large wayfinding cairn on barren upland moor | far northeast highland |
| `E06` | **Widow's Wood** | dense old spruce forest, dead trees and a hunter's path | northwest forest |
| `E07` | **Ashen Hamlet** | cluster of blackened cottages and a broken village kiln | northern settlements |
| `E08` | **Pilgrim's Rest** | roadside wayhouse and wayside shrine | north road |
| `E09` | **Mourn Abbey** | ruined abbey cloister with a shattered bell tower | north central valley |
| `E10` | **Stone Quarry** | terraced extraction pit and block carts in rocky foothills | northeast quarry belt |
| `E11` | **Raven Keep** | fortified keep on a high rocky spur | far east highlands |
| `E12` | **West Ranger Post** | small frontier ranger lodge, stable and lantern; fixed Hunter start | western county entry |
| `E13` | **King's Milepost** | carved milestone and crossroads of an ancient royal road | west central road |
| `E14` | **Wolf Hollow** | deep wooded depression with a narrow trail | western valleys |
| `E15` | **Fallen Observatory** | small collapsed circular dome and brass instruments | central escarpment |
| `E16` | **Heather Moor** | open rolling purple-grey heath and boggy tracks | east central upland |
| `E17` | **Iron Mine** | pithead winding gear and coal-dark spoil heaps | eastern upland |
| `E18` | **East Watch** | outlying stone lookout post on an exposed hill | far eastern heights |
| `E19` | **Barrow Field** | scattered prehistoric burial mounds in broad grassland | west county farmland |
| `E20` | **Foxglove Farm** | farmhouse, small paddocks and flowered boundary hedges | west central farms |
| `E21` | **Blackwater Bridge** | ancient stone bridge at an actual Blackwater crossing road | western north riverbank |
| `E22` | **Greywater Mill** | watermill and millrace directly feeding the main river | central north riverbank |
| `E23` | **Old Battlefield** | weathered standards, broken carts and sparse war memorials | east central plains |
| `E24` | **Stormwatch Tower** | lonely warning tower with lightning-scored masonry | eastern ridge |
| `E25` | **Eastwood Copse** | thick grove and woodland boundary path | far eastern woods |
| `E26` | **Lowland Farm** | thatched barn, grazing paddocks and river floodplain | western south plain |
| `E27` | **Reedmere Marsh** | reed pools and muddy channels on the south floodplain | southwest river plain |
| `E28` | **Blackwater Bank** | pebbled southern bridgehead and river marker | central south riverbank |
| `E29` | **Pilgrim Shrine** | small roadside shrine overlooking the Blackwater | central south riverbank |
| `E30` | **Weeping Willow** | single monumental willow beside a shaded oxbow | southeastern river bend |
| `E31` | **Hollow Mere** | isolated dark lake and wet meadow below eastern foothills | eastern lowlands |
| `E32` | **South Orchard** | mixed orchards and low stone farm walls | southern farmland |
| `E33` | **Salt Road** | dusty trade route junction with a customs milestone | southern trade road |
| `E34` | **Stone Circle** | distinct ring of standing stones against open frontier sky | southern heath |
| `E35` | **Border Watch** | modest palisaded frontier outpost and watch fire | southern border |
| `E36` | **Frontier Gate** | substantial fortified border gate; escape-objective anchor and optional beacon | far southeast county exit |

## Suggested implementation sequence (future PRs, not included in this document)

1. **Naming and metadata pass:** store each final player-visible name and a semantic landmark type/zone keyed by stable node ID. Update map titles, intro, scenario texts and tests. Keep geometry unchanged and ensure old saves use the same node IDs.
2. **Landmark art prototype:** implement just Blackfen Marsh and review screenshots at 100–300% zoom, Intro node label geometry, water/bridge alignment, and Hunter token clarity before scaling the system.
3. **Duskmere Village (completed PR16):** named village centre, 18 illustrated sites, actual southern millstream with matching Stone Bridge, causeways and Mill Pond.
4. **Rookgate District (completed PR17):** 26 landmark drawings, urban blocks and walls, two joined-by-roads canals, nine real bridges, water-aligned quays and workshops; all nodes remain on dry land.
5. **Ravenmarch County (completed PR18):** all 36 regional landmarks, mountain relief, wooded settlements, Blackwater valley, six true road crossings and coherent frontier gates, retaining 65 legal edges.
6. **Final QA:** exact node count 14/18/26/36; all labels; collisions at mobile and desktop zoom; all three missions, story briefings, replay, player token and protractor; no bearings / graph / clue / AI regressions.

**Next quality gate:** all four world maps now have geographically justified art. Run a combined mobile/projector/whiteboard legibility review with students, including 100%, 150% and 300% zoom, the Hunter token, bearing input, objective icons, clues and replay. Refine individual SVG art and offsets using feedback without silently changing node coordinates or connectivity.
