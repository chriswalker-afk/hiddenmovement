import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAPS,validateMap} from '../src/map.mjs';
import {
  RAVENMARCH_SITES,RAVENMARCH_LANDMARKS,renderRavenmarchScenery
} from '../src/ravenmarch.mjs';
import {
  WATERWAYS,waterwayPath,riverRoadCrossings,riverCenterlineDistance
} from '../src/waterways.mjs';
import {renderScenery} from '../src/scenery.mjs';
import {computeObjectives} from '../src/scenarios.mjs';
import {monsterFor} from '../src/monsters.mjs';
import {bearingBetween} from '../src/geometry.mjs';

const EXPECTED=[
  ['E01','North Watch',222.6,95,'north-watch'],
  ['E02','Raven Pass',350.1,95,'raven-pass'],
  ['E03','Crown Ridge',477.7,95,'crown-ridge'],
  ['E04','Frostmere',605.2,95,'frostmere'],
  ['E05','Highland Cairn',732.8,95,'highland-cairn'],
  ['E06',"Widow's Wood",203.4,204,'widows-wood'],
  ['E07','Ashen Hamlet',331,204,'ashen-hamlet'],
  ['E08',"Pilgrim's Rest",458.5,204,'pilgrims-rest'],
  ['E09','Mourn Abbey',586.1,204,'mourn-abbey'],
  ['E10','Stone Quarry',713.7,204,'stone-quarry'],
  ['E11','Raven Keep',841.2,204,'raven-keep'],
  ['E12','West Ranger Post',95,313,'ranger-post'],
  ['E13',"King's Milepost",222.6,313,'milepost'],
  ['E14','Wolf Hollow',350.1,313,'wolf-hollow'],
  ['E15','Fallen Observatory',477.7,313,'observatory'],
  ['E16','Heather Moor',605.2,313,'heather-moor'],
  ['E17','Iron Mine',732.8,313,'iron-mine'],
  ['E18','East Watch',860.3,313,'east-watch'],
  ['E19','Barrow Field',139.7,410,'barrow-field'],
  ['E20','Foxglove Farm',267.2,410,'foxglove-farm'],
  ['E21','Blackwater Bridge',394.8,410,'blackwater-bridge'],
  ['E22','Greywater Mill',522.3,410,'greywater-mill'],
  ['E23','Old Battlefield',649.9,410,'battlefield'],
  ['E24','Stormwatch Tower',777.4,410,'stormwatch'],
  ['E25','Eastwood Copse',905,410,'eastwood'],
  ['E26','Lowland Farm',158.8,549,'lowland-farm'],
  ['E27','Reedmere Marsh',286.3,549,'reedmere'],
  ['E28','Blackwater Bank',413.9,549,'blackwater-bank'],
  ['E29','Pilgrim Shrine',541.5,549,'pilgrim-shrine'],
  ['E30','Weeping Willow',669,549,'weeping-willow'],
  ['E31','Hollow Mere',796.6,549,'hollow-mere'],
  ['E32','South Orchard',267.2,640,'south-orchard'],
  ['E33','Salt Road',394.8,640,'salt-road'],
  ['E34','Stone Circle',522.3,640,'stone-circle'],
  ['E35','Border Watch',649.9,640,'border-watch'],
  ['E36','Frontier Gate',777.4,640,'frontier-gate']
];
const CROSSING_ROADS=[
  'E19-E26','E20-E27','E21-E28',
  'E22-E29','E23-E30','E24-E31'
];

test('Ravenmarch uses every approved name and keeps 36 old map coordinates and 65 roads',()=>{
  const map=MAPS.expert;
  assert.equal(map.id,'expert');
  assert.equal(map.title,'Ravenmarch County');
  assert.equal(map.theme,'eclipse','preserve existing Expert save/difficulty identifiers');
  assert.equal(map.hunterStart,'E12');
  assert.equal(map.edges.length,65);
  assert.deepEqual(validateMap(map),[]);
  assert.equal(RAVENMARCH_SITES.length,36);
  assert.equal(Object.keys(RAVENMARCH_LANDMARKS).length,36);
  assert.deepEqual(Object.values(map.nodes).map(n=>
    [n.id,n.name,n.x,n.y,n.landmarkKind]),EXPECTED);
  assert.deepEqual(RAVENMARCH_SITES.map(s=>
    [s.id,s.name,s.x,s.y,s.kind]),EXPECTED);
  assert.equal(new Set(RAVENMARCH_SITES.map(s=>s.name)).size,36);
  assert.equal(new Set(RAVENMARCH_SITES.map(s=>s.kind)).size,36);
  for(const s of RAVENMARCH_SITES){
    assert.ok(Object.isFrozen(s));
    assert.ok(s.zone&&Number.isFinite(s.artDx)&&Number.isFinite(s.artDy));
    assert.ok(/^E\d{2}$/.test(s.id));
  }
  for(const [a,b] of map.edges){
    assert.ok(map.adjacency[a].includes(b)&&map.adjacency[b].includes(a));
    assert.ok(Number.isFinite(bearingBetween(map.nodes[a],map.nodes[b])));
  }
});

test('all scenario objective sites are anchored to genuine named map landmarks',()=>{
  const map=MAPS.expert;
  assert.equal(computeObjectives(map,'escape').exitNode,'E36');
  assert.deepEqual(computeObjectives(map,'beacons').beacons,['E36','E01']);
  assert.equal(map.nodes.E36.name,'Frontier Gate');
  assert.equal(map.nodes.E01.name,'North Watch');
  assert.equal(map.nodes.E12.name,'West Ranger Post');
  assert.equal(monsterFor('expert').home,'Ravenmarch County');
  assert.match(monsterFor('expert').flavour,/Raven Keep/);
  assert.equal(MAPS.intro.title,'Blackfen Marsh');
  assert.equal(MAPS.apprentice.title,'Duskmere Village');
  assert.equal(MAPS.tracker.title,'Rookgate District');
});

test('all 36 locations have their own visible, named original vector landmarks',()=>{
  const svg=renderRavenmarchScenery();
  assert.equal(svg,renderRavenmarchScenery(),'static local SVG must be deterministic');
  assert.equal(svg,renderScenery('eclipse'));
  assert.match(svg,/class="illustrated-scenery theme-scene-eclipse"/);
  assert.match(svg,/data-world="ravenmarch"/);
  assert.match(svg,/ravenmarch-landmarks/);
  assert.match(svg,/ravenmarch-scene-clip/);
  assert.match(svg,/ravenmarch-river-water/);
  assert.match(svg,/region-eclipse/);
  const entries=[...svg.matchAll(/data-landmark-id="(E\d\d)" data-landmark-kind="([^"]+)"/g)]
    .map(m=>[m[1],m[2]]);
  assert.deepEqual(entries,EXPECTED.map(e=>[e[0],e[4]]));
  for(const [id,name,,,kind] of EXPECTED){
    assert.ok(svg.includes('class="ravenmarch-landmark ravenmarch-landmark-'+kind+'"'),
      name+' needs specific original illustrated artwork');
    assert.ok(svg.includes('<title>'+name.replaceAll("'","&apos;")+'</title>'),
      id+' visible name and illustrated landmark title must agree');
  }
  assert.ok(svg.length>18000,'Region must not devolve into generic placeholder symbols');
  assert.ok(!svg.includes('<image')&&!svg.includes('xlink:href=')&&
    !svg.includes('<foreignObject'),
    'No remote assets; the maps must be self-contained original vector artwork');
});

test('Blackwater is one drawn river with safe dry-bank clearance for every game node',()=>{
  const channels=WATERWAYS.eclipse;
  assert.equal(channels.length,1);
  const river=channels[0];
  assert.equal(river.id,'blackwater-river');
  assert.equal(river.width,46);
  assert.equal(river.segments.length,3);
  const d=waterwayPath(river);
  const art=renderRavenmarchScenery();
  assert.ok(art.includes('d="'+d+'"'),
    'Paint and river-crossing calculation must use the same control points');
  assert.ok(art.includes('stroke-width="'+river.width+'"'));
  for(const node of Object.values(MAPS.expert.nodes)){
    // The original bank clearance contract: dark banks (width+16),
    // 19-unit playable hit radius, 10 more units of safety.
    const clearance=riverCenterlineDistance(node,river) -
      (river.width+16)/2-19;
    assert.ok(clearance>=10,node.id+' '+node.name+
      ' is submerged by Blackwater: '+clearance.toFixed(1));
  }
});

test('six and only six real bridges span Blackwater on existing roads',()=>{
  const map=MAPS.expert;
  const crossings=riverRoadCrossings(map);
  assert.deepEqual(crossings.map(c=>c.from+'-'+c.to),CROSSING_ROADS);
  assert.equal(new Set(crossings.map(c=>c.from+'-'+c.to)).size,6);
  for(const c of crossings){
    assert.equal(c.channel,'blackwater-river');
    assert.ok(map.edges.some(([a,b])=>a===c.from&&b===c.to),
      'No decorative bridge may create a new legal road');
    assert.ok(c.angle>77&&c.angle<87,'The bridge must follow the crossing road');
    assert.ok(c.span>30&&c.span<=135);
    assert.ok(c.x>=120&&c.x<=830&&c.y>=450&&c.y<=501);
  }
  assert.equal(map.edges.length,65);
});

test('Blackwater Bridge is exactly on the E21–E28 crossing, not an unconnected icon',()=>{
  const crossings=riverRoadCrossings(MAPS.expert);
  const crossing=crossings.find(c=>c.from==='E21'&&c.to==='E28');
  assert.ok(crossing,'The named bridge requires an actual legal crossing road');
  const site=RAVENMARCH_LANDMARKS.E21;
  const centre={x:site.x+site.artDx,y:site.y+site.artDy};
  assert.ok(Math.hypot(crossing.x-centre.x,crossing.y-centre.y)<2,
    'Painted stone bridge must be centred on the measured Blackwater crossing');
  assert.equal(centre.x,403.8);
  assert.equal(centre.y,476);
  assert.match(renderRavenmarchScenery(),/rotate\(-8\)/);
  const bank=RAVENMARCH_LANDMARKS.E28;
  assert.ok(Math.hypot(bank.x+bank.artDx-centre.x,
    bank.y+bank.artDy-centre.y)<55,'Named southern bank must be at this bridge');
});

test('wetland, mill and willow are beside Blackwater while the mere is separate',()=>{
  const c=WATERWAYS.eclipse[0],s=RAVENMARCH_LANDMARKS;
  for(const id of ['E22','E27','E28','E30']){
    const p={x:s[id].x+s[id].artDx,y:s[id].y+s[id].artDy};
    const dist=riverCenterlineDistance(p,c);
    assert.ok(dist<50,id+' needs physically connected river/shore artwork ('+
      dist.toFixed(1)+')');
  }
  const lake=s.E31;
  assert.ok(lake.x+lake.artDx>830);
  assert.ok(lake.y+lake.artDy>575,
    'Hollow Mere should be an isolated southeastern lake, not the main river');
  assert.ok(s.E36.y+s.E36.artDy>670,
    'The frontier gate should be visibly embedded in the southern wall');
  assert.ok(s.E01.y+s.E01.artDy<165,
    'North Watch should be in the highlands, not beside the river');
});

test('game layers, Hunter character and replay survive the region illustration',()=>{
  const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
  const scenery=readFileSync(new URL('../src/scenery.mjs',import.meta.url),'utf8');
  const map=readFileSync(new URL('../src/map.mjs',import.meta.url),'utf8');
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  assert.match(scenery,/if\(theme==='eclipse'\)return renderRavenmarchScenery\(\)/);
  assert.match(map,/RAVENMARCH_SITES\.map\(site=>site\.name\)/);
  assert.match(map,/RAVENMARCH_LANDMARKS/);
  assert.ok(app.indexOf('renderScenery(currentMap().theme)')<
    app.indexOf("'<g class=\"roads\">'+paths"),
    'Painted scenery stays beneath the playable road graph');
  assert.ok(app.indexOf("'<g class=\"roads\">'+paths")<
    app.indexOf("'<g class=\"nodes\">'+dots"),
    'Node labels remain above artwork and routes');
  assert.ok(app.includes("bridge.from==='E21' && bridge.to==='E28'"),
    'Do not overprint a generic bridge on Blackwater Bridge');
  assert.match(app,/ravenmarch-river-bridge/);
  assert.match(css,/\.world-svg\.theme-eclipse \.ravenmarch-river-bridge/);
  assert.ok(app.includes('renderHunterBoardPiece(hunterAppearance,'));
  assert.ok(app.includes('replayMapView(view,frame)'));
  assert.ok(app.includes('protractor-toggle'));
  assert.ok(app.includes('data-node-note'));
  assert.ok(app.includes("view.phase.startsWith('pass-')"));
});
