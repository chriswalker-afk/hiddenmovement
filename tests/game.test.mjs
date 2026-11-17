import test from 'node:test';
import assert from 'node:assert/strict';
import { MAP, MONSTER_SPAWNS, validateMap } from '../src/map.mjs';
import {
  angularDifference,bearingBetween,formatBearing,graphDistance,
  parseBearing,reverseBearing,sectorBounds,withinSector
} from '../src/geometry.mjs';
import {
  beginGame, createGame, endHunterTurn, hunterMove, monsterMove,
  revealTurn, sealTurn, selectMonsterStart, viewForCurrentScreen
} from '../src/engine.mjs';

const beginAt = (place='K',config={}) => {
  const g = createGame(config);
  assert.equal(beginGame(g).ok,true);
  assert.equal(g.phase,'pass-monster-setup');
  assert.equal(revealTurn(g).ok,true);
  assert.equal(selectMonsterStart(g,place).ok,true);
  assert.equal(g.phase,'pass-hunter');
  assert.equal(revealTurn(g).ok,true);
  assert.equal(g.phase,'hunter');
  return g;
};

test('map has connected nodes and unambiguous outgoing bearings', () => {
  assert.deepEqual(validateMap(),[]);
  assert.equal(Object.keys(MAP.nodes).length,14);
  assert.ok(MONSTER_SPAWNS.length>3);
  for(const start of MONSTER_SPAWNS)
    assert.ok(graphDistance('A',start,MAP)>=3);
});

test('bearing directions match the cardinal convention', () => {
  const mid={x:100,y:100};
  assert.equal(bearingBetween(mid,{x:100,y:0}),0);
  assert.equal(bearingBetween(mid,{x:200,y:100}),90);
  assert.equal(bearingBetween(mid,{x:100,y:200}),180);
  assert.equal(bearingBetween(mid,{x:0,y:100}),270);
  assert.equal(bearingBetween(mid,mid),null);
  assert.equal(reverseBearing(245),65);
  assert.equal(reverseBearing(359),179);
});

test('angular ranges wrap north and display three figures', () => {
  assert.equal(angularDifference(359,1),2);
  assert.equal(angularDifference(1,359),2);
  assert.deepEqual(sectorBounds(355,15),['340°','010°']);
  assert.equal(withinSector(5,355,15),true);
  assert.equal(withinSector(40,355,15),false);
  assert.equal(formatBearing(360),'000°');
  assert.equal(formatBearing(7),'007°');
  assert.equal(parseBearing('000'),0);
  assert.equal(parseBearing('360°'),0);
  assert.equal(parseBearing('045'),45);
  assert.equal(parseBearing('45'),null);
  assert.equal(parseBearing('361'),null);
  assert.equal(parseBearing('hello'),null);
});

test('handoff projections disclose no secret state', () => {
  const g=createGame();
  beginGame(g);
  assert.deepEqual(viewForCurrentScreen(g),{phase:'pass-monster-setup'});
  revealTurn(g);
  selectMonsterStart(g,'K');
  assert.deepEqual(viewForCurrentScreen(g),{phase:'pass-hunter'});
  revealTurn(g);
  const hunter=viewForCurrentScreen(g);
  assert.equal(hunter.hunter,'A');
  assert.equal(Object.hasOwn(hunter,'monster'),false);
  assert.equal(Object.hasOwn(hunter,'trail'),false);
  assert.equal(JSON.stringify(hunter).includes('visit-0'),false);
});

test('hunter can move two edges using accurate bearings', () => {
  const g=beginAt('K');
  assert.equal(hunterMove(g,'035°').ok,true);
  assert.equal(g.hunter,'B');
  assert.equal(g.stepsLeft,1);
  assert.equal(hunterMove(g,'055').ok,true);
  assert.equal(g.hunter,'D');
  assert.equal(g.stepsLeft,0);
  assert.equal(hunterMove(g,'165').ok,false);
  assert.equal(g.hunter,'D');
});

test('illegal bearings do not consume steps or reveal a location', () => {
  const g=beginAt('K');
  const result=hunterMove(g,'045');
  assert.equal(result.ok,false);
  assert.equal(g.hunter,'A');
  assert.equal(g.stepsLeft,2);
  const invalid=hunterMove(g,'45');
  assert.equal(invalid.ok,false);
  assert.match(invalid.message,/three-figure/);
});

test('monster moves exactly one edge after sealed handoff', () => {
  const g=beginAt('K');
  endHunterTurn(g);
  assert.deepEqual(viewForCurrentScreen(g),{phase:'pass-monster'});
  revealTurn(g);
  assert.equal(g.phase,'monster');
  assert.equal(monsterMove(g,'000').ok,true);
  assert.equal(g.monster,'I');
  assert.equal(g.round,2);
  assert.deepEqual(viewForCurrentScreen(g),{phase:'pass-hunter'});
  assert.equal(monsterMove(g,'358').ok,false);
});

test('fresh trace gives time-consistent bearing clue with north wrap', () => {
  const g=beginAt('K');
  assert.equal(hunterMove(g,'170').ok,true); // A -> M
  endHunterTurn(g);
  revealTurn(g);
  assert.equal(monsterMove(g,'000').ok,true); // K -> I
  revealTurn(g);
  assert.equal(hunterMove(g,'029').ok,true); // M -> C
  assert.equal(hunterMove(g,'129').ok,true); // C -> F
  endHunterTurn(g);
  revealTurn(g);
  assert.equal(monsterMove(g,'358').ok,true); // I -> J
  revealTurn(g);
  assert.equal(hunterMove(g,'105').ok,true); // F -> N
  assert.equal(hunterMove(g,'074').ok,true); // N -> K, where monster spawned
  assert.equal(g.clues.length,1);
  const clue=g.clues[0];
  assert.equal(clue.place,'K');
  assert.equal(clue.visitRound,0);
  assert.equal(clue.observedRound,2);
  assert.equal(clue.kind,'direct');
  const trueBearing=bearingBetween(MAP.nodes.K,MAP.nodes.J);
  assert.ok(angularDifference(clue.sectorCenter,trueBearing)<0.001);
  assert.ok(withinSector(trueBearing,clue.center,clue.halfWidth));
  const projection=viewForCurrentScreen(g);
  assert.equal(Object.hasOwn(projection,'monster'),false);
  assert.equal(projection.clues.length,1);
});

test('hunter captures by arriving at monster location', () => {
  const g=beginAt('G');
  hunterMove(g,'035'); // A -> B
  hunterMove(g,'055'); // B -> D
  endHunterTurn(g);
  revealTurn(g);
  monsterMove(g,'227'); // G -> E
  revealTurn(g);
  const result=hunterMove(g,'165'); // D -> E
  assert.equal(result.ok,true);
  assert.equal(g.winner,'hunter');
  assert.equal(g.phase,'over');
  assert.equal(viewForCurrentScreen(g).monster,'E'); // Reveal allowed at game over
});

test('monster walking onto the hunter ends the game immediately', () => {
  const g=beginAt('G');
  hunterMove(g,'035'); // A -> B
  hunterMove(g,'055'); // B -> D
  endHunterTurn(g);
  revealTurn(g);
  monsterMove(g,'286'); // G -> D
  assert.equal(g.winner,'hunter');
  assert.equal(g.phase,'over');
});

test('monster wins after hunter uses final allotted round', () => {
  const g=beginAt('K',{maxRounds:1});
  const result=endHunterTurn(g);
  assert.equal(result.ok,true);
  assert.equal(g.phase,'over');
  assert.equal(g.winner,'monster');
});

test('sealing on app hide replaces role-specific view with empty handoff projection', () => {
  const g=beginAt('K');
  sealTurn(g);
  assert.deepEqual(viewForCurrentScreen(g),{phase:'pass-hunter'});
  revealTurn(g);
  endHunterTurn(g);
  revealTurn(g);
  sealTurn(g);
  assert.deepEqual(viewForCurrentScreen(g),{phase:'pass-monster'});
  revealTurn(g);
  assert.equal(g.phase,'monster');
});

test('clues are not awarded repeatedly from the same trail visit', () => {
  const g=beginAt('K');
  g.monster='J';
  g.monsterTrail=[{id:'visit-0',node:'C',round:0}];
  hunterMove(g,'123'); // A -> C
  assert.equal(g.clues.length,1);
  hunterMove(g,'303'); // C -> A
  endHunterTurn(g);
  // Do not call monsterMove; set up second turn under a controlled test state.
  g.phase='hunter';
  g.round=2;
  g.stepsLeft=2;
  hunterMove(g,'123'); // A -> C again
  assert.equal(g.clues.length,1);
});
