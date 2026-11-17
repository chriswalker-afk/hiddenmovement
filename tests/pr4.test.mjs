import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPS } from '../src/map.mjs';
import { graphDistance, bearingBetween, formatBearing, withinSector } from '../src/geometry.mjs';
import { SCENARIOS, computeObjectives, eligibleMonsterStarts, scenarioInstruction } from '../src/scenarios.mjs';
import {
  beginGame, createGame, endHunterTurn, hunterMove, monsterMove, revealTurn,
  selectMonsterStart, useLantern, viewForCurrentScreen
} from '../src/engine.mjs';
import {
  serializeGame,restoreGame,persistSaved,readSaved,savedSummary,clearSaved,STORAGE_KEY
} from '../src/persistence.mjs';
import { analyseClues } from '../src/deduction.mjs';
import { renderScenery, renderTitleArt } from '../src/scenery.mjs';

const bearing=(map,a,b)=>formatBearing(bearingBetween(map.nodes[a],map.nodes[b]));
const setup=(scenario='classic')=>{
  const game=createGame({mode:'multi',scenario,seed:2026});
  assert.equal(beginGame(game).ok,true);
  assert.equal(revealTurn(game).ok,true);
  const spawns=eligibleMonsterStarts(game.map,scenario,game.objectives);
  assert.ok(spawns.length>0);
  assert.equal(selectMonsterStart(game,spawns[0]).ok,true);
  assert.deepEqual(viewForCurrentScreen(game),{phase:'pass-hunter'});
  assert.equal(revealTurn(game).ok,true);
  return game;
};

test('mission objectives stay separate and fair on every playable region',()=>{
  assert.deepEqual(Object.keys(SCENARIOS),['classic','escape','beacons']);
  for(const map of Object.values(MAPS)){
    const classic=computeObjectives(map,'classic');
    assert.equal(classic.exitNode,null);
    const exit=computeObjectives(map,'escape');
    assert.ok(map.nodes[exit.exitNode]);
    assert.ok(graphDistance(map.hunterStart,exit.exitNode,map)>=3);
    const spawnExit=eligibleMonsterStarts(map,'escape',exit);
    assert.ok(spawnExit.length>=1);
    assert.ok(spawnExit.every(n=>n!==exit.exitNode));
    const beacon=computeObjectives(map,'beacons');
    assert.equal(beacon.beacons.length,2);
    assert.notEqual(beacon.beacons[0],beacon.beacons[1]);
    assert.ok(beacon.beacons.every(id=>map.nodes[id]&&graphDistance(map.hunterStart,id,map)>=3));
    assert.ok(eligibleMonsterStarts(map,'beacons',beacon).every(id=>!beacon.beacons.includes(id)));
  }
  const game=createGame({mode:'solo',scenario:'escape',difficulty:'expert'});
  assert.match(scenarioInstruction(game),/round 5/);
});

test('the public Escape Gate only wins on a valid Monster entrance from round 5',()=>{
  const g=setup('escape');
  const exit=g.objectives.exitNode;
  const near=g.map.adjacency[exit].find(id=>id!==g.map.hunterStart);
  g.hunter=g.map.hunterStart;
  g.monster=near;
  g.phase='monster';
  g.round=4;
  let res=monsterMove(g,bearing(g.map,near,exit));
  assert.equal(res.ok,true);
  assert.equal(g.winner,null,'Entering the gate too early is not instant victory');
  assert.equal(g.round,5);
  g.monster=near;
  g.phase='monster';
  res=monsterMove(g,bearing(g.map,near,exit));
  assert.equal(res.ok,true);
  assert.equal(g.phase,'over');
  assert.equal(g.winner,'monster');
  assert.equal(g.finishReason,'escape');
  const view=viewForCurrentScreen(g);
  assert.equal(view.objectives.exitNode,exit);
  assert.equal(view.finishReason,'escape');
});

test('two public beacon visits end the mission and produce trustworthy historical location fixes',()=>{
  const g=setup('beacons');
  const [a,b]=g.objectives.beacons;
  for(const [i,target] of [a,b].entries()){
    const before=g.map.adjacency[target].find(id=>id!==g.hunter);
    g.monster=before;
    g.phase='monster';
    g.round=i+1;
    const res=monsterMove(g,bearing(g.map,before,target));
    assert.equal(res.ok,true);
    const clue=g.clues.find(c=>c.type==='beacon'&&c.pointNode===target);
    assert.ok(clue,'Missing public beacon location fix');
    assert.equal(clue.observedRound,i+1);
    assert.deepEqual(analyseClues(g.map,[clue],i+2).candidates.includes(target),i===0?false:true===false?false:true);
    if(i===0){
      assert.equal(g.winner,null);
      assert.deepEqual(g.beaconVisits,[a]);
      const hunterView=viewForCurrentScreen(g); // handoff is sealed
      assert.deepEqual(hunterView,{phase:'pass-hunter'});
      g.phase='hunter';
      const shown=viewForCurrentScreen(g);
      assert.ok(shown.clues.some(c=>c.pointNode===a));
      assert.equal(Object.hasOwn(shown,'monster'),false);
    }
  }
  assert.equal(g.winner,'monster');
  assert.equal(g.finishReason,'beacons');
  assert.deepEqual(g.beaconVisits,[a,b]);
});

test('Monster Veil hides exactly one trail, remains a public event and never removes capture',()=>{
  const g=setup('escape');
  g.monster='K';g.hunter='A';g.phase='monster';g.round=1;
  const dest='I';
  const veil=monsterMove(g,bearing(g.map,'K',dest),{veil:true});
  assert.equal(veil.ok,true);
  assert.equal(g.veilCharges,0);
  assert.equal(g.monsterTrail.at(-1).node,dest);
  assert.equal(g.monsterTrail.at(-1).concealed,true);
  assert.equal(g.publicEvents.at(-1).type,'veil');
  g.monster='J';g.phase='hunter';g.hunter='H';g.stepsLeft=2;
  const cluesBefore=g.clues.length;
  const step=hunterMove(g,bearing(g.map,'H',dest));
  assert.equal(step.ok,true);
  assert.equal(g.clues.length,cluesBefore,'Obscured trace must not produce a clue');
  g.phase='monster';g.monster='K';g.hunter='A';
  assert.equal(monsterMove(g,bearing(g.map,'K',dest),{veil:true}).ok,false);
  g.phase='monster';g.monster='B';g.hunter='D';g.veilCharges=1;
  const capture=monsterMove(g,bearing(g.map,'B','D'),{veil:true});
  assert.equal(capture.ok,true);
  assert.equal(g.winner,'hunter','Veil must never defeat direct capture');
});

test('Signal Lantern costs one Hunter move and reveals a truthful directional sector only once',()=>{
  const g=setup('escape');
  g.hunter='A';g.monster='K';g.phase='hunter';g.stepsLeft=2;
  const first=useLantern(g);
  assert.equal(first.ok,true);
  assert.equal(g.stepsLeft,1);
  assert.equal(g.lanternCharges,0);
  const clue=g.clues.at(0);
  assert.equal(clue.source,'lantern');
  assert.equal(clue.type,'sighting');
  assert.equal(clue.observedRound,g.round-1);
  assert.ok(withinSector(bearingBetween(g.map.nodes[g.hunter],g.map.nodes[g.monster]),
    clue.sectorCenter,clue.halfWidth));
  assert.equal(g.publicEvents.at(-1).type,'lantern');
  assert.equal(useLantern(g).ok,false);
  assert.equal(g.stepsLeft,1);
  const classic=setup('classic');
  assert.equal(useLantern(classic).ok,false);
});

test('scenario AI moves legally on all four maps and exposes no secret state',()=>{
  for(const scenario of ['escape','beacons']){
    for(const difficulty of Object.keys(MAPS)){
      const g=createGame({mode:'solo',difficulty,scenario,seed:1041});
      beginGame(g);
      assert.equal(g.phase,'hunter');
      let turns=0;
      while(g.phase==='hunter'&&turns++<g.config.maxRounds) {
        const view=viewForCurrentScreen(g);
        assert.equal(Object.hasOwn(view,'monster'),false);
        assert.ok(view.objectives);
        assert.ok(view.publicEvents);
        endHunterTurn(g);
        assert.ok(['hunter','over'].includes(g.phase));
      }
      assert.equal(g.phase,'over');
      assert.ok(['monster','hunter'].includes(g.winner));
    }
  }
});

test('shared-device save and resume always re-seals private Hunter or Monster screens',()=>{
  const g=setup('beacons');
  const text=serializeGame(g,{fieldNotes:'The south crossing seems promising',
    marks:[['A','possible'],['K','ruled']],plotClue:true});
  assert.ok(text.includes('The south crossing'));
  const restored=restoreGame(text);
  assert.ok(restored);
  assert.equal(restored.game.phase,'pass-hunter');
  assert.deepEqual(viewForCurrentScreen(restored.game),{phase:'pass-hunter'});
  assert.equal(restored.ui.fieldNotes,'The south crossing seems promising');
  assert.deepEqual(restored.ui.marks,[['A','possible'],['K','ruled']]);
  revealTurn(restored.game);
  assert.equal(restored.game.phase,'hunter');
  assert.equal(restored.game.monster,g.monster);
  assert.equal(restored.game.hunter,g.hunter);
  assert.equal(restored.game.scenario,'beacons');

  g.phase='monster';
  const monsterSave=restoreGame(serializeGame(g));
  assert.equal(monsterSave.game.phase,'pass-monster');
  assert.deepEqual(viewForCurrentScreen(monsterSave.game),{phase:'pass-monster'});

  const m={values:new Map(),setItem(k,v){this.values.set(k,v);},getItem(k){return this.values.get(k)||null;},removeItem(k){this.values.delete(k);}};
  assert.equal(persistSaved(m,g,{fieldNotes:'private'}),true);
  assert.equal(m.values.has(STORAGE_KEY),true);
  assert.deepEqual(savedSummary(m),{mode:'multi',difficulty:'intro',scenario:'beacons',round:g.round});
  assert.equal(readSaved(m).ui.fieldNotes,'private');
  assert.equal(clearSaved(m),true);
  assert.equal(savedSummary(m),null);
});

test('corrupt or incompatible saved snapshots cannot restore an unsealed role',()=>{
  const g=setup('escape');
  const state=JSON.parse(serializeGame(g));
  assert.equal(restoreGame('{}'),null);
  assert.equal(restoreGame('not-json'),null);
  assert.equal(restoreGame(''),null);
  assert.equal(restoreGame('x'.repeat(200000)),null);
  const bad1=structuredClone(state);bad1.version=99;
  assert.equal(restoreGame(JSON.stringify(bad1)),null);
  const bad2=structuredClone(state);bad2.monster='evil';
  assert.equal(restoreGame(JSON.stringify(bad2)),null);
  const bad3=structuredClone(state);bad3.round=999;
  assert.equal(restoreGame(JSON.stringify(bad3)),null);
  const bad4=structuredClone(state);bad4.scenario='arbitrary';
  assert.equal(restoreGame(JSON.stringify(bad4)),null);
  assert.equal(persistSaved(null,g),false);
});

test('each new region has original separate SVG scenery, without hiding map roads',()=>{
  const terrains=['moor','woodland','marsh','eclipse'];
  const maps=terrains.map(t=>renderScenery(t));
  for(const [i,svg] of maps.entries()){
    assert.match(svg,/illustrated-scenery/);
    assert.match(svg,/aria-hidden="true"/);
    assert.match(svg,new RegExp('theme-scene-'+terrains[i]));
    assert.match(svg,/linearGradient/);
    assert.ok(svg.length>1500);
  }
  assert.notEqual(maps[0],maps[1]);
  assert.notEqual(maps[1],maps[2]);
  assert.notEqual(maps[2],maps[3]);
  assert.match(renderTitleArt(),/home-art/);
});
