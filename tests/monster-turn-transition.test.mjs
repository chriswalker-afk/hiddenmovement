import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAPS} from '../src/map.mjs';
import {
  createGame,beginGame,hunterMove,endHunterTurn,viewForCurrentScreen
} from '../src/engine.mjs';
import {bearingBetween,formatBearing} from '../src/geometry.mjs';
import {bearingToolsAvailable,hunterTurnTransition} from '../src/turn-transition.mjs';
import {tourStep} from '../src/guided-walkthrough.mjs';

test('the Monster does not start moving just because Hunter steps reach zero',()=>{
  for(const difficulty of Object.keys(MAPS)){
    const game=createGame({mode:'solo',difficulty,seed:9183,guided:true});
    beginGame(game);
    const monsterBefore=game.monster;
    const trailBefore=game.monsterTrail.length;
    const roundBefore=game.round;
    const start=game.hunter,neighbour=game.map.adjacency[start][0];
    const forward=formatBearing(bearingBetween(game.map.nodes[start],game.map.nodes[neighbour]));
    const backward=formatBearing(bearingBetween(game.map.nodes[neighbour],game.map.nodes[start]));
    assert.equal(hunterMove(game,forward).ok,true);
    assert.equal(hunterMove(game,backward).ok,true);
    assert.equal(game.phase,'hunter');
    assert.equal(game.stepsLeft,0);
    assert.equal(game.monster,monsterBefore);
    assert.equal(game.monsterTrail.length,trailBefore);
    assert.equal(game.round,roundBefore);
    const view=viewForCurrentScreen(game);
    assert.equal(bearingToolsAvailable(view),false);
    const step=hunterTurnTransition(view);
    assert.equal(step.ready,true);
    assert.equal(step.next,'secret-move');
    assert.match(step.button,/BEGIN MONSTER’S HIDDEN MOVEMENT/);
    assert.match(step.hint,/has NOT moved yet/);
    assert.match(step.hint,/press below/i);
    const tutorial=tourStep(view,game.map,'end-turn');
    assert.match(tutorial.text,/does not start moving until you press it/);
    assert.equal(endHunterTurn(game).ok,true);
    assert.equal(game.round,roundBefore+1);
    assert.equal(game.monsterTrail.length,trailBefore+1);
    assert.equal(viewForCurrentScreen(game).phase,'hunter');
    assert.equal(bearingToolsAvailable(viewForCurrentScreen(game)),true);
  }
});

test('after no moves the UI distinguishes solo, pass-and-play, and the final round',()=>{
  const base={
    phase:'hunter',stepsLeft:0,round:3,maxRounds:13,mode:'solo'
  };
  const standard=hunterTurnTransition({...base,guided:false});
  const guided=hunterTurnTransition({...base,guided:true});
  assert.deepEqual(standard,guided,'Guided cannot change when the Monster moves');
  assert.equal(standard.ready,true);
  assert.equal(standard.next,'secret-move');
  const twoPlayer=hunterTurnTransition({...base,mode:'multi'});
  assert.equal(twoPlayer.ready,true);
  assert.equal(twoPlayer.next,'handoff');
  assert.match(twoPlayer.button,/HAND OVER/);
  assert.match(twoPlayer.hint,/hide the map/);
  const final=hunterTurnTransition({...base,round:13});
  assert.equal(final.next,'results');
  assert.match(final.button,/FINAL ROUND/);
  assert.match(final.hint,/no further Monster movement/i);
  const early=hunterTurnTransition({...base,stepsLeft:1});
  assert.equal(early.ready,false);
  assert.match(early.button,/END HUNTER TURN EARLY/);
  assert.match(early.hint,/Monster moves only when you end your turn/);
  assert.equal(hunterTurnTransition({...base,phase:'monster'}),null);
});

test('the manual bearing protractor is unavailable for an exhausted Hunter',()=>{
  for(const phase of ['hunter','monster','pass-hunter','pass-monster','over']){
    const v={phase,stepsLeft:0};
    assert.equal(bearingToolsAvailable(v),phase==='monster');
  }
  assert.equal(bearingToolsAvailable({phase:'hunter',stepsLeft:2}),true);
  assert.equal(bearingToolsAvailable({phase:'hunter',stepsLeft:1}),true);
  assert.equal(bearingToolsAvailable(null),false);
});

test('final round confirmation does not run an extra secret Monster move',()=>{
  const game=createGame({mode:'solo',difficulty:'intro',guided:true,seed:19});
  beginGame(game);
  game.round=game.config.maxRounds;
  game.stepsLeft=0;
  const before=game.monsterTrail.length;
  assert.equal(hunterTurnTransition(viewForCurrentScreen(game)).next,'results');
  const result=endHunterTurn(game);
  assert.equal(result.ok,true);
  assert.equal(game.phase,'over');
  assert.equal(game.monsterTrail.length,before);
  assert.equal(game.winner,'monster');
});

test('the UI entirely removes exhausted bearing controls and keeps a real end-turn button',()=>{
  const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  const guide=readFileSync(new URL('../src/hunter-guide.mjs',import.meta.url),'utf8');
  assert.match(app,/if\(!monster&&transition\.ready\)/);
  assert.match(app,/hunter-turn-complete/);
  assert.match(app,/monster-turn-cta/);
  assert.match(app,/aria-describedby="monster-phase-help"/);
  assert.match(app,/document\.getElementById\('move-form'\)\?\.addEventListener/);
  assert.match(app,/const protractor=\(protractorVisible && bearingToolsAvailable\(view\)/);
  assert.match(app,/if\(view\.phase==='hunter'&&view\.stepsLeft===0\)resetProtractor\(\)/);
  assert.match(css,/\.monster-turn-cta\{/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(guide,/hunterTurnTransition\(view\)/);
});
