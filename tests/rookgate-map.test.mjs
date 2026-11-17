import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAPS,validateMap} from '../src/map.mjs';
import {ROOKGATE_SITES,ROOKGATE_LANDMARKS,renderRookgateScenery} from '../src/rookgate.mjs';
import {WATERWAYS,waterwayPath,riverCenterlineDistance,riverRoadCrossings} from '../src/waterways.mjs';
import {renderScenery} from '../src/scenery.mjs';
import {computeObjectives} from '../src/scenarios.mjs';
import {monsterFor} from '../src/monsters.mjs';
import {bearingBetween} from '../src/geometry.mjs';

const EXPECTED=[
  ['T01','Bell Tower',246.4,95,'bell-tower'],
  ['T02','North Barracks',397.8,95,'barracks'],
  ['T03','Cloth Market',549.2,95,'cloth-market'],
  ['T04','North Gate',700.6,95,'north-gate'],
  ['T05','Canal Steps',223.7,254.3,'canal-steps'],
  ['T06','Ropewalk Yard',375.1,254.3,'ropewalk'],
  ['T07','Salt Wharf',526.5,254.3,'salt-wharf'],
  ['T08','Customs House',677.9,254.3,'customs'],
  ['T09','East Wharf',829.3,254.3,'east-wharf'],
  ['T10','West Watch',95,367.5,'west-watch'],
  ['T11',"Tanner's Row",246.4,367.5,'tanners'],
  ['T12','Lantern Square',397.8,367.5,'lantern-square'],
  ['T13','Guildhall Court',549.2,367.5,'guildhall'],
  ['T14','Foundry Yard',700.6,367.5,'foundry'],
  ['T15','East Gate',852,367.5,'east-gate'],
  ['T16','Rat Alley',148,485.8,'rat-alley'],
  ['T17','Crow Market',299.4,485.8,'crow-market'],
  ['T18','Old Mint',450.8,485.8,'mint'],
  ['T19','Physic Garden',602.2,485.8,'physic-garden'],
  ['T20','Prison Yard',753.6,485.8,'prison'],
  ['T21','South Bastion',905,485.8,'bastion'],
  ['T22','Ferry Landing',170.7,640,'ferry'],
  ['T23','South Watch',322.1,640,'south-watch'],
  ['T24',"Miller's Wharf",473.5,640,'miller-wharf'],
  ['T25','Flood Lock',624.9,640,'flood-lock'],
  ['T26','Fen Gate',776.3,640,'fen-gate']
];
const CROSSING_ROADS=[
  'T01-T05','T02-T06','T03-T07','T04-T08',
  'T16-T22','T17-T23','T18-T24','T19-T25','T20-T26'
];

test('Rookgate is precisely the planned 26-place city on the unchanged Tracker graph',()=>{
  const map=MAPS.tracker;
  assert.equal(map.id,'tracker');
  assert.equal(map.title,'Rookgate District');
  assert.equal(map.theme,'marsh','existing theme key keeps historical settings and saves');
  assert.equal(map.hunterStart,'T10');
  assert.equal(map.edges.length,46);
  assert.deepEqual(validateMap(map),[]);
  assert.equal(ROOKGATE_SITES.length,26);
  assert.equal(Object.keys(ROOKGATE_LANDMARKS).length,26);
  assert.deepEqual(
    Object.values(map.nodes).map(n=>[n.id,n.name,n.x,n.y,n.landmarkKind]),EXPECTED
  );
  assert.deepEqual(
    ROOKGATE_SITES.map(n=>[n.id,n.name,n.x,n.y,n.kind]),EXPECTED
  );
  assert.equal(new Set(ROOKGATE_SITES.map(s=>s.name)).size,26);
  assert.equal(new Set(ROOKGATE_SITES.map(s=>s.kind)).size,26);
  for(const site of ROOKGATE_SITES){
    assert.ok(Object.isFrozen(site));
    assert.ok(site.zone && Number.isFinite(site.artDx) &&
      Number.isFinite(site.artDy),'All named places need documented art anchors');
    assert.ok(/^T\d{2}$/.test(site.id));
  }
  for(const [a,b] of map.edges){
    assert.ok(map.adjacency[a].includes(b)&&map.adjacency[b].includes(a));
    assert.ok(Number.isFinite(bearingBetween(map.nodes[a],map.nodes[b])));
  }
});

test('the city gates and public beacon goal keep their original valid positions',()=>{
  const m=MAPS.tracker;
  assert.equal(computeObjectives(m,'escape').exitNode,'T04');
  assert.deepEqual(computeObjectives(m,'beacons').beacons,['T04','T23']);
  assert.equal(m.nodes.T04.name,'North Gate');
  assert.equal(m.nodes.T23.name,'South Watch');
  assert.equal(m.nodes.T10.name,'West Watch');
  assert.equal(monsterFor('tracker').home,'Rookgate District');
  assert.match(monsterFor('tracker').flavour,/Rookgate/);
  assert.equal(MAPS.intro.title,'Blackfen Marsh');
  assert.equal(MAPS.apprentice.title,'Duskmere Village');
  assert.equal(MAPS.expert.title,'The Eclipse Marches',
    'Last region must remain unchanged for PR18');
});

test('each node has an original named, distinctive illustrated urban landmark',()=>{
  const art=renderRookgateScenery();
  assert.equal(art,renderScenery('marsh'));
  assert.equal(art,renderRookgateScenery(),'Scenery must be deterministic');
  assert.match(art,/class="illustrated-scenery theme-scene-marsh"/);
  assert.match(art,/data-world="rookgate"/);
  assert.match(art,/rookgate-landmarks/);
  assert.match(art,/<linearGradient id="region-marsh"/);
  assert.match(art,/<pattern id="rookgate-cobble"/);
  assert.match(art,/rookgate-quay-details/);
  const entries=[...art.matchAll(/data-landmark-id="(T\d\d)" data-landmark-kind="([^"]+)"/g)]
    .map(m=>[m[1],m[2]]);
  assert.deepEqual(entries,EXPECTED.map(r=>[r[0],r[4]]));
  for(const [id,name,, ,kind] of EXPECTED){
    assert.ok(art.includes('class="rookgate-landmark rookgate-landmark-'+kind+'"'),
      id+' needs individual landmark geometry');
    assert.ok(art.includes('<title>'+name.replaceAll("'","&apos;")+'</title>'),
      'The artwork and the label should identify the same actual site: '+id);
  }
  assert.ok(art.length>21000,'Complete urban art should not be a generic terrain background');
  assert.ok(!art.includes('<image') && !art.includes('xlink:href=') &&
    !art.includes('<foreignObject'),
    'All illustrations must be original, local SVG rather than external images');
});

test('two physically drawn waterways share their exact shape with road-crossing geometry',()=>{
  const channels=WATERWAYS.marsh;
  assert.equal(channels.length,2);
  assert.deepEqual(channels.map(c=>c.id),
    ['rookgate-north-canal','rookgate-south-canal']);
  assert.deepEqual(channels.map(c=>c.width),[72,46]);
  const art=renderRookgateScenery();
  for(const c of channels){
    assert.equal(c.segments.length,3);
    const d=waterwayPath(c);
    assert.ok(art.includes('d="'+d+'"'));
    assert.ok(art.includes('stroke-width="'+c.width+'"'),
      c.id+' must use the visible bank dimensions used by the engine');
    assert.equal((d.match(/C/g)||[]).length,3);
  }
  // The river edge (+8), the graph marker (19) and a safety margin (10)
  // cannot touch, even when the Hunter is selected.
  for(const node of Object.values(MAPS.tracker.nodes)){
    for(const c of channels){
      const clearance=riverCenterlineDistance(node,c) -
        (c.width+18)/2-19;
      assert.ok(clearance>=10,
        node.id+' '+node.name+' is submerged by '+c.id+'; '+clearance.toFixed(1));
    }
  }
});

test('only nine bridges cross the canals, all on actual graph roads',()=>{
  const m=MAPS.tracker;
  const hits=riverRoadCrossings(m);
  assert.deepEqual(hits.map(h=>h.from+'-'+h.to),CROSSING_ROADS);
  assert.equal(hits.filter(h=>h.channel==='rookgate-north-canal').length,4);
  assert.equal(hits.filter(h=>h.channel==='rookgate-south-canal').length,5);
  assert.equal(new Set(hits.map(h=>h.from+'-'+h.to)).size,9);
  for(const hit of hits){
    assert.ok(m.edges.some(([a,b])=>a===hit.from&&b===hit.to),
      'Decorative bridges cannot create illegal roads');
    assert.ok(hit.angle>76&&hit.angle<102,
      'All actual canal crossings run broadly north-south');
    assert.ok(hit.span>30&&hit.span<=135);
    assert.ok(hit.x>=150&&hit.x<=810);
    assert.ok(hit.y>=160&&hit.y<=585);
  }
  assert.equal(m.edges.length,46,'Painting bridges must never add new routes');
});

test('wharves, steps, ferry and Flood Lock actually touch their designated canals',()=>{
  const s=ROOKGATE_LANDMARKS;
  const northern=WATERWAYS.marsh[0],southern=WATERWAYS.marsh[1];
  for(const id of ['T05','T07','T08','T09']){
    const node=s[id];
    const dist=riverCenterlineDistance({
      x:node.x+node.artDx,y:node.y+node.artDy
    },northern);
    assert.ok(dist<89,id+' should be visually on the north canal/quay; '+dist);
  }
  for(const id of ['T22','T24','T25']){
    const site=s[id];
    const dist=riverCenterlineDistance({
      x:site.x+site.artDx,y:site.y+site.artDy
    },southern);
    assert.ok(dist<32,id+' must touch navigable southern water; '+dist);
  }
  // Lock gates are painted east of the actual T19-T25 bridge, avoiding
  // a bogus extra road across the canal. They only regulate water.
  const lock=s.T25;
  assert.ok(lock.x+lock.artDx>650);
  assert.ok(Math.abs(lock.y+lock.artDy-571)<8);
  assert.ok(ROOKGATE_LANDMARKS.T22.artDy<0);
  assert.ok(ROOKGATE_LANDMARKS.T24.artDy<0);
});

test('layer order and accessible game mechanics survive the new city artwork',()=>{
  const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
  const scene=readFileSync(new URL('../src/scenery.mjs',import.meta.url),'utf8');
  const map=readFileSync(new URL('../src/map.mjs',import.meta.url),'utf8');
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  assert.match(scene,/if\(theme==='marsh'\)return renderRookgateScenery\(\)/);
  assert.match(map,/ROOKGATE_SITES\.map\(site=>site\.name\)/);
  assert.match(map,/ROOKGATE_LANDMARKS/);
  assert.ok(app.indexOf('renderScenery(currentMap().theme)')<
    app.indexOf("'<g class=\"roads\">'+paths"),'Landmarks must be beneath roads');
  assert.ok(app.indexOf("'<g class=\"roads\">'+paths")<
    app.indexOf("'<g class=\"nodes\">'+dots"),'Node and labels must be foremost');
  assert.match(app,/rookgate-city-bridge/);
  assert.match(css,/\.world-svg\.theme-marsh \.rookgate-city-bridge \.bridge-deck/);
  assert.match(css,/\.world-svg\.theme-marsh \.rookgate-landmark/);
  assert.ok(app.includes('renderHunterBoardPiece(hunterAppearance,'));
  assert.ok(app.includes('replayMapView(view,frame)'));
  assert.ok(app.includes("view.phase.startsWith('pass-')"));
  assert.ok(app.includes('protractor-toggle'));
  assert.ok(app.includes('data-node-note'));
  assert.ok(!app.includes('SILVER WATER'),'Generic land labels must not mislead players');
});
