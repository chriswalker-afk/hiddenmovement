import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAPS,validateMap} from '../src/map.mjs';
import {DUSKMERE_SITES,DUSKMERE_LANDMARKS,renderDuskmereScenery} from '../src/duskmere.mjs';
import {WATERWAYS,waterwayPath,riverCenterlineDistance,riverRoadCrossings} from '../src/waterways.mjs';
import {renderScenery} from '../src/scenery.mjs';
import {computeObjectives} from '../src/scenarios.mjs';
import {bearingBetween} from '../src/geometry.mjs';
import {monsterFor} from '../src/monsters.mjs';

const EXPECTED=[
  ['A01','North Coppice',215.9,95,'coppice'],
  ['A02','Bell Chapel',457.7,95,'bell-chapel'],
  ['A03','North Gate',699.5,95,'north-gate'],
  ['A04',"Shepherd's Fold",179.6,231.3,'fold'],
  ['A05','Crooked Inn',421.4,231.3,'inn'],
  ['A06',"Baker's Row",663.2,231.3,'bakers'],
  ['A07','Dovecote Hill',905,231.3,'dovecote'],
  ['A08','West Watch',95,367.5,'watch'],
  ['A09','Market Cross',336.8,367.5,'market'],
  ['A10','Village Green',578.6,367.5,'green'],
  ['A11','Old Well',820.4,367.5,'well'],
  ['A12','Mill Stream',179.6,503.8,'stream'],
  ['A13','Stone Bridge',421.4,503.8,'stone-bridge'],
  ['A14','Mill Pond',663.2,503.8,'pond'],
  ['A15','Willow Bank',905,503.8,'willow'],
  ['A16','Apple Orchard',215.9,640,'orchard'],
  ['A17','Smithy Yard',457.7,640,'smithy'],
  ['A18','South Beacon',699.5,640,'beacon']
];

test('Duskmere is the planned 18-place village, with its original graph and precise bearings untouched',()=>{
  const m=MAPS.apprentice;
  assert.equal(m.id,'apprentice');
  assert.equal(m.title,'Duskmere Village');
  assert.equal(m.theme,'woodland');
  assert.equal(m.hunterStart,'A08');
  assert.equal(m.edges.length,33);
  assert.deepEqual(validateMap(m),[]);
  assert.equal(DUSKMERE_SITES.length,18);
  assert.equal(Object.keys(DUSKMERE_LANDMARKS).length,18);
  assert.deepEqual(
    Object.values(m.nodes).map(n=>[n.id,n.name,n.x,n.y,n.landmarkKind]),EXPECTED
  );
  assert.deepEqual(
    DUSKMERE_SITES.map(n=>[n.id,n.name,n.x,n.y,n.kind]),EXPECTED
  );
  for(const id of Object.keys(m.nodes)){
    const site=DUSKMERE_LANDMARKS[id];
    assert.ok(Object.isFrozen(site));
    assert.ok(site.zone&&Number.isFinite(site.artDx)&&Number.isFinite(site.artDy));
    assert.ok(/^A\d{2}$/.test(id));
  }
  const distinct=new Set(DUSKMERE_SITES.map(s=>s.name));
  assert.equal(distinct.size,18);
});

test('all scenarios preserve the historical objective IDs, not art-based guesses',()=>{
  const m=MAPS.apprentice;
  assert.equal(computeObjectives(m,'escape').exitNode,'A03');
  assert.deepEqual(computeObjectives(m,'beacons').beacons,['A03','A18']);
  assert.equal(m.nodes.A03.name,'North Gate');
  assert.equal(m.nodes.A18.name,'South Beacon');
  assert.equal(m.nodes.A08.name,'West Watch');
  assert.equal(monsterFor('apprentice').home,'Duskmere Village');
  assert.match(monsterFor('apprentice').flavour,/Duskmere/);
  // Every old connection retains precisely the same direction because no
  // game coordinate, edge or Hunter position has been changed.
  for(const [a,b] of m.edges){
    assert.ok(m.adjacency[a].includes(b)&&m.adjacency[b].includes(a));
    assert.ok(Number.isFinite(bearingBetween(m.nodes[a],m.nodes[b])));
  }
  assert.equal(MAPS.intro.title,'Blackfen Marsh');
  assert.equal(MAPS.tracker.title,'The Sunken Lowlands');
  assert.equal(MAPS.expert.title,'The Eclipse Marches');
});

test('all eighteen named places have unique matching, bundled vector scenery',()=>{
  const scene=renderDuskmereScenery();
  assert.equal(scene,renderDuskmereScenery());
  assert.equal(scene,renderScenery('woodland'));
  assert.match(scene,/class="illustrated-scenery theme-scene-woodland"/);
  assert.match(scene,/data-world="duskmere"/);
  assert.match(scene,/duskmere-landmarks/);
  assert.match(scene,/<linearGradient id="region-woodland"/);
  assert.match(scene,/<radialGradient id="duskmere-lantern-glow"/);
  assert.match(scene,/duskmere-water/);
  const entries=[...scene.matchAll(/data-landmark-id="(A\d\d)" data-landmark-kind="([^"]+)"/g)]
    .map(x=>[x[1],x[2]]);
  assert.deepEqual(entries,EXPECTED.map(x=>[x[0],x[4]]));
  assert.equal(entries.length,18);
  for(const [id,name,, ,kind] of EXPECTED){
    assert.match(scene,new RegExp('class="duskmere-landmark duskmere-landmark-'+kind+'"'));
    assert.ok(scene.includes('<title>'+name.replaceAll("'","&apos;")+'</title>'),
      id+' needs an artwork title corresponding to its map label');
  }
  assert.ok(scene.length>17000,'Full village artwork should not consist of placeholder icons');
  assert.ok(!scene.includes('<image')&&!scene.includes('<foreignObject')&&!scene.includes('xlink:href='),
    'All artwork must be original, locally rendered vector shapes');
});

test('south millstream is one coherent river, painted from the same data as collision geometry',()=>{
  const stream=WATERWAYS.woodland;
  assert.equal(stream.length,1);
  assert.equal(stream[0].id,'duskmere-millstream');
  assert.equal(stream[0].width,24);
  assert.equal(stream[0].segments.length,5);
  const art=renderDuskmereScenery();
  const d=waterwayPath(stream[0]);
  assert.ok(art.includes('d="'+d+'"'), 'Paint precisely the shared millstream centreline');
  assert.ok(art.includes('stroke-width="24"'));
  assert.match(art,/stone-bridge/);
  assert.match(art,/rotate\(-15\)/);
  assert.match(art,/duskmere-landmark-pond/);
  assert.match(art,/duskmere-landmark-willow/);
  for(const id of ['A12','A13','A14','A15']){
    const distance=riverCenterlineDistance(MAPS.apprentice.nodes[id],stream[0]);
    assert.ok(distance<75,
      id+' must genuinely be beside its named water; '+distance.toFixed(1));
  }
  for(const id of ['A01','A05','A09','A10','A17']){
    const distance=riverCenterlineDistance(MAPS.apprentice.nodes[id],stream[0]);
    assert.ok(distance>65,
      id+' must not be accidentally submerged; '+distance.toFixed(1));
  }
  for(const node of Object.values(MAPS.apprentice.nodes)){
    // Painted dark bank (width+16), plus node marker radius 19,
    // plus >=10 extra clearance. All place-name markers remain on dry ground.
    const clearance=riverCenterlineDistance(node,stream[0]) -
      (stream[0].width+16)/2-19;
    assert.ok(clearance>=10,
      node.id+' water masks playable node; clearance '+clearance.toFixed(1));
  }
});

test('three and only three legal roads cross the millstream; central Stone Bridge is correctly aligned',()=>{
  const m=MAPS.apprentice;
  const hits=riverRoadCrossings(m);
  assert.deepEqual(hits.map(h=>h.from+'-'+h.to),[
    'A12-A16','A13-A17','A14-A18'
  ]);
  const central=hits[1],site=DUSKMERE_LANDMARKS.A13;
  assert.equal(central.channel,'duskmere-millstream');
  assert.ok(Math.hypot(central.x-(site.x+site.artDx),
    central.y-(site.y+site.artDy))<4,
    'Painted stone bridge must sit exactly on the central legal crossing');
  assert.ok(central.angle>70&&central.angle<80,
    'A13-A17 road runs near north/south; the painted bridge must align');
  for(const c of hits){
    assert.ok(m.edges.some(([a,b])=>a===c.from&&b===c.to));
    assert.ok(c.span>25&&c.span<135);
  }
  // Pond is downstream and to the right of the eastern road crossing.
  // The painted pond's left bank is at x=706, 26 units clear of that road.
  assert.ok(hits[2].x<706);
  assert.ok(DUSKMERE_LANDMARKS.A14.x + DUSKMERE_LANDMARKS.A14.artDx >706);
});

test('village landmark ordering preserves map interaction, map zoom and replay',()=>{
  const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
  const scene=readFileSync(new URL('../src/scenery.mjs',import.meta.url),'utf8');
  const maps=readFileSync(new URL('../src/map.mjs',import.meta.url),'utf8');
  assert.match(scene,/if\(theme==='woodland'\)return renderDuskmereScenery\(\)/);
  assert.ok(app.indexOf('renderScenery(currentMap().theme)')<
    app.indexOf("'<g class=\"roads\">'+paths"),'Landmarks must be below playable roads');
  assert.ok(app.indexOf("'<g class=\"roads\">'+paths")<
    app.indexOf("'<g class=\"nodes\">'+dots"),'Nodes remain above all roads');
  assert.match(app,/if\(currentMap\(\)\.theme==='woodland'\)/);
  assert.ok(app.includes("bridge.from==='A13' && bridge.to==='A17'"),
    'Do not stack a generic bridge over the named custom Stone Bridge');
  assert.ok(app.includes('renderHunterBoardPiece(hunterAppearance,'));
  assert.ok(app.includes('replayMapView(view,frame)'));
  assert.ok(app.includes("view.phase.startsWith('pass-')"));
  assert.match(maps,/DUSKMERE_SITES\.map\(site=>site\.name\)/);
  assert.match(maps,/Landmark does not match the real /);
});
