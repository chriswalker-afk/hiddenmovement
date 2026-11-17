import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAPS} from '../src/map.mjs';
import {beginGame,createGame,viewForCurrentScreen,endHunterTurn} from '../src/engine.mjs';
import {serializeGame,restoreGame} from '../src/persistence.mjs';
import {
  TOUR_STAGES,DEFAULT_TOUR_STAGE,advanceTour,reconcileTour,tourStep,
  initialRulerPosition,nearHunter,validTourStage
} from '../src/guided-walkthrough.mjs';

test('complete first-turn walkthrough advances on real actions, not time',()=>{
  const actions=[
    ['tool-on','place-protractor'],['tool-centred','open-clue'],
    ['clues-open','read-bearing'],['bearing-read','enable-deduction'],
    ['deduction-on','explain-deduction'],['understood','first-move'],
    ['hunter-moved','search-report'],['report-dismissed','second-move'],
    ['hunter-moved','end-turn'],['turn-ended','monster-wait'],
    ['monster-finished','monster-moved'],['clues-open','independent'],
    ['finish','done']
  ];
  let stage=DEFAULT_TOUR_STAGE;
  assert.equal(stage,'enable-protractor');
  assert.equal(TOUR_STAGES.length,14);
  for(const [action,expected] of actions){
    assert.equal(advanceTour(stage,'not-a-real-action'),stage);
    stage=advanceTour(stage,action);
    assert.equal(stage,expected,'step after '+action);
    assert.equal(validTourStage(stage),true);
  }
  assert.equal(advanceTour('done','tool-on'),'done');
  assert.equal(advanceTour('unknown','tool-on'),DEFAULT_TOUR_STAGE);
  assert.equal(advanceTour('enable-protractor','skip'),'done');
  assert.equal(advanceTour('read-bearing','skip'),'done');
});

test('students genuinely position the ruler on the Hunter',()=>{
  for(const map of Object.values(MAPS)){
    const actor=map.nodes[map.hunterStart];
    const start=initialRulerPosition(actor);
    assert.ok(start&&start.x>=10&&start.x<=990&&start.y>=10&&start.y<=710);
    assert.equal(nearHunter(start,actor),false);
    assert.equal(nearHunter({...actor},actor),true);
    assert.equal(nearHunter({x:actor.x+34,y:actor.y},actor),true);
    assert.equal(nearHunter({x:actor.x+65,y:actor.y},actor),false);
  }
  assert.equal(nearHunter(null,MAPS.intro.nodes.A),false);
  assert.equal(nearHunter({x:NaN,y:0},MAPS.intro.nodes.A),false);
});

test('clue tutorial uses only public evidence, with real observation source and time',()=>{
  for(const difficulty of Object.keys(MAPS)){
    const g=createGame({mode:'solo',difficulty,guided:true,seed:128});
    beginGame(g);
    const view=viewForCurrentScreen(g),map=g.map;
    const stages=['enable-protractor','place-protractor','open-clue',
      'read-bearing','enable-deduction','explain-deduction',
      'first-move','second-move','end-turn','monster-moved','independent'];
    const model=stages.map(stage=>tourStep(view,map,stage));
    assert.ok(model.every(step=>step&&step.heading&&step.text&&step.target!==undefined));
    assert.deepEqual(model.slice(0,5).map(x=>x.target),[
      '#protractor-toggle','.protractor-center-hit','#hud-tab-clues',
      '.clue-card','#plot-toggle'
    ]);
    assert.equal(model[6].target,'#bearing-input');
    assert.equal(model[8].target,'#end-turn');
    assert.equal(model[9].target,'#hud-tab-clues');
    assert.ok(model[3].text.includes(map.nodes[view.clues[0].place].name));
    assert.match(model[3].text,/round 0/);
    assert.match(model[3].text,/not live|NOT live/i);
    assert.match(model[4].text,/does not reveal/);
    assert.match(model[9].text,/secret/i);
    assert.match(model[10].heading,/on your own/i);
    assert.equal(JSON.stringify(model).includes('"monsterTrail"'),false);
    assert.equal(JSON.stringify(model).includes('"monster":'),false);
    assert.equal(Object.hasOwn(view,'monster'),false);
    assert.equal(tourStep({...view,guided:false},map,'enable-protractor'),null);
    assert.equal(tourStep({...view,phase:'monster'},map,'enable-protractor'),null);
  }
});

test('ending early and a subsequent hidden Monster turn do not strand the student',()=>{
  const g=createGame({mode:'solo',difficulty:'intro',guided:true,seed:9});
  beginGame(g);
  assert.equal(reconcileTour('first-move',viewForCurrentScreen(g)),'first-move');
  assert.equal(advanceTour('open-clue','turn-ended'),'monster-wait');
  endHunterTurn(g);
  const view=viewForCurrentScreen(g);
  assert.equal(view.phase,'hunter');
  assert.equal(view.round,2);
  assert.equal(reconcileTour('monster-wait',view),'monster-moved');
  assert.equal(reconcileTour('open-clue',view),'monster-moved');
  assert.equal(reconcileTour('done',view),'done');
  assert.equal(reconcileTour('monster-moved',{...view,phase:'over'}),'done');
});

test('save/resume stores only stage metadata; pass-and-play remains sealed',()=>{
  const g=createGame({mode:'solo',difficulty:'intro',guided:true,seed:918});
  beginGame(g);
  const saved=serializeGame(g,{tourStage:'read-bearing',introSeen:true});
  const raw=JSON.parse(saved);
  assert.equal(raw.ui.tourStage,'read-bearing');
  assert.equal(Object.hasOwn(raw.ui,'monster'),false);
  const restored=restoreGame(saved);
  assert.equal(restored.ui.tourStage,'read-bearing');
  assert.equal(restored.game.guided,true);
  assert.equal(JSON.parse(serializeGame(g,{tourStage:'unknown'})).ui.tourStage,'done');
  const multi=createGame({mode:'multi',guided:true});
  beginGame(multi);
  const other=restoreGame(serializeGame(multi,{tourStage:'place-protractor'}));
  assert.match(other.game.phase,/^pass-/);
  assert.equal(other.ui.tourStage,'place-protractor');
  assert.deepEqual(Object.keys(viewForCurrentScreen(other.game)),['phase']);
});

test('on-screen arrows and privacy preserving controls appear in source',()=>{
  const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  const guide=readFileSync(new URL('../src/guided-walkthrough.mjs',import.meta.url),'utf8');
  for(const value of ['guided-tour-arrow','guided-tour-progress','guided-tour-skip',
    'guided-tour-target','guided-search-note','initialRulerPosition','nearHunter',
    "tourEvent('deduction-on')","tourEvent('hunter-moved')",
    "tourEvent('turn-ended')","tourEvent('clues-open')"]){
    assert.ok(app.includes(value),'Missing guided integration '+value);
  }
  assert.match(css,/\.guided-tour-arrow/);
  assert.match(css,/@keyframes guided-target-pulse/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.ok(app.includes('view.guided && plotClue ? selectedClues(view)'));
  assert.ok(app.includes("view.phase.startsWith('pass-')"));
  assert.ok(!guide.includes('game.monster')&&!guide.includes('monsterTrail'));
});
