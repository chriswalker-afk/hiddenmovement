import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAPS,validateMap} from '../src/map.mjs';
import {BLACKFEN_SITES,BLACKFEN_LANDMARKS,renderBlackfenScenery} from '../src/blackfen.mjs';
import {WATERWAYS,waterwayPath,riverRoadCrossings,riverCenterlineDistance} from '../src/waterways.mjs';
import {renderScenery} from '../src/scenery.mjs';
import {computeObjectives} from '../src/scenarios.mjs';
import {bearingBetween} from '../src/geometry.mjs';

const EXPECTED=Object.freeze([
  ['A',"Warden's Watch",100,380,'watch'],
  ['B','Pine Crossing',210,225,'pine'],
  ['C','Broken Mill',240,470,'mill'],
  ['D','Crow Farm',360,120,'farm'],
  ['E','Whisper Wood',420,345,'wood'],
  ['F','Fen Chapel',390,590,'chapel'],
  ['G','Lantern Inn',590,185,'inn'],
  ['H','Moss Bridge',620,445,'bridge'],
  ['I','Blackwater Landing',800,315,'landing'],
  ['J','Barrow Hill',790,85,'barrow'],
  ['K','Standing Stones',800,575,'stones'],
  ['L','East Fen Gate',930,410,'gate'],
  ['M','Old Swamp',145,640,'swamp'],
  ['N','Stone Quarry',575,640,'quarry']
]);

test('Blackfen Marsh has exactly fourteen planned places at the untouched Intro coordinates',()=>{
  const map=MAPS.intro;
  assert.equal(map.id,'intro');
  assert.equal(map.theme,'moor');
  assert.equal(map.title,'Blackfen Marsh');
  assert.equal(map.hunterStart,'A');
  assert.equal(map.edges.length,29,'renaming and painting must not change legal roads');
  assert.equal(validateMap(map).length,0,validateMap(map).join('; '));
  assert.equal(BLACKFEN_SITES.length,14);
  assert.equal(Object.keys(BLACKFEN_LANDMARKS).length,14);
  assert.deepEqual(
    Object.values(map.nodes).map(n=>[n.id,n.name,n.x,n.y,n.landmarkKind]),EXPECTED
  );
  assert.deepEqual(
    BLACKFEN_SITES.map(n=>[n.id,n.name,n.x,n.y,n.kind]),EXPECTED
  );
  assert.equal(new Set(EXPECTED.map(row=>row[1])).size,14);
  assert.ok(Object.values(BLACKFEN_LANDMARKS).every(s=>s.zone&&Number.isFinite(s.artDx)));
  assert.ok(Object.values(map.nodes).every(n=>Object.isFrozen(BLACKFEN_LANDMARKS[n.id])));
});

test('the existing bearing calculations and all three mission objectives remain intact',()=>{
  const map=MAPS.intro;
  assert.equal(computeObjectives(map,'escape').exitNode,'L');
  assert.deepEqual(computeObjectives(map,'beacons').beacons,['L','G']);
  assert.equal(map.nodes.L.name,'East Fen Gate');
  assert.equal(map.nodes.G.name,'Lantern Inn');
  assert.equal(map.nodes.A.name,"Warden's Watch");
  const links=[['A','B'],['A','C'],['A','M'],['F','H'],['H','K'],['H','N'],['I','L']];
  for(const [a,b] of links){
    assert.ok(map.edges.some(e=>e.includes(a)&&e.includes(b)),
      'Expected historical road '+a+'-'+b);
    assert.ok(Number.isFinite(bearingBetween(map.nodes[a],map.nodes[b])));
  }
  assert.equal(Object.values(MAPS.apprentice.nodes).length,18);
  assert.equal(Object.values(MAPS.tracker.nodes).length,26);
  assert.equal(Object.values(MAPS.expert.nodes).length,36);
  assert.equal(MAPS.apprentice.title,'Thornwood Vale',
    'Other worlds are not renamed until their own art and geometry are ready');
});

test('every named place has its own recognisable, deterministic original vector landmark',()=>{
  const scene=renderBlackfenScenery();
  assert.equal(scene,renderBlackfenScenery());
  assert.equal(scene,renderScenery('moor'));
  assert.match(scene,/class="illustrated-scenery theme-scene-moor"/);
  assert.match(scene,/data-world="blackfen"/);
  assert.match(scene,/<linearGradient id="blackfen-water"/);
  assert.match(scene,/blackfen-landmarks/);
  const entries=[...scene.matchAll(/data-landmark-id="([A-N])" data-landmark-kind="([^"]+)"/g)]
    .map(x=>[x[1],x[2]]);
  assert.equal(entries.length,14);
  assert.deepEqual(entries,EXPECTED.map(row=>[row[0],row[4]]));
  for(const [id,name,, ,kind] of EXPECTED) {
    assert.ok(scene.includes('class="blackfen-landmark blackfen-landmark-'+kind+'"'),
      name+' lacks a unique drawn symbol');
    assert.ok(scene.includes('<title>'+name.replaceAll("'","&apos;")+'</title>'),
      name+' needs a meaningful accessible title in the art layer');
    assert.ok(!scene.includes('xlink:href=')&&!scene.includes('<image'),
      'The landmarks must be original bundled vector art');
  }
  assert.ok(scene.length>18000,'Complete painted terrain should not be tiny placeholder symbols');
});

test('Blackfen Run is the exact physically drawn creek connecting the swamp, mill, bridge and landing',()=>{
  const channels=WATERWAYS.moor;
  assert.equal(channels.length,1);
  const creek=channels[0];
  assert.equal(creek.id,'blackfen-run');
  assert.equal(creek.width,28);
  assert.equal(creek.segments.length,6);
  const svg=renderBlackfenScenery();
  const d=waterwayPath(creek);
  assert.ok(svg.includes('d="'+d+'"'));
  assert.ok(svg.includes('stroke-width="28"'));
  const near={M:7,C:38,H:18,I:27};
  for(const [id,maximum] of Object.entries(near)){
    const distance=riverCenterlineDistance(MAPS.intro.nodes[id],creek);
    assert.ok(distance<=maximum,
      id+' '+MAPS.intro.nodes[id].name+' must genuinely touch its named water; '+distance);
  }
  for(const id of ['A','B','D','G','J','K','N']){
    const d=riverCenterlineDistance(MAPS.intro.nodes[id],creek);
    assert.ok(d>60,id+' should stand away from the creek; distance '+d);
  }
  assert.match(svg,/blackfen-creek-banks/);
  assert.match(svg,/blackfen-water/);
});

test('the roads and creek intersections stay real, with a single bespoke Moss Bridge and docking landmark',()=>{
  const map=MAPS.intro,river=WATERWAYS.moor[0];
  const crossings=riverRoadCrossings(map);
  assert.ok(crossings.length>=5&&crossings.length<=12,
    'Blackfen Run should be crossed by several actual graph roads');
  for(const c of crossings){
    assert.equal(c.channel,river.id);
    assert.ok(map.edges.some(([a,b])=>a===c.from&&b===c.to));
    assert.ok(c.span>25&&c.span<135);
  }
  const scene=renderScenery('moor');
  assert.match(scene,/blackfen-landmark-bridge/);
  assert.match(scene,/blackfen-landmark-landing/);
  assert.match(scene,/rotate\(42\)/);
  const chosen=crossings.filter(c=>
    Math.hypot(c.x-map.nodes.H.x,c.y-map.nodes.H.y)>=65 &&
    Math.hypot(c.x-map.nodes.I.x,c.y-map.nodes.I.y)>=46);
  assert.ok(chosen.length>=2 && chosen.length<=6,
    'Overlapping bridge decals should be reduced near the dedicated crossing and dock');
});

test('scenery and notes never become new roads, and the role-specific map still uses the real labels',()=>{
  const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
  const scenery=readFileSync(new URL('../src/scenery.mjs',import.meta.url),'utf8');
  assert.match(app,/renderScenery\(currentMap\(\)\.theme\)/);
  assert.match(app,/const paths = currentMap\(\)\.edges\.map/);
  assert.match(app,/\.filter\(bridge=>\{/);
  assert.ok(app.includes('blackfen')===false ||
    app.includes("currentMap().theme!=='moor'"));
  assert.match(app,/'<g class="nodes">'\+dots/);
  assert.match(app,/'<g class="roads">'\+paths/);
  assert.match(scenery,/if\(theme==='moor'\)return renderBlackfenScenery\(\)/);
  assert.ok(!app.includes('BLACKPINE WOODS'), 'Remove unrelated decorative terrain names');
  assert.ok(!app.includes('HOLLOW MARSHES'), 'Show only genuine named locations');
  assert.ok(!app.includes('renderScenery(currentMap().theme)+trees'),
    'Scenery layer must stay beneath roads, labels and player pieces');
});
