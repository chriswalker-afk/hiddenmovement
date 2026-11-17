import { graphDistance } from './geometry.mjs';

export const SCENARIOS = Object.freeze({
  classic: Object.freeze({
    id:'classic',name:'The Long Hunt',short:'Find the monster before the lanterns fade',
    tagline:'Pure pursuit', description:'The original game. Collect bearing clues, intercept the Monster, or survive until the last round.',
    unlockRound:null, powers:false, icon:'✦'
  }),
  escape: Object.freeze({
    id:'escape',name:'The Last Gate',short:'Block the publicly marked escape gate',
    tagline:'A race to the exit', description:'The Monster can escape through a publicly marked gate from round 5. The Hunter can intercept or guard the exit.',
    unlockRound:5,powers:true, icon:'⌑'
  }),
  beacons: Object.freeze({
    id:'beacons',name:'Lanternfall',short:'Protect the two glowing beacons',
    tagline:'Defend the signal fires', description:'The Monster wins by extinguishing two public beacons. Each touched beacon reveals a time-stamped position.',
    unlockRound:null,powers:true,icon:'✧'
  })
});

export function computeObjectives(map,scenario='classic') {
  if (!SCENARIOS[scenario]) throw new RangeError('Unknown scenario');
  if (scenario==='classic') return { exitNode:null, beacons:[] };
  const ids = Object.keys(map.nodes);
  const dist=(a,b)=>graphDistance(a,b,map);
  const start=map.hunterStart;
  const eligible=ids.filter(id=>dist(start,id)>=3);
  if (!eligible.length) throw new Error('Scenario map has no distant objectives');
  const ranked=[...eligible].sort((a,b)=>dist(start,b)-dist(start,a)||a.localeCompare(b));
  const exitNode=ranked[0];
  if (scenario==='escape') return {exitNode,beacons:[]};
  const first=ranked[0];
  const second=[...eligible].filter(id=>id!==first)
    .sort((a,b)=>dist(first,b)-dist(first,a)||
      dist(start,b)-dist(start,a)||a.localeCompare(b))[0];
  if(!second) throw new Error('Need two separate beacon objectives');
  return {exitNode:null,beacons:[first,second]};
}

/** Scenario starts avoid objective squares (and immediate escape near the gate). */
export function eligibleMonsterStarts(map, scenario='classic', objectives=computeObjectives(map,scenario)) {
  const ids=Object.keys(map.nodes);
  const primary=ids.filter(id=>graphDistance(map.hunterStart,id,map)>=3);
  if(scenario==='classic')return primary;
  if(scenario==='escape') {
    const choices=primary.filter(id=>id!==objectives.exitNode &&
      graphDistance(id,objectives.exitNode,map)>=3);
    return choices.length ? choices : primary.filter(id=>id!==objectives.exitNode);
  }
  return primary.filter(id=>!objectives.beacons.includes(id));
}

export function nextAiGoal(game) {
  if(game.scenario==='escape')return game.objectives.exitNode;
  if(game.scenario==='beacons') {
    const candidates=game.objectives.beacons.filter(id=>!game.beaconVisits.includes(id));
    return candidates.sort((a,b)=>
      graphDistance(game.monster,a,game.map)-graphDistance(game.monster,b,game.map))[0]||null;
  }
  return null;
}

export function scenarioInstruction(game) {
  if(game.scenario==='escape')
    return 'Escape gate: '+game.map.nodes[game.objectives.exitNode].name+
      '. The Monster can escape by entering it from round 5.';
  if(game.scenario==='beacons')
    return 'Defend two beacons: '+game.objectives.beacons.map(id=>game.map.nodes[id].name).join(' and ')+
      '. Both must remain lit.';
  return 'Find the Monster before the final round.';
}
