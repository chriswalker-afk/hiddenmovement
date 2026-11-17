import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAPS,validateMap} from '../src/map.mjs';
import {BLACKFEN_SITES,renderBlackfenScenery} from '../src/blackfen.mjs';
import {DUSKMERE_SITES,renderDuskmereScenery} from '../src/duskmere.mjs';
import {ROOKGATE_SITES,renderRookgateScenery} from '../src/rookgate.mjs';
import {RAVENMARCH_SITES,renderRavenmarchScenery} from '../src/ravenmarch.mjs';
import {WATERWAYS,waterwayPath,riverRoadCrossings} from '../src/waterways.mjs';

const SOURCES=Object.freeze([
  {key:'intro',world:'blackfen',theme:'moor',places:BLACKFEN_SITES,
    draw:renderBlackfenScenery,nodes:14,roads:29},
  {key:'apprentice',world:'duskmere',theme:'woodland',places:DUSKMERE_SITES,
    draw:renderDuskmereScenery,nodes:18,roads:33},
  {key:'tracker',world:'rookgate',theme:'marsh',places:ROOKGATE_SITES,
    draw:renderRookgateScenery,nodes:26,roads:46},
  {key:'expert',world:'ravenmarch',theme:'eclipse',places:RAVENMARCH_SITES,
    draw:renderRavenmarchScenery,nodes:36,roads:65}
]);

test('every one of the 94 named nodes has exactly one matching original SVG landmark',()=>{
  let tally=0;
  for(const {key,world,theme,places,draw,nodes,roads} of SOURCES){
    const map=MAPS[key];
    const svg=draw();
    assert.equal(map.theme,theme);
    assert.equal(map.edges.length,roads,
      key+' must preserve the original bearing graph');
    assert.equal(Object.keys(map.nodes).length,nodes);
    assert.deepEqual(validateMap(map),[]);
    assert.equal(places.length,nodes);
    assert.equal(new Set(places.map(site=>site.id)).size,nodes);
    assert.equal(new Set(places.map(site=>site.name)).size,nodes);
    assert.equal(new Set(places.map(site=>site.kind)).size,nodes);
    assert.match(svg,new RegExp('class="illustrated-scenery theme-scene-'+theme+'"'));
    assert.match(svg,new RegExp('data-world="'+world+'" aria-hidden="true"'));
    const found=[...svg.matchAll(/data-landmark-id="([^"]+)"/g)].map(m=>m[1]);
    assert.deepEqual(found,places.map(site=>site.id),
      key+' artwork must keep stable node order and one landmark per name');
    for(const site of places){
      const node=map.nodes[site.id];
      assert.ok(node,key+' missing '+site.id);
      assert.equal(node.name,site.name);
      assert.equal(node.landmarkKind,site.kind);
      assert.equal(node.x,site.x);
      assert.equal(node.y,site.y);
      assert.ok(Number.isFinite(site.artDx)&&Number.isFinite(site.artDy));
      assert.ok(svg.includes('<title>'+
        site.name.replaceAll('&','&amp;').replaceAll("'","&apos;")+'</title>'),
        site.name+' must be discoverable through the SVG scene');
      assert.ok(svg.includes('data-landmark-kind="'+site.kind+'"'));
    }
    assert.ok(!svg.includes('<image')&&!svg.includes('<foreignObject')&&
      !svg.includes('xlink:href=')&&!svg.includes('https://'),
      key+' must use original self-contained illustrated geometry');
    tally+=found.length;
  }
  assert.equal(tally,94);
});

test('four landscapes have distinct regional material palettes and common clipping',()=>{
  const palettes=[];
  for(const {world,theme,draw} of SOURCES){
    const svg=draw();
    assert.match(svg,new RegExp('clip-path="url\\(#'+world+'-scene-clip\\)"'));
    assert.match(svg,new RegExp('<clipPath id="'+world+'-scene-clip"'));
    assert.match(svg,new RegExp('<linearGradient id="region-'+theme+'"'));
    const gradient=svg.match(new RegExp('<linearGradient id="region-'+theme+'"[^>]*>([\\s\\S]*?)</linearGradient>'));
    assert.ok(gradient,theme+' needs an intentional regional background palette');
    assert.ok(gradient[1].includes('<stop'));
    palettes.push(gradient[1]);
  }
  assert.equal(new Set(palettes).size,4,
    'Each map needs a distinct mood and geographic identity');
});

test('all decorative waterways are painted from the SAME geometry as the legal bridges',()=>{
  for(const {key,theme,draw} of SOURCES){
    const map=MAPS[key],svg=draw();
    assert.ok(Array.isArray(WATERWAYS[theme])&&WATERWAYS[theme].length>0);
    for(const channel of WATERWAYS[theme]){
      const path=waterwayPath(channel);
      assert.ok(svg.includes('d="'+path+'"'),
        key+' must draw the shared river/canal geometry');
      assert.ok(svg.includes('stroke-width="'+channel.width+'"'),
        key+' water stroke must have the correct actual width');
    }
    for(const crossing of riverRoadCrossings(map)){
      assert.ok(map.edges.some(([a,b])=>a===crossing.from&&b===crossing.to),
        key+' cannot illustrate a bridge where the road graph has none');
    }
  }
});

test('consistent visual finder is public-only and never replaces real movement',()=>{
  const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  assert.match(app,/LOCATION FINDER · FIND A PLACE BY NAME/);
  assert.match(app,/data-map-locate/);
  assert.match(app,/aria-label="Highlight /);
  assert.match(app,/data-map-node/);
  assert.match(app,/class="location-focus-ring"/);
  assert.match(app,/class="location-index-grid"/);
  assert.match(app,/document\.querySelectorAll\('\[data-map-locate\]'\)/);
  assert.match(app,/if\(details\)details\.open=false/);
  assert.match(css,/\.world-svg \.node\.location-spotlight \.location-focus-ring/);
  assert.match(css,/\.location-index-grid \.location-index-choice/);
  assert.match(css,/\.world-svg \.node\[role=button\]:focus-visible \.location-focus-ring/);
  assert.match(css,/\.illustrated-scenery\{pointer-events:none\}/);
  assert.ok(app.includes('renderHunterBoardPiece(hunterAppearance,'));
  assert.ok(app.includes('replayMapView(view,frame)'));
  assert.ok(app.includes("view.phase.startsWith('pass-')"));
});

test('all four exact names are stable and the first three worlds remain unchanged',()=>{
  assert.deepEqual(SOURCES.map(({key})=>MAPS[key].title),[
    'Blackfen Marsh','Duskmere Village','Rookgate District','Ravenmarch County'
  ]);
  assert.deepEqual(SOURCES.map(({key})=>MAPS[key].hunterStart),[
    'A','A08','T10','E12'
  ]);
});
