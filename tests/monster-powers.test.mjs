import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MONSTERS, monsterFor, initialMonsterCooldowns } from '../src/monsters.mjs';
import { MAPS } from '../src/map.mjs';
import { graphDistance, bearingBetween, formatBearing } from '../src/geometry.mjs';
import { beginGame,createGame,endHunterTurn,hunterMove,viewForCurrentScreen } from '../src/engine.mjs';
import { analyseClues,locationsAtObservation,reachableWithPublicEvents } from '../src/deduction.mjs';
import { serializeGame,restoreGame } from '../src/persistence.mjs';

const start=(difficulty,seed=125)=>{const g=createGame({mode:'solo',difficulty,seed});assert.equal(beginGame(g).ok,true);return g;};
const angle=(game,a,b)=>formatBearing(bearingBetween(game.map.nodes[a],game.map.nodes[b]));

test('four original monsters have distinguishable identities, abilities and bundled SVG artwork',()=>{
  assert.deepEqual(Object.keys(MONSTERS),['intro','apprentice','tracker','expert']);
  assert.equal(MONSTERS.intro.teleport,null);
  assert.equal(MONSTERS.intro.decoy,null);
  assert.ok(MONSTERS.apprentice.teleport && !MONSTERS.apprentice.decoy);
  assert.ok(!MONSTERS.tracker.teleport && MONSTERS.tracker.decoy);
  assert.ok(MONSTERS.expert.teleport && MONSTERS.expert.decoy);
  assert.equal(new Set(Object.values(MONSTERS).map(m=>m.name)).size,4);
  assert.equal(new Set(Object.values(MONSTERS).map(m=>m.art)).size,4);
  for(const [difficulty,monster] of Object.entries(MONSTERS)){
    const xml=readFileSync(new URL('../'+monster.art.replace('./',''),import.meta.url),'utf8');
    assert.match(xml,/<svg[^>]+viewBox="0 0 480 520"/);
    assert.match(xml,/<title id="title">/);
    assert.match(xml,/role="img"/);
    assert.ok(xml.length>2500,difficulty+' portrait must be a detailed original asset');
    assert.ok(monster.powerText.length>25);
    assert.equal(monsterFor(difficulty),monster);
  }
  assert.deepEqual(initialMonsterCooldowns('intro'),{teleportReadyRound:null,decoyReadyRound:null});
});

test('intro monster has no powers even through a complete AI hunt',()=>{
  const g=start('intro',612);
  while(g.phase==='hunter')endHunterTurn(g);
  assert.equal(g.publicEvents.some(e=>['teleport','rumour'].includes(e.type)),false);
  assert.equal(g.activeDecoys.length,0);
  assert.ok(g.history.filter(h=>h.role==='monster').every(h=>h.movement!=='teleport'));
});

test('apprentice teleport reveals its old position, never its landing, with lawful hops and cooldown',()=>{
  let total=0;
  for(let seed=1;seed<=16;seed++){
    const g=start('apprentice',seed*29);
    const teleportRounds=[];
    let turns=0;
    while(g.phase==='hunter' && turns++<g.config.maxRounds-1){
      const from=g.monster;
      const completed=g.round;
      endHunterTurn(g);
      if(g.phase==='over')break;
      const latest=g.publicEvents.find(e=>e.type==='teleport'&&e.round===completed);
      if(!latest)continue;
      total++;
      teleportRounds.push(completed);
      assert.equal(latest.from,from,'The published location must be the true previous position');
      assert.ok(graphDistance(from,g.monster,g.map)>=2);
      assert.ok(graphDistance(from,g.monster,g.map)<=3);
      assert.equal(g.monsterCooldowns.teleportReadyRound,completed+4);
      const report=g.clues.find(c=>c.type==='teleport-origin'&&c.observedRound===completed-1);
      assert.ok(report,'The teleport must leave a truthful historical origin clue');
      assert.equal(report.pointNode,from);
      assert.deepEqual(locationsAtObservation(g.map,report),[from]);
      const view=viewForCurrentScreen(g);
      assert.equal(Object.hasOwn(view,'monster'),false);
      assert.equal(Object.hasOwn(view,'monsterTrail'),false);
      assert.equal(JSON.stringify(view).includes('"from":"'+from+'"'),true);
      assert.equal(JSON.stringify(view).includes('"node":"'+g.monster+'"'),false,
        'Public teleport events should not reveal landing nodes');
      assert.ok(analyseClues(g.map,view.clues,view.round,
        {hunterLocation:view.hunter,publicEvents:view.publicEvents}).candidates.includes(g.monster),
        'Teleport-aware deduction must not eliminate the actual Monster');
    }
    for(let i=1;i<teleportRounds.length;i++)
      assert.ok(teleportRounds[i]-teleportRounds[i-1]>=4,'Cooldown was bypassed');
  }
  assert.ok(total>=12,'Most Apprentice runs should demonstrate their signature power');
});

test('tracker false sightings are unconfirmed until the hunter reaches the location',()=>{
  const g=start('tracker',433);
  for(let i=0;i<8 && g.activeDecoys.length===0;i++)endHunterTurn(g);
  assert.ok(g.activeDecoys.length>0,'Tracker should plant a decoy');
  const fake=g.activeDecoys[0];
  const rumour=g.clues.find(c=>c.id===fake.id);
  assert.equal(rumour.type,'rumour');
  assert.equal(rumour.status,'unverified');
  assert.notEqual(fake.node,g.monster);
  const view=viewForCurrentScreen(g);
  assert.equal(Object.hasOwn(view,'activeDecoys'),false);
  assert.match(JSON.stringify(view),/unverified/);
  assert.equal(locationsAtObservation(g.map,rumour).length,0);
  const candidates=analyseClues(g.map,view.clues,view.round,{
    hunterLocation:view.hunter,publicEvents:view.publicEvents
  });
  assert.ok(candidates.candidates.includes(g.monster));
  const before=Object.keys(g.map.nodes).length;
  assert.equal(analyseClues(g.map,[rumour],g.round).candidates.length,before,
    'Unverified rumour must not mathematically constrain candidates');
  const adjacent=g.map.adjacency[fake.node][0];
  g.hunter=adjacent;g.stepsLeft=2;g.phase='hunter';
  const result=hunterMove(g,angle(g,adjacent,fake.node));
  assert.equal(result.ok,true);
  assert.equal(g.hunterOutcome.kind,'decoy');
  assert.match(g.hunterOutcome.text,/decoy planted/i);
  assert.equal(fake.revealed,true);
  assert.equal(rumour.status,'false');
  assert.ok(g.publicEvents.some(e=>e.type==='decoy-exposed'&&e.node===fake.node));
  assert.equal(g.activeDecoys.filter(d=>d.revealed).length,1);
});

test('expert deploys both signature powers without leaking the current Monster location',()=>{
  const g=start('expert',815);
  let rounds=0;
  while(g.phase==='hunter'&&rounds++<g.config.maxRounds-1)endHunterTurn(g);
  assert.ok(g.publicEvents.some(e=>e.type==='teleport'),'Expert should eventually leap');
  assert.ok(g.publicEvents.some(e=>e.type==='rumour'),'Expert should eventually plant a false report');
  assert.ok(g.activeDecoys.length>0);
  for(const e of g.publicEvents.filter(e=>e.type==='teleport')){
    assert.ok(g.map.nodes[e.from]);
    assert.equal(e.minHops,2);
    assert.equal(e.maxHops,3);
  }
  assert.ok(g.clues.filter(c=>c.type==='rumour').every(c=>c.status==='unverified'));
});

test('every legal Hunter move creates a named search result, including discovery and capture',()=>{
  const clear=start('intro',191);
  const neighbour=clear.map.adjacency[clear.hunter][0];
  assert.notEqual(neighbour,clear.monster);
  assert.equal(hunterMove(clear,angle(clear,clear.hunter,neighbour)).ok,true);
  assert.equal(clear.hunterOutcome.kind,'empty');
  assert.match(clear.hunterOutcome.text,/You search .*no evidence of The Lantern Wisp/i);
  assert.equal(viewForCurrentScreen(clear).hunterOutcome.text,clear.hunterOutcome.text);

  const trace=start('intro',192);
  const marked=trace.map.adjacency[trace.hunter][0];
  trace.monsterTrail.push({id:'seeded-track',node:marked,round:0});
  assert.equal(hunterMove(trace,angle(trace,trace.hunter,marked)).ok,true);
  assert.equal(trace.hunterOutcome.kind,'trace');
  assert.match(trace.hunterOutcome.text,/You ask the locals/);
  assert.match(trace.hunterOutcome.text,/bearing of/);
  assert.match(trace.hunterOutcome.text,/The Lantern Wisp/);
  assert.equal(trace.hunterOutcome.clueId,'seeded-track');

  const caught=start('intro',193);
  const target=caught.map.adjacency[caught.hunter][0];
  caught.monster=target;
  assert.equal(hunterMove(caught,angle(caught,caught.hunter,target)).ok,true);
  assert.equal(caught.phase,'over');
  assert.equal(caught.winner,'hunter');
  assert.equal(caught.hunterOutcome.kind,'capture');
  assert.match(caught.hunterOutcome.text,/corner The Lantern Wisp/);
});

test('power usage, unresolved decoys and report acknowledgement survive a validated local save',()=>{
  const g=start('tracker',776);
  for(let i=0;i<8 && g.activeDecoys.length===0;i++)endHunterTurn(g);
  assert.ok(g.activeDecoys.length>=1);
  const restored=restoreGame(serializeGame(g,{introSeen:true,reportSeen:false}));
  assert.ok(restored);
  assert.deepEqual(restored.game.activeDecoys,g.activeDecoys);
  assert.deepEqual(restored.game.monsterCooldowns,g.monsterCooldowns);
  assert.equal(restored.ui.introSeen,true);
  assert.equal(restored.ui.reportSeen,false);
  const raw=JSON.parse(serializeGame(g));
  raw.activeDecoys[0].node='outside-map';
  assert.equal(restoreGame(JSON.stringify(raw)),null);
  const corrupt=JSON.parse(serializeGame(g));
  corrupt.monsterCooldowns.decoyReadyRound=-5;
  assert.equal(restoreGame(JSON.stringify(corrupt)),null);
});

test('teleport-aware propagation is truthful and normal moves still use one road',()=>{
  const map=MAPS.apprentice;
  const from='A01';
  const destination=Object.keys(map.nodes).find(id=>graphDistance(from,id,map)===3);
  assert.ok(destination);
  const events=[{type:'teleport',round:3,from,minHops:2,maxHops:3}];
  const fromOne=new Set([from]);
  const possible=reachableWithPublicEvents(map,fromOne,2,4,events);
  assert.ok(possible.has(destination));
  assert.equal(possible.has(from),false);
  const ordinary=reachableWithPublicEvents(map,fromOne,2,4,[]);
  assert.deepEqual(ordinary,new Set(map.adjacency[from]));
});
