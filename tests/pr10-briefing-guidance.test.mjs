import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MAPS } from '../src/map.mjs';
import { bearingBetween, formatBearing } from '../src/geometry.mjs';
import { createGame, beginGame, viewForCurrentScreen } from '../src/engine.mjs';
import { GUIDE_STEPS, hunterBriefing, guidedCoach } from '../src/hunter-guide.mjs';

test('each opening briefing uses its ACTUAL difficulty-specific round limit',()=>{
  const limits={intro:13,apprentice:15,tracker:18,expert:21};
  const powers={
    intro:/NO SPECIAL POWER/,
    apprentice:/TELEPORT 2–3 roads/,
    tracker:/FALSE SIGHTINGS/,
    expert:/TELEPORT several roads and create FALSE SIGHTINGS/
  };
  for(const [difficulty,limit] of Object.entries(limits)){
    const game=createGame({mode:'solo',difficulty,seed:818});
    assert.equal(beginGame(game).ok,true);
    const view=viewForCurrentScreen(game);
    const briefing=hunterBriefing(view);
    assert.equal(view.maxRounds,limit);
    assert.equal(briefing.roundLimit,limit);
    assert.match(briefing.heading,/You are a Monster Hunter/);
    assert.match(briefing.deadline,new RegExp('within '+limit+' rounds to win'));
    assert.match(briefing.goal,new RegExp('find '+briefing.monsterName));
    assert.match(briefing.evidence,/visit a place where .* has recently been/i);
    assert.match(briefing.warning,powers[difficulty]);
    assert.match(briefing.warning,/moves secretly after each of your turns/);
    assert.match(briefing.monsterArt,/assets\/monsters\/.+\.svg$/);
    assert.equal(Object.hasOwn(briefing,'monster'),false);
  }
});

test('special missions have accurate optional briefing warnings',()=>{
  for(const scenario of ['classic','escape','beacons']){
    const game=createGame({mode:'solo',difficulty:'intro',scenario,seed:29});
    beginGame(game);
    const briefing=hunterBriefing(viewForCurrentScreen(game));
    if(scenario==='classic')assert.equal(briefing.missionWarning,'');
    if(scenario==='escape')assert.match(briefing.missionWarning,/escape early/);
    if(scenario==='beacons')assert.match(briefing.missionWarning,/both signal beacons/);
  }
});

test('seven guide steps explicitly teach the hunt before mathematical bearings practice',()=>{
  assert.equal(GUIDE_STEPS.length,7);
  assert.equal(new Set(GUIDE_STEPS.map(x=>x.id)).size,7);
  const combined=GUIDE_STEPS.map(x=>x.detail+' '+x.example).join(' ');
  for(const idea of ['Hunter','clockwise from north','protractor','RECENTLY',
    'bearing of A from B','reverse bearing','round','secretly','teleport',
    'UNCONFIRMED','End your turn']){
    assert.ok(combined.toLowerCase().includes(idea.toLowerCase()),
      'Guide is missing explicit instruction about '+idea);
  }
  assert.ok(GUIDE_STEPS.every(x=>x.title && x.heading && x.visual &&
    x.detail.length>=100 && x.example.length>=65));
});

test('Coach is opt-in and uses the public map; road example is mathematically correct',()=>{
  const standard=createGame({mode:'solo',difficulty:'apprentice',seed:78});
  beginGame(standard);
  const publicStandard=viewForCurrentScreen(standard);
  assert.equal(guidedCoach(publicStandard,standard.map),null);
  const game=createGame({mode:'solo',difficulty:'apprentice',seed:78,guided:true});
  beginGame(game);
  const view=viewForCurrentScreen(game);
  const coach=guidedCoach(view,game.map);
  assert.equal(coach.stage,'first');
  assert.equal(coach.remaining,15);
  assert.match(coach.instruction,/watcher report/);
  const route=game.map.adjacency[game.hunter][0];
  assert.equal(coach.example.to,game.map.nodes[route].name);
  assert.equal(coach.example.bearing,formatBearing(
    bearingBetween(game.map.nodes[game.hunter],game.map.nodes[route])));
  assert.equal(JSON.stringify(coach).includes('"monster":'),false);
  assert.equal(JSON.stringify(coach).includes('"monsterTrail":'),false);
});

test('Coach responds appropriately to errors, found clues, empty searches, rumours, teleports and turns left',()=>{
  const game=createGame({mode:'solo',difficulty:'expert',seed:599,guided:true});
  beginGame(game);
  const base=viewForCurrentScreen(game),map=MAPS.expert;
  const coaching=overrides=>guidedCoach({...base,...overrides},map);
  assert.equal(coaching({stepsLeft:0}).stage,'end-turn');
  assert.match(coaching({stepsLeft:0}).instruction,/END TURN/);
  assert.equal(coaching({feedback:'That bearing does not follow a connected road.'}).stage,'retry');
  assert.equal(coaching({hunterOutcome:{kind:'trace'}}).stage,'trace');
  assert.equal(coaching({hunterOutcome:{kind:'empty'}}).stage,'empty');
  assert.equal(coaching({hunterOutcome:{kind:'decoy'}}).stage,'decoy');
  const fake=map.adjacency[base.hunter][0];
  const c=coaching({clues:[{type:'rumour',pointNode:fake,status:'unverified'}],round:4});
  assert.equal(c.stage,'rumour');
  assert.match(c.instruction,/UNCONFIRMED/);
  const t=coaching({round:6,publicEvents:[{type:'teleport',round:5,from:fake}]});
  assert.equal(t.stage,'teleport');
  assert.match(t.instruction,/2–3 connected roads/);
  const last=coaching({round:20});
  assert.equal(last.stage,'final');
  assert.equal(last.remaining,2);
});

test('the original Hunter artwork is bundled and the release builder copies characters',()=>{
  const image=readFileSync(new URL('../assets/characters/monster-hunter.svg',import.meta.url),'utf8');
  assert.match(image,/<svg[^>]*viewBox="0 0 520 600"/);
  assert.match(image,/<title id="title">The Monster Hunter<\/title>/);
  assert.match(image,/compass/);
  assert.ok(image.length>3500);
  const builder=readFileSync(new URL('../scripts/package-site.mjs',import.meta.url),'utf8');
  assert.match(builder,/join\(root,'assets','characters'\)/);
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  assert.match(css,/\.hunter-briefing\{/);
  assert.match(css,/\.tutorial-screen-guide\{/);
  assert.match(css,/\.coach-panel/);
});
