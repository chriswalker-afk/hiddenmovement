import { graphDistance } from './geometry.mjs';
import { randomUnit } from './ai.mjs';
import { monsterFor } from './monsters.mjs';

/** A teleport skips exactly 2–3 roads by SHORTEST route, not infinite travel. */
export function teleportTargets(game) {
  const ability=monsterFor(game.difficulty).teleport;
  if(!ability || game.mode!=='solo' || !game.monster)return [];
  return Object.keys(game.map.nodes).filter(id=>
    id!==game.hunter && id!==game.monster &&
    graphDistance(game.monster,id,game.map)>=ability.minHops &&
    graphDistance(game.monster,id,game.map)<=ability.maxHops
  );
}

/**
 * Evasive but predictable AI priorities: flee the Hunter and avoid doubling
 * back. In a mission the destination can also advance the public objective.
 */
export function chooseTeleportDestination(game) {
  const choices=teleportTargets(game);
  if(!choices.length)return null;
  const goal=game.scenario==='escape'?game.objectives.exitNode:
    game.scenario==='beacons'?game.objectives.beacons.find(id=>!game.beaconVisits.includes(id)):null;
  const recent=new Set(game.monsterTrail.slice(-3).map(t=>t.node));
  const sorted=choices.map(id=>{
    const hunterDist=graphDistance(id,game.hunter,game.map);
    const objective=(goal?graphDistance(game.monster,goal,game.map)-
      graphDistance(id,goal,game.map):0);
    const score=hunterDist*2+(recent.has(id)?-3:0)+objective*(goal?2:0)+
      (game.map.adjacency[id]?.length||0)*0.15;
    return {id,score};
  }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  // Seeded tie-breaking is deterministic across save/resume and simulations.
  return sorted[Math.floor(randomUnit(game)*Math.min(3,sorted.length))].id;
}

export function shouldTeleport(game) {
  const rule=monsterFor(game.difficulty).teleport;
  const ready=game.monsterCooldowns?.teleportReadyRound;
  if(game.mode!=='solo'||!rule||!Number.isInteger(ready)||game.round<ready)return false;
  if(!teleportTargets(game).length)return false;
  return graphDistance(game.hunter,game.monster,game.map)<=3 || game.round>=ready+1;
}

/** Decoys lure the Hunter toward a plausible but FALSE public position. */
export function decoyTargets(game) {
  const ability=monsterFor(game.difficulty).decoy;
  if(game.mode!=='solo'||!ability)return [];
  const existing=new Set(game.activeDecoys.filter(d=>!d.revealed).map(d=>d.node));
  return Object.keys(game.map.nodes).filter(id=>
    id!==game.hunter && id!==game.monster && !existing.has(id) &&
    graphDistance(game.hunter,id,game.map)>=1 &&
    graphDistance(game.hunter,id,game.map)<=3 &&
    graphDistance(game.monster,id,game.map)>=2
  );
}

export function chooseDecoyDestination(game) {
  const candidates=decoyTargets(game);
  if(!candidates.length)return null;
  const seen=new Set(game.hunterTrail.slice(-3));
  // A decoy should be reachable enough to be investigated, not a random
  // point on the far side of the map that no learner would ever pursue.
  const scored=candidates.map(id=>({
    id,
    score:8-2*graphDistance(game.hunter,id,game.map) +
      Math.min(5,graphDistance(game.monster,id,game.map)) -
      (seen.has(id)?2:0)
  })).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  return scored[Math.floor(randomUnit(game)*Math.min(3,scored.length))].id;
}

export function shouldPlantDecoy(game) {
  const rule=monsterFor(game.difficulty).decoy;
  const ready=game.monsterCooldowns?.decoyReadyRound;
  return game.mode==='solo'&&!!rule&&Number.isInteger(ready)&&
    game.round>=ready&&decoyTargets(game).length>0;
}
