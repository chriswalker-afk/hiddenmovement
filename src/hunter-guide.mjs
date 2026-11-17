/**
 * Hunter-facing prose is derived from PUBLIC state only. Never inspect secret
 * Monster coordinates, uncollected tracks or private decoy targets.
 */
import { monsterFor } from './monsters.mjs';
import { hunterTurnTransition } from './turn-transition.mjs';
import { bearingBetween, formatBearing } from './geometry.mjs';

export const GUIDE_STEPS = Object.freeze([
  Object.freeze({
    id:'hunter',title:'You are the Monster Hunter',heading:'Your mission',
    detail:'The Monster is hiding somewhere on the map. You are the Hunter. Visit locations, collect evidence, and find the Monster before your rounds run out.',
    example:'You win by moving onto the Monster’s CURRENT location. The Monster wins if it survives until the hunt ends.',
    visual:'hunter'
  }),
  Object.freeze({
    id:'bearings',title:'Move using three-figure bearings',heading:'How to travel',
    detail:'You may travel along two connected roads per Hunter turn. Place the centre of the optional protractor on your current location. Measure CLOCKWISE from north towards a connected road.',
    example:'North = 000°, east = 090°, south = 180°, west = 270°. A northeast road might be 045°. Type 045, not 45, to move.',
    visual:'compass'
  }),
  Object.freeze({
    id:'trail',title:'Search for evidence',heading:'How to get clues',
    detail:'When you visit a location where the Monster has RECENTLY been, you can discover a trail clue. Your search report tells you if you found something; the Clues tab keeps all evidence.',
    example:'For example, “the bearing of the Monster from the Old Gate was 065° at the end of round 2” means measure at Old Gate, not at your current position.',
    visual:'trail'
  }),
  Object.freeze({
    id:'directions',title:'Read clue wording carefully',heading:'Where do you start?',
    detail:'“The bearing of A from B” always starts at B and points towards A. A reverse bearing is 180° away: add or subtract 180° to reverse a direction.',
    example:'If the bearing of the Hunter from the Monster is 240°, the bearing of the Monster from the Hunter is 060°. Clues can also give a RANGE, such as 030°–060°.',
    visual:'compass'
  }),
  Object.freeze({
    id:'time',title:'The Monster moves after your turn',heading:'Old clues are not live GPS',
    detail:'After your Hunter turn, the Monster moves secretly. A clue from an earlier round tells you where it WAS then — it may no longer be there. Read the date and think about connected roads.',
    example:'If a clue is from round 2 and it is now round 4, the Monster may have travelled. Announced teleports can cover more than one road.',
    visual:'timeline'
  }),
  Object.freeze({
    id:'powers',title:'Watch out for special powers',heading:'Do not trust every rumour',
    detail:'Some monsters can teleport 2–3 roads, revealing where they jumped FROM but not their destination. Others plant an UNCONFIRMED sighting at a false location.',
    example:'A rumour is not proof. Visit the reported location to expose a decoy; do not treat it like a certified bearing clue.',
    visual:'powers'
  }),
  Object.freeze({
    id:'steps',title:'Your turn-by-turn checklist',heading:'Ready for the hunt?',
    detail:'1. Read the latest clues. 2. Choose a connected road. 3. Measure and enter its three-figure bearing. 4. Search the destination. 5. Update your theory. 6. End your turn to let the Monster move.',
    example:'In Guided mode, the Coach tab tells you what to do next. Use the map protractor if needed. Clue bearings are never automatically drawn in Standard play.',
    visual:'checklist'
  })
]);

export function hunterBriefing(view) {
  const monster=monsterFor(view.difficulty);
  const rounds=view.maxRounds;
  if(!Number.isInteger(rounds)||rounds<1)throw new RangeError('Briefing requires the actual round limit');
  const special=monster.teleport && monster.decoy
    ? monster.name+' can TELEPORT several roads and create FALSE SIGHTINGS to deceive you.'
    :monster.teleport
      ? monster.name+' can TELEPORT 2–3 roads, revealing where it vanished from but not where it landed.'
      :monster.decoy
        ? monster.name+' can create FALSE SIGHTINGS. Investigate unconfirmed reports before trusting them.'
        : monster.name+' has NO SPECIAL POWER, but still moves secretly between locations.';
  const missionWarning=view.scenario==='escape'
    ?'Beware: the Monster may escape early through the open gate.'
    :view.scenario==='beacons'
      ?'Beware: the Monster can win early by extinguishing both signal beacons.'
      :'';
  return {
    heading:'You are a Monster Hunter',monsterName:monster.name,
    monsterTitle:monster.title,monsterHome:monster.home,monsterArt:monster.art,
    goal:'You are trying to find '+monster.name+' and must search for evidence.',
    evidence:'If you visit a place where '+monster.name+' has recently been, you can uncover a clue about its past position.',
    warning:'Be wary! '+special+' It moves secretly after each of your turns.',
    deadline:'Find '+monster.name+' within '+rounds+' rounds to win!',
    roundLimit:rounds,missionWarning,
    powerName:monster.powerTitle,powerDetails:monster.powerText
  };
}

/** Explicit contextual coaching, enabled only when the user selects Guided. */
export function guidedCoach(view,map) {
  if(view.phase!=='hunter'||!view.guided)return null;
  const hunter=map.nodes[view.hunter];
  const targetId=map.adjacency[view.hunter]?.[0];
  const target=targetId?map.nodes[targetId]:null;
  const example=target?{
    from:hunter.name,to:target.name,
    bearing:formatBearing(bearingBetween(hunter,target))
  }:null;
  const remaining=Math.max(0,view.maxRounds-view.round+1);
  const latestTeleport=(view.publicEvents||[]).filter(e=>e.type==='teleport')
    .sort((a,b)=>b.round-a.round)[0];
  const rumour=(view.clues||[]).find(c=>c.type==='rumour'&&c.status==='unverified');
  const outcome=view.hunterOutcome;
  let stage='plan',title='Plan your next move';
  let instruction='Read your clues. They describe where the Monster WAS, not necessarily where it is now. Choose a connected road, then measure its bearing clockwise from north.';
  if(view.stepsLeft===0){
    const handoff=hunterTurnTransition(view);
    stage='end-turn';
    title='Your Hunter has finished moving';
    instruction=handoff.hint+' Select '+handoff.button+
      ' to continue; the Monster has not moved until you confirm.';
  }else if(view.feedback && /does not follow|three-figure|Check the compass|not a valid/i.test(view.feedback)){
    stage='retry';title='Check your bearing and try again';
    instruction='That entry did not use a move. Start at your location, point north (000°), turn CLOCKWISE to a connected road and type all three digits. The manual protractor can help.';
  }else if(outcome?.kind==='decoy'){
    stage='decoy';title='You exposed a false sighting';
    instruction='The reported position was a decoy. It is now marked false. Unverified rumours cannot prove where the Monster is. Look for a reliable track or watcher bearing.';
  }else if(outcome?.kind==='trace'){
    stage='trace';title='Read the clue you just found';
    instruction='Open CLUES and note the location the bearing starts FROM, its three-figure angle or range and its OBSERVATION ROUND. The Monster may have moved since that time.';
  }else if(outcome?.kind==='empty'){
    stage='empty';title='No evidence here — keep searching';
    instruction='An empty search does not prove the Monster was never here. Try another connected road and compare the places that still fit your dated clues.';
  }else if(rumour){
    stage='rumour';title='A reported sighting needs checking';
    instruction='Someone claims to have seen the Monster at '+
      (map.nodes[rumour.pointNode]?.name||'a nearby place')+
      '. This is UNCONFIRMED: investigate it if useful, but do not treat it as mathematical proof.';
  }else if(latestTeleport && latestTeleport.round>=view.round-1){
    stage='teleport';title='A teleport changes the search';
    instruction='The Monster vanished from '+
      (map.nodes[latestTeleport.from]?.name||'a location')+' in round '+
      latestTeleport.round+
      '. That old location is confirmed, but it could land 2–3 connected roads away. Do not assume it moved only one road.';
  }else if(view.round===1){
    stage='first';title='Start with the first watcher clue';
    instruction='Open CLUES and read the opening watcher report. On the map, find the observation location, measure the bearing clockwise from north and choose one of your connected roads to investigate.';
  }else if(remaining<=3){
    stage='final';title='Only '+remaining+' round'+(remaining===1?'':'s')+' left';
    instruction='Focus on your most recent reliable evidence. Compare its observation time with the Monster’s hidden moves; choose a road that gives you the best chance of an interception.';
  }
  return {stage,title,instruction,example,remaining,
    action:view.stepsLeft===0?'end-turn':'move',stepsLeft:view.stepsLeft};
}
