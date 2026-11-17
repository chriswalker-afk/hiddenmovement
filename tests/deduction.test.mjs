import test from 'node:test';
import assert from 'node:assert/strict';
import { MAP, MAPS } from '../src/map.mjs';
import {
  angularDifference, bearingBetween, graphDistance, reverseBearing, withinSector
} from '../src/geometry.mjs';
import {
  analyseClues, clueMathExplanation, locationsAtObservation,
  quantizeBearing, reachableAfter
} from '../src/deduction.mjs';
import {
  beginGame, createGame, endHunterTurn, hunterMove, viewForCurrentScreen
} from '../src/engine.mjs';

test('fixed compass sectors contain truth but do not disclose exact direction at their midpoint', () => {
  for(const half of [0,15,25,30,35,45,55,75]) {
    for(let bearing=0;bearing<360;bearing+=0.75) {
      const middle=quantizeBearing(bearing,half);
      assert.ok(withinSector(bearing,middle,half),bearing+' outside '+middle+' ±'+half);
      assert.ok(middle>=0 && middle<360);
    }
  }
  assert.equal(quantizeBearing(0,15),0);
  assert.equal(quantizeBearing(14,15),0);
  assert.equal(quantizeBearing(17,15),30);
  assert.equal(quantizeBearing(350,15),0);
  assert.equal(quantizeBearing(352,0),352);
  assert.notEqual(quantizeBearing(37,15),37);
  assert.throws(()=>quantizeBearing(4,-1),RangeError);
});

test('reverse clue observation and north-crossing bearings select correct nodes', () => {
  const trueBearing=bearingBetween(MAP.nodes.A,MAP.nodes.B);
  const target=reverseBearing(trueBearing);
  const center=quantizeBearing(target,15);
  const clue={
    id:'reverse',place:'A',kind:'reverse',center,
    sectorCenter:reverseBearing(center),halfWidth:15,observedRound:0
  };
  assert.ok(locationsAtObservation(MAP,clue).includes('B'));
  const nearNorth={id:'north',place:'A',kind:'direct',
    center:0,sectorCenter:0,halfWidth:40,observedRound:0};
  assert.ok(locationsAtObservation(MAP,nearNorth).includes('B'));
});

test('reachableAfter moves along exactly k roads, never teleports or falsely allows standing still',()=>{
  const map={
    nodes:{A:{x:0,y:0},B:{x:100,y:0},C:{x:200,y:0},D:{x:100,y:100}},
    adjacency:{A:['B'],B:['A','C','D'],C:['B'],D:['B']}
  };
  assert.deepEqual([...reachableAfter(map,['A'],0)],['A']);
  assert.deepEqual([...reachableAfter(map,['A'],1)],['B']);
  assert.deepEqual([...reachableAfter(map,['A'],2)].sort(),['A','C','D']);
  assert.throws(()=>reachableAfter(map,['A'],-1),RangeError);
  assert.deepEqual([...reachableAfter(map,[],3)],[]);
});

test('time-indexed clue intersection advances each clue from its observation snapshot',()=>{
  const map={
    nodes:{A:{x:0,y:0},B:{x:100,y:0},C:{x:200,y:0},D:{x:100,y:100}},
    adjacency:{A:['B'],B:['A','C','D'],C:['B'],D:['B']}
  };
  const a={id:'past',place:'A',kind:'direct',center:90,sectorCenter:90,
    halfWidth:0,observedRound:0};
  const b={id:'recent',place:'C',kind:'direct',center:270,sectorCenter:270,
    halfWidth:0,observedRound:1};
  const after=analyseClues(map,[a,b],2);
  assert.deepEqual(after.candidates,['A','B']);
  assert.equal(after.stepsByClue[0].elapsed,1);
  assert.equal(after.stepsByClue[1].elapsed,0);
  const hunterFiltered=analyseClues(map,[a,b],2,{hunterLocation:'A'});
  assert.deepEqual(hunterFiltered.candidates,['B']);
  const none=analyseClues(map,[],2);
  assert.equal(none.constrained,false);
  assert.equal(none.candidates.length,4);
});

test('distance-band clues reduce candidates by route distance, not straight line distance',()=>{
  const map={
    nodes:{A:{x:0,y:0},B:{x:100,y:0},C:{x:200,y:0},D:{x:100,y:100}},
    adjacency:{A:['B'],B:['A','C','D'],C:['B'],D:['B']}
  };
  const clue={id:'distance',place:'A',center:90,sectorCenter:90,halfWidth:90,
    observedRound:0,distanceMin:2,distanceMax:2};
  assert.deepEqual(locationsAtObservation(map,clue),['C','D']);
  assert.equal(graphDistance('A','C',map),2);
  assert.equal(clueMathExplanation({observedRound:1,kind:'reverse'},4).includes('Reverse'),true);
});

test('all public solo sightings remain consistent with actual monster movement on four maps',()=>{
  for(const difficulty of Object.keys(MAPS)){
    for(let seed=1;seed<=15;seed++) {
      const g=createGame({mode:'solo',difficulty,seed,guided:true});
      beginGame(g);
      for(let step=0;step<Math.min(g.config.maxRounds-1,9);step++){
        const publicView=viewForCurrentScreen(g);
        assert.equal(Object.hasOwn(publicView,'monster'),false);
        const result=analyseClues(g.map,publicView.clues,publicView.round,{hunterLocation:publicView.hunter});
        assert.ok(result.candidates.includes(g.monster),
          difficulty+' seed '+seed+' round '+g.round+' eliminated the real Monster');
        endHunterTurn(g);
      }
    }
  }
});

test('real trace distance hints are truthful in Intro and Apprentice, unavailable in harder levels',()=>{
  for(const difficulty of Object.keys(MAPS)){
    const g=createGame({mode:'solo',difficulty,seed:12345,guided:true});
    beginGame(g);
    const initial=g.hunter;
    const next=g.map.adjacency[initial][0];
    if(next===g.monster) continue;
    // Inject a previous Monster visit at the neighbouring node to exercise a
    // trace without giving the Hunter access to the secret position in the UI.
    g.monsterTrail.push({id:'controlled-trace',node:next,round:0});
    const trueRoute=bearingBetween(g.map.nodes[initial],g.map.nodes[next]);
    const attempt=hunterMove(g,String(Math.round(trueRoute)).padStart(3,'0'));
    assert.equal(attempt.ok,true,attempt.message);
    const clue=g.clues[0];
    const actual=graphDistance(next,g.monster,g.map);
    assert.ok(withinSector(bearingBetween(g.map.nodes[next],g.map.nodes[g.monster]),
      clue.sectorCenter,clue.halfWidth));
    if(difficulty==='intro'||difficulty==='apprentice'){
      assert.ok(clue.distanceMin<=actual&&actual<=clue.distanceMax);
      assert.equal(clue.distanceMax-clue.distanceMin<=2,true);
    }else assert.equal(Object.hasOwn(clue,'distanceMin'),false);
    const publicView=viewForCurrentScreen(g);
    assert.equal(Object.hasOwn(publicView,'monster'),false);
    assert.ok(analyseClues(g.map,publicView.clues,publicView.round,
      {hunterLocation:publicView.hunter}).candidates.includes(g.monster));
  }
});

test('Hunter maths feedback counts successful routes and failed bearings without leaking secret state',()=>{
  const g=createGame({mode:'solo',difficulty:'intro',seed:37});
  beginGame(g);
  const initial=g.hunter;
  assert.equal(hunterMove(g,'999').ok,false);
  assert.equal(hunterMove(g,'abc').ok,false);
  const to=g.map.adjacency[initial][0];
  const angle=bearingBetween(g.map.nodes[initial],g.map.nodes[to]);
  assert.equal(hunterMove(g,String(Math.round(angle)).padStart(3,'0')).ok,true);
  const result=viewForCurrentScreen(g);
  assert.deepEqual(Object.keys(result.stats).sort(),
    ['attempts','errors','meanAngularError','sightings','successful','trailClues'].sort());
  assert.equal(result.stats.attempts,3);
  assert.equal(result.stats.errors,2);
  assert.equal(result.stats.successful,1);
  assert.ok(result.stats.meanAngularError<=0.5);
  assert.equal(Object.hasOwn(result,'monster'),false);
});
