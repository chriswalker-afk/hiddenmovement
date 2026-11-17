import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MAPS } from '../src/map.mjs';
import { bearingBetween, formatBearing } from '../src/geometry.mjs';
import { beginGame, createGame, endHunterTurn, hunterMove, viewForCurrentScreen } from '../src/engine.mjs';
import { bearingFromPointer, normalizeBearing, renderProtractor } from '../src/protractor.mjs';

test('manual bearing tool is truly clockwise from north and never knows the road graph',()=>{
  assert.equal(bearingFromPointer(0,-20,0,0),0);
  assert.equal(bearingFromPointer(20,0,0,0),90);
  assert.equal(bearingFromPointer(0,20,0,0),180);
  assert.equal(bearingFromPointer(-20,0,0,0),270);
  assert.equal(bearingFromPointer(0,0,0,0),null);
  assert.equal(bearingFromPointer(5,10,NaN,0),null);
  assert.equal(normalizeBearing(-1),359);
  assert.equal(normalizeBearing(360),0);
  assert.equal(normalizeBearing(721),1);
  const svg=renderProtractor(100,200,45);
  assert.match(svg,/transform="translate\(100 200\)"/);
  assert.match(svg,/rotate\(45\)/);
  assert.match(svg,/data-protractor-move="true"/);
  assert.match(svg,/data-protractor-rotate="true"/);
  assert.match(svg,/045°/);
  assert.equal([...svg.matchAll(/class="protractor-tick(?:-major)?"/g)].length,72);
  assert.doesNotMatch(svg,/monsterTrail|graphDistance|road-target/);
});

test('standard play preserves existing bearing sightings, route-distance hints and earned clues',()=>{
  for(const difficulty of Object.keys(MAPS)){
    const g=createGame({mode:'solo',difficulty,seed:1083});
    assert.equal(g.guided,false);
    assert.equal(g.config.openingPulse,true);
    assert.ok(g.config.sightingInterval>0);
    assert.equal(g.config.distanceBandHalfWidth,
      difficulty==='intro'?0:difficulty==='apprentice'?1:null);
    beginGame(g);
    assert.equal(g.phase,'hunter');
    assert.equal(g.clues.length,1,'Every difficulty still provides the opening textual clue');
    assert.equal(g.clues[0].type,'sighting');
    const neighbour=g.map.adjacency[g.hunter][0];
    if(neighbour!==g.monster){
      g.monsterTrail.push({id:'controlled-trace',node:neighbour,round:0});
      const angle=formatBearing(bearingBetween(g.map.nodes[g.hunter],g.map.nodes[neighbour]));
      const result=hunterMove(g,angle);
      assert.equal(result.ok,true);
      assert.match(result.message,/Travelled \d{3}°/);
      assert.match(result.message,/error:/);
      assert.equal(g.clues[0].type,'trace','Earned trail clues remain available');
      assert.equal(Object.hasOwn(g.clues[0],'distanceMin'),
        difficulty==='intro'||difficulty==='apprentice');
    }
    endHunterTurn(g);
    const publicView=viewForCurrentScreen(g);
    assert.equal(publicView.guided,false);
    assert.ok(publicView.clues.some(c=>c.type==='sighting'));
    assert.equal(Object.hasOwn(publicView,'monster'),false);
  }
});

test('Guided changes visual assistance only; exact same gameplay clues in both modes',()=>{
  const common={mode:'solo',difficulty:'intro',seed:1083};
  const regular=createGame(common),guided=createGame({...common,guided:true});
  beginGame(regular);
  beginGame(guided);
  assert.equal(guided.guided,true);
  assert.equal(regular.guided,false);
  assert.deepEqual(regular.clues,guided.clues);
  assert.equal(regular.monster,guided.monster);
  assert.equal(regular.config.openingPulse,guided.config.openingPulse);
  assert.equal(regular.config.sightingInterval,guided.config.sightingInterval);
  assert.equal(regular.config.distanceBandHalfWidth,guided.config.distanceBandHalfWidth);
  const neighbour=regular.map.adjacency[regular.hunter][0];
  if(neighbour!==regular.monster){
    for(const game of [regular,guided])
      game.monsterTrail.push({id:'matching-trace',node:neighbour,round:0});
    const angle=formatBearing(bearingBetween(regular.map.nodes[regular.hunter],
      regular.map.nodes[neighbour]));
    const one=hunterMove(regular,angle),two=hunterMove(guided,angle);
    assert.deepEqual(one,two);
    assert.deepEqual(regular.clues,guided.clues);
  }
  endHunterTurn(regular);
  endHunterTurn(guided);
  assert.deepEqual(regular.clues,guided.clues);
});

test('CSS constrains the game viewport and scrolls only optional tab content',()=>{
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  assert.match(css,/\.hud-screen\s*\{[^}]*height:100dvh;[^}]*overflow:hidden/s);
  assert.match(css,/\.hud-grid\s*\{[^}]*grid-template-columns/s);
  assert.match(css,/\.hud-tab-panel\s*\{[^}]*overflow:auto/s);
  assert.match(css,/@media\(max-width:800px\)/);
  assert.match(css,/\.protractor-arm-hit\s*\{[^}]*touch-action:none/s);
});

test('HUD exposes map and essential controls on one screen; secondary details are in tabs',async()=>{
  const callbacks=new Map();
  const nodes=new Map();
  const get=id=>{
    if(!nodes.has(id))nodes.set(id,{
      id,innerHTML:'',textContent:'',value:'',dataset:{},checked:false,
      addEventListener(type,callback){callbacks.set(id+':'+type,callback);},
      setAttribute(key,value){this[key]=value;},
      focus(){}
    });
    return nodes.get(id);
  };
  const html=()=>get('app').innerHTML;
  globalThis.localStorage={
    getItem:()=>null,setItem(){},removeItem(){}
  };
  globalThis.document={
    hidden:false,
    getElementById:get,
    querySelectorAll(selector){
      if(selector==='[data-difficulty]'){
        return Object.keys(MAPS).map(id=>{
          const node=get('difficulty-'+id);
          node.dataset.difficulty=id;
          return node;
        });
      }
      if(selector==='[data-hud-tab]'){
        return [...html().matchAll(/data-hud-tab="([^"]+)"/g)].map(match=>{
          const node=get('hud-tab-'+match[1]);
          node.dataset.hudTab=match[1];
          return node;
        });
      }
      return [];
    },
    addEventListener(type,callback){callbacks.set('document:'+type,callback);}
  };
  globalThis.confirm=()=>true;
  const click=id=>{
    const callback=callbacks.get(id+':click');
    assert.equal(typeof callback,'function','Missing click listener: '+id);
    callback({preventDefault(){}});
  };
  await import('../src/app.mjs');
  assert.match(html(),/STANDARD PLAY/);
  click('start-solo-select');
  click('difficulty-expert');
  assert.match(html(),/hud-screen/);
  assert.match(html(),/hud-grid/);
  assert.match(html(),/hud-sidebar/);
  assert.match(html(),/ENTER|Enter a three-figure bearing/);
  assert.match(html(),/end-turn/);
  assert.match(html(),/protractor-toggle/);
  assert.match(html(),/map-zoom-in/);
  assert.match(html(),/ROUND/);
  assert.match(html(),/CLUES \(1\)/);
  assert.match(html(),/WATCHER SIGHTING/);
  assert.match(html(),/Roads lead to:/);
  assert.doesNotMatch(html(),/COMBINE CLUES ON THE MAP/);
  assert.doesNotMatch(html(),/class="clue-(?:ray|sector)"/);
  click('hud-tab-notes');
  assert.match(html(),/YOUR OWN NOTES/);
  click('hud-tab-mission');
  assert.match(html(),/THE LONG HUNT/);
  click('protractor-toggle');
  assert.match(html(),/id="protractor-group"/);
  assert.match(html(),/id="protractor-readout"/);
  assert.match(html(),/data-protractor-rotate/);
  click('protractor-plus');
  assert.equal(get('protractor-readout').textContent,'001°');
  click('hud-tab-clues');
  assert.match(html(),/rotate\(1\)/);
  click('protractor-minus');
  assert.equal(get('protractor-readout').textContent,'000°');
  click('protractor-toggle');
  assert.doesNotMatch(html(),/id="protractor-group"/);
  click('end-turn');
  assert.match(html(),/WATCHER SIGHTING/);
  assert.doesNotMatch(html(),/class="clue-(?:ray|sector)"/);

  // Guided has the same textual clues; the map plot appears only after clicking.
  click('brand-link');
  click('guided-toggle');
  click('start-solo-select');
  click('difficulty-intro');
  click('hud-tab-clues');
  assert.match(html(),/WATCHER SIGHTING/);
  assert.match(html(),/COMBINE CLUES ON THE MAP/);
  assert.doesNotMatch(html(),/class="clue-(?:ray|sector)"/);
  click('plot-toggle');
  assert.match(html(),/class="clue-(?:ray|sector)"/);
  click('plot-toggle');
  assert.doesNotMatch(html(),/class="clue-(?:ray|sector)"/);

  // Shared-device handoffs must never retain the ruler or former player state.
  click('brand-link');
  click('start-two');
  assert.match(html(),/Pass this device to the monster and look away/);
  assert.doesNotMatch(html(),/world-svg|protractor-group/);
  click('reveal');
  click('confirm-spawn');
  click('reveal');
  click('protractor-toggle');
  assert.match(html(),/id="protractor-group"/);
  click('end-turn');
  assert.match(html(),/Pass this device to the monster and look away/);
  assert.doesNotMatch(html(),/world-svg|protractor-group|hud-sidebar/);
});
