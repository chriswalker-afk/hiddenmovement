import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, getMonsterSpawns, validateMap } from '../src/map.mjs';
import { bearingBetween, formatBearing, graphDistance, withinSector, reverseBearing, angularDifference } from '../src/geometry.mjs';
import { DIFFICULTIES, beginGame, createGame, endHunterTurn, hunterMove, viewForCurrentScreen, sealTurn, revealTurn } from '../src/engine.mjs';
import { chooseMonsterMove } from '../src/ai.mjs';

const DIFF_IDS = ['intro','apprentice','tracker','expert'];
const make = (id,seed=2026) => {
  const game = createGame({mode:'solo',difficulty:id,seed});
  assert.equal(beginGame(game).ok,true);
  return game;
};

test('four distinct validated maps with increasing node counts',()=>{
  assert.deepEqual(Object.keys(MAPS), DIFF_IDS);
  const counts = [14,18,26,36];
  DIFF_IDS.forEach((id,index)=>{
    const map=MAPS[id];
    assert.equal(Object.keys(map.nodes).length,counts[index]);
    assert.equal(validateMap(map).length,0,validateMap(map).join('\n'));
    assert.ok(getMonsterSpawns(map).length>=4);
    assert.ok(map.edges.length>=counts[index]);
    for(const [a,b] of map.edges){
      assert.ok(map.adjacency[a].includes(b));
      assert.ok(map.adjacency[b].includes(a));
      const forward=bearingBetween(map.nodes[a],map.nodes[b]);
      const backward=bearingBetween(map.nodes[b],map.nodes[a]);
      assert.ok(angularDifference(reverseBearing(forward),backward)<1e-7);
    }
  });
});

test('difficulty presets strictly increase map size and narrow clue availability',()=>{
  assert.deepEqual(DIFF_IDS.map(id=>DIFFICULTIES[id].nodes),[14,18,26,36]);
  assert.deepEqual(DIFF_IDS.map(id=>DIFFICULTIES[id].clueHalfWidth),[0,15,30,45]);
  assert.deepEqual(DIFF_IDS.map(id=>DIFFICULTIES[id].trailLifetime),[5,4,3,2]);
  assert.deepEqual(DIFF_IDS.map(id=>DIFFICULTIES[id].sightingInterval),[2,3,4,5]);
  assert.deepEqual(DIFF_IDS.map(id=>DIFFICULTIES[id].maxRounds),[13,15,18,21]);
});

test('solo game skips all monster/handoff views and starts with public sighting',()=>{
  for(const id of DIFF_IDS){
    const game=make(id);
    assert.equal(game.mode,'solo');
    assert.equal(game.phase,'hunter');
    assert.equal(game.difficulty,id);
    assert.equal(game.mapId,id);
    assert.ok(graphDistance(game.hunter,game.monster,game.map)>=3);
    assert.equal(game.stepsLeft,2);
    assert.equal(game.clues.length,1);
    assert.equal(game.clues[0].type,'sighting');
    const view=viewForCurrentScreen(game);
    assert.equal(view.mode,'solo');
    assert.equal(view.difficulty,id);
    assert.equal(view.mapId,id);
    assert.equal(view.hunter,game.map.hunterStart);
    for(const secret of ['monster','monsterTrail','trail','randomState','seed','history','config','aiMove'])
      assert.equal(Object.hasOwn(view,secret),false,id+' leaked '+secret);
    assert.ok(view.clues.every(c=>!Object.hasOwn(c,'targetMonsterNodeId')));
    sealTurn(game);
    assert.equal(game.phase,'hunter','solo must not seal into pass-and-play');
    assert.equal(revealTurn(game).ok,false,'solo must not allow reveal');
  }
});

test('identical seeds produce identical monster spawns and evasion sequences',()=>{
  for(const id of DIFF_IDS){
    const a=make(id,16483),b=make(id,16483);
    assert.equal(a.monster,b.monster);
    for(let round=0;round<4;round++){
      assert.equal(chooseMonsterMove(a),chooseMonsterMove(b));
      endHunterTurn(a); endHunterTurn(b);
      assert.equal(a.monster,b.monster);
      assert.equal(a.randomState,b.randomState);
    }
  }
});

test('AI never steps onto the Hunter and never chooses an illegal road',()=>{
  for(const id of DIFF_IDS){
    for(let seed=1;seed<=24;seed++){
      const g=make(id,seed*103);
      for(let step=0;step<g.config.maxRounds-1;step++){
        const origin=g.monster;
        const randomStateBeforeProbe=g.randomState;
        const selected=chooseMonsterMove(g);
        g.randomState=randomStateBeforeProbe; // Preview must not consume the actual AI random draw.
        assert.ok(g.map.adjacency[origin].includes(selected),id+' illegal move');
        assert.notEqual(selected,g.hunter,id+' walked onto Hunter');
        assert.equal(endHunterTurn(g).ok,true);
        assert.equal(g.monster,selected);
        assert.equal(g.round,step+2);
        assert.equal(g.phase,'hunter');
        assert.equal(g.stepsLeft,2);
        const view=viewForCurrentScreen(g);
        assert.equal(view.phase,'hunter');
        assert.equal(Object.hasOwn(view,'monster'),false);
      }
      endHunterTurn(g);
      assert.equal(g.phase,'over');
      assert.equal(g.winner,'monster');
    }
  }
});

test('timed public sightings point to the recorded monster position, not the future',()=>{
  const g=make('intro',81);
  const initial=g.clues[0];
  assert.equal(initial.observedRound,0);
  assert.equal(initial.foundRound,1);
  assert.equal(initial.place,g.hunter);
  assert.ok(withinSector(bearingBetween(g.map.nodes[g.hunter],g.map.nodes[g.monster]),initial.center,initial.halfWidth));
  endHunterTurn(g); // round 2, no scheduled pulse
  assert.equal(g.round,2);
  assert.equal(g.clues.length,1);
  endHunterTurn(g); // round 3, observed at end round 2
  assert.equal(g.round,3);
  assert.equal(g.clues.length,2);
  const latest=g.clues[0];
  assert.equal(latest.type,'sighting');
  assert.equal(latest.observedRound,2);
  assert.ok(withinSector(bearingBetween(g.map.nodes[latest.place],g.map.nodes[g.monster]),latest.center,latest.halfWidth));
});

test('trail clue precision and aging use each difficulty, not global settings',()=>{
  for(const id of DIFF_IDS) {
    const g=make(id,106);
    const target=g.map.adjacency[g.hunter][0];
    if(g.monster===target) continue;
    g.monsterTrail.push({id:'test-visit',node:target,round:0});
    const dir=bearingBetween(g.map.nodes[g.hunter],g.map.nodes[target]);
    const result=hunterMove(g,formatBearing(dir));
    assert.equal(result.ok,true,id+': '+result.message);
    const clue=viewForCurrentScreen(g).clues[0];
    assert.equal(clue.type,'trace');
    assert.equal(clue.halfWidth,DIFFICULTIES[id].clueHalfWidth);
    const observed=bearingBetween(g.map.nodes[target],g.map.nodes[g.monster]);
    assert.ok(withinSector(observed,clue.sectorCenter,clue.halfWidth));
    if(id==='tracker'||id==='expert'){
      assert.equal(Object.hasOwn(clue,'visitRound'),false);
      assert.ok(clue.ageLabel);
    }else assert.equal(clue.visitRound,0);
  }
});

test('solo Hunter can capture and win; full-game reveal only occurs after victory',()=>{
  const g=make('intro',99);
  const start=g.monster;
  const route=[g.hunter];
  const parents=new Map([[g.hunter,null]]);
  const queue=[g.hunter];
  while(queue.length && !parents.has(start)){
    const at=queue.shift();
    for(const next of g.map.adjacency[at]) if(!parents.has(next)){
      parents.set(next,at); queue.push(next);
    }
  }
  let at=start;
  while(at!==g.hunter){route.push(at);at=parents.get(at);}
  // Directly set a reachable Hunter position one route from the Monster,
  // representing a later point in the game; capture should still work.
  const neighbour=g.map.adjacency[start][0];
  g.hunter=neighbour; g.stepsLeft=2;
  const bearing=formatBearing(bearingBetween(g.map.nodes[neighbour],g.map.nodes[start]));
  assert.equal(hunterMove(g,bearing).ok,true);
  assert.equal(g.winner,'hunter');
  assert.equal(g.phase,'over');
  const view=viewForCurrentScreen(g);
  assert.equal(view.monster,start);
  assert.ok(view.trail);
  assert.ok(view.winner);
});

test('new maps have no crossing connections between unrelated edges',()=>{
  const crosses=(p1,p2,p3,p4)=>{
    const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
    const ab1=cross(p1,p2,p3),ab2=cross(p1,p2,p4),
          cd1=cross(p3,p4,p1),cd2=cross(p3,p4,p2);
    return ab1*ab2<0 && cd1*cd2<0;
  };
  for(const id of DIFF_IDS){
    const map=MAPS[id];
    for(let i=0;i<map.edges.length;i++)
      for(let j=i+1;j<map.edges.length;j++){
        const [a,b]=map.edges[i], [c,d]=map.edges[j];
        if(new Set([a,b,c,d]).size!==4) continue;
        assert.equal(crosses(map.nodes[a],map.nodes[b],map.nodes[c],map.nodes[d]),false,
          id+' crossed edges '+a+'-'+b+' and '+c+'-'+d);
      }
  }
});
