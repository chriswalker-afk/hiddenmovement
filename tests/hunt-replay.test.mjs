import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAPS} from '../src/map.mjs';
import {beginGame,createGame,endHunterTurn,hunterMove,monsterMove,
  revealTurn,selectMonsterStart,viewForCurrentScreen,useLantern} from '../src/engine.mjs';
import {buildHuntReplay,replayMapView,replayFrameCaption} from '../src/hunt-replay.mjs';

function passPlayCapture(){
  const g=createGame();
  assert.equal(beginGame(g).ok,true);
  assert.deepEqual(viewForCurrentScreen(g),{phase:'pass-monster-setup'});
  revealTurn(g);
  assert.equal(selectMonsterStart(g,'G').ok,true);
  revealTurn(g);
  assert.equal(hunterMove(g,'035').ok,true); // A -> B
  assert.equal(hunterMove(g,'055').ok,true); // B -> D
  assert.equal(endHunterTurn(g).ok,true);
  revealTurn(g);
  assert.equal(monsterMove(g,'227').ok,true); // G -> E
  revealTurn(g);
  assert.equal(hunterMove(g,'165').ok,true); // D -> E, captured
  assert.equal(g.phase,'over');
  return g;
}

test('only completed hunts expose their chronological hidden movement log',()=>{
  const solo=createGame({mode:'solo',difficulty:'intro',seed:912});
  assert.equal(beginGame(solo).ok,true);
  const hunter=viewForCurrentScreen(solo);
  assert.equal(hunter.phase,'hunter');
  assert.equal(Object.hasOwn(hunter,'replayHistory'),false);
  assert.equal(Object.hasOwn(hunter,'monster'),false);
  assert.deepEqual(buildHuntReplay(hunter,MAPS.intro),[]);
  assert.equal(replayMapView(hunter,{hunter:'A',monster:'K'}),null);

  const multi=createGame();
  beginGame(multi);
  assert.deepEqual(viewForCurrentScreen(multi),{phase:'pass-monster-setup'});
  revealTurn(multi);
  selectMonsterStart(multi,'K');
  assert.deepEqual(viewForCurrentScreen(multi),{phase:'pass-hunter'});
  revealTurn(multi);
  assert.equal(Object.hasOwn(viewForCurrentScreen(multi),'replayHistory'),false);
  endHunterTurn(multi);
  assert.deepEqual(viewForCurrentScreen(multi),{phase:'pass-monster'});
  revealTurn(multi);
  assert.equal(Object.hasOwn(viewForCurrentScreen(multi),'replayHistory'),false);
});

test('complete pass-and-play capture replays starting positions, every Hunter move, idle end-turn and Monster move',()=>{
  const g=passPlayCapture();
  const view=viewForCurrentScreen(g);
  const frames=buildHuntReplay({...view,monsterName:'The Lantern Wisp'},MAPS.intro);
  assert.equal(frames.length,g.history.length+1);
  assert.deepEqual(frames.map(f=>f.role),['start','hunter','hunter','hunter','monster','hunter']);
  assert.deepEqual(frames.map(f=>f.action),['start','move','move','end-turn','move','move']);
  assert.deepEqual(frames.map(f=>f.round),[0,1,1,1,1,2]);
  assert.deepEqual([frames[0].hunter,frames[0].monster],['A','G']);
  assert.deepEqual([frames[1].hunter,frames[1].monster],['B','G']);
  assert.deepEqual([frames[2].hunter,frames[2].monster],['D','G']);
  assert.deepEqual([frames[3].hunter,frames[3].monster],['D','G']);
  assert.deepEqual([frames[4].hunter,frames[4].monster],['D','E']);
  assert.deepEqual([frames[5].hunter,frames[5].monster],['E','E']);
  assert.deepEqual(frames[4].hunterPath,['A','B','D']);
  assert.deepEqual(frames[4].monsterPath,['G','E']);
  assert.deepEqual(frames[0].monsterSegments,[]);
  assert.deepEqual(frames[4].monsterSegments,[{from:'G',to:'E',movement:''}]);
  assert.match(frames[0].description,/unseen/);
  assert.match(frames[3].description,/remains at/);
  assert.match(frames[4].description,/secretly travels/);
  assert.equal(frames[5].description.includes('The Monster'),true);
  assert.equal(replayFrameCaption(frames[0],frames.length),'Move 0 of 5 · Starting positions');
  assert.equal(replayFrameCaption(frames.at(-1),frames.length),'Move 5 of 5 · Round 2');

  const projected=replayMapView(view,frames[4]);
  assert.equal(projected.phase,'over');
  assert.equal(projected.replay,true);
  assert.equal(projected.hunter,'D');
  assert.equal(projected.monster,'E');
  assert.equal(projected.trail.at(-1).node,'E');
  assert.deepEqual(projected.hunterTrail,['A','B','D']);
  assert.equal(Object.hasOwn(view,'replay'),false,'do not mutate actual ended view');
});

test('full solo game replay preserves every legal AI movement and end-turn, including final inactivity',()=>{
  const g=createGame({mode:'solo',difficulty:'intro',seed:837});
  beginGame(g);
  let turns=0;
  while(g.phase==='hunter' && turns<g.config.maxRounds+2){
    turns++;
    endHunterTurn(g);
  }
  assert.equal(g.phase,'over');
  const v=viewForCurrentScreen(g);
  const frames=buildHuntReplay(v,MAPS.intro);
  assert.equal(frames.length,g.history.length+1);
  assert.equal(frames[0].monster,g.monsterTrail[0].node);
  assert.equal(frames[0].hunter,MAPS.intro.hunterStart);
  assert.equal(frames.at(-1).monster,g.monster);
  assert.equal(frames.at(-1).hunter,g.hunter);
  assert.equal(frames.at(-1).round<=v.maxRounds,true);
  assert.ok(frames.some(f=>f.action==='end-turn'));
  const monsterFrames=frames.filter(f=>f.role==='monster');
  assert.equal(monsterFrames.length,g.monsterTrail.length-1);
  assert.deepEqual(monsterFrames.map(f=>f.monster),g.monsterTrail.slice(1).map(t=>t.node));
  assert.ok(frames.every((f,i)=>f.index===i));
});

test('teleports, Veil, Signal Lantern and beacon events are distinguished without inventing moves',()=>{
  const map=MAPS.intro;
  const nodes=Object.keys(map.nodes);
  const [startMonster,destination,other]=nodes.slice(1,4);
  const old={
    phase:'over',scenario:'beacons',monsterName:'Mire Stranger',
    trail:[{node:startMonster}],
    objectives:{beacons:[destination,other]},
    publicEvents:[{type:'rumour',round:1},{type:'beacon',round:2}],
    replayHistory:[
      {role:'hunter',round:1,node:map.hunterStart,action:'lantern'},
      {role:'hunter',round:1,node:map.hunterStart,action:'end-turn'},
      {role:'monster',round:1,node:destination,movement:'teleport'},
      {role:'monster',round:2,node:other,movement:'veil'}
    ]
  };
  const frames=buildHuntReplay(old,map);
  assert.equal(frames.length,5);
  assert.equal(frames[1].action,'lantern');
  assert.equal(frames[1].hunterPath.length,1,'lantern is not a movement');
  assert.equal(frames[2].action,'end-turn');
  assert.equal(frames[3].movement,'teleport');
  assert.match(frames[3].heading,/teleports/);
  assert.match(frames[3].description,/misleading local sighting/);
  assert.equal(frames[3].monsterSegments.at(-1).movement,'teleport');
  assert.equal(frames[4].movement,'veil');
  assert.match(frames[4].heading,/Veil/);
  assert.match(frames[4].description,/beacon was extinguished/);
  assert.deepEqual(frames[3].beaconVisits,[destination]);
  assert.deepEqual(frames[4].beaconVisits,[destination,other]);
  assert.deepEqual(frames[3].monsterPath,[startMonster,destination]);
  assert.deepEqual(frames[4].monsterSegments.map(s=>s.movement),['teleport','veil']);
  assert.deepEqual(replayMapView(old,frames[3]).beaconVisits,[destination]);
});

test('missing, corrupt or pre-replay game records are handled conservatively',()=>{
  assert.deepEqual(buildHuntReplay({},MAPS.intro),[]);
  assert.deepEqual(buildHuntReplay({phase:'over',trail:[],replayHistory:[]},MAPS.intro),[]);
  assert.deepEqual(buildHuntReplay({phase:'over',trail:[{node:'nope'}],replayHistory:[]},MAPS.intro),[]);
  const old={phase:'over',trail:[{node:'K'}],replayHistory:[],scenario:'classic'};
  const frames=buildHuntReplay(old,MAPS.intro);
  assert.equal(frames.length,1);
  assert.match(frames[0].description,/No movement was recorded/);
  assert.deepEqual(frames[0].monsterPath,['K']);
  assert.deepEqual(frames[0].hunterPath,[MAPS.intro.hunterStart]);
  assert.equal(replayFrameCaption(null,0),'No recorded moves');
});

test('source keeps replay optional, responsive, and outside live and sealed role views',()=>{
  const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  const engine=readFileSync(new URL('../src/engine.mjs',import.meta.url),'utf8');
  for(const id of ['replayScreenHtml','replay-play-pause','replay-prev','replay-next',
    'replay-progress','replay-speed','replay-skip','replay-watch-again','replay-restart',
    'replay-actor-hunter','replay-actor-monster'])
    assert.ok(app.includes(id),id+' must exist');
  assert.match(app,/if\(view\.phase==='over'\) \{\s*initialiseReplay\(view\)/);
  assert.match(app,/if\(view\.phase\.startsWith\('pass-'\)\)/);
  assert.match(app,/replayMapView\(view,frame\)/);
  assert.match(app,/function resetReplay\(/);
  assert.match(app,/const showReplay=replayState && !replayState\.skipped/);
  assert.match(css,/\.replay-mode\s*\{/);
  assert.match(css,/\.replay-layout\s*\{/);
  assert.match(css,/\.replay-teleport-line\s*\{/);
  assert.match(engine,/replayHistory:game\.history\.map/);
});
