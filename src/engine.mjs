import { MAPS } from './map.mjs';
import {
  angularDifference, bearingBetween, formatBearing, graphDistance, parseBearing,
  reverseBearing, sectorBounds
} from './geometry.mjs';
import { chooseMonsterMove, chooseMonsterSpawn, shouldAiUseVeil } from './ai.mjs';
import { SCENARIOS, computeObjectives, eligibleMonsterStarts } from './scenarios.mjs';
import { quantizeBearing } from './deduction.mjs';

export const SETTINGS = Object.freeze({
  maxRounds: 13,
  trailLifetime: 5,
  clueHalfWidth: 15,
  bearingTolerance: 6,
  hunterSteps: 2,
  sightingInterval: 0,
  sightingHalfWidth: 0,
  openingPulse: false,
  clueAgeStyle: 'exact',
  distanceBandHalfWidth: null
});

/** Initial balancing parameters, not final capture-rate targets. */
export const DIFFICULTIES = Object.freeze({
  intro: Object.freeze({
    id: 'intro', name: 'Intro', tagline: 'Find your bearings',
    mapId: 'intro', nodes: 14, maxRounds: 13,
    trailLifetime: 5, clueHalfWidth: 0, distanceBandHalfWidth: 0,
    sightingInterval: 2, sightingHalfWidth: 25, openingPulse: true,
    clueAgeStyle: 'exact',
    summary: 'Small map, exact trail clues, a wandering monster and frequent sightings.'
  }),
  apprentice: Object.freeze({
    id: 'apprentice', name: 'Apprentice', tagline: 'The woods grow darker',
    mapId: 'apprentice', nodes: 18, maxRounds: 15,
    trailLifetime: 4, clueHalfWidth: 15, distanceBandHalfWidth: 1,
    sightingInterval: 3, sightingHalfWidth: 35, openingPulse: true,
    clueAgeStyle: 'exact',
    summary: 'A larger woodland, ±15° trail clues and a wary opponent.'
  }),
  tracker: Object.freeze({
    id: 'tracker', name: 'Tracker', tagline: 'Follow the faintest trace',
    mapId: 'tracker', nodes: 26, maxRounds: 18,
    trailLifetime: 3, clueHalfWidth: 30, distanceBandHalfWidth: null,
    sightingInterval: 4, sightingHalfWidth: 55, openingPulse: true,
    clueAgeStyle: 'approximate',
    summary: 'Broad ±30° clues, fading tracks and a more elusive opponent.'
  }),
  expert: Object.freeze({
    id: 'expert', name: 'Expert', tagline: 'Face the eclipse',
    mapId: 'expert', nodes: 36, maxRounds: 21,
    trailLifetime: 2, clueHalfWidth: 45, distanceBandHalfWidth: null,
    sightingInterval: 5, sightingHalfWidth: 75, openingPulse: true,
    clueAgeStyle: 'vague',
    summary: 'An extensive network, ±45° clues, short-lived tracks and cunning AI.'
  })
});

/** The full game stores secret state; never render this directly. */
export function createGame(config = {}) {
  const mode = config.mode === 'solo' ? 'solo' : 'multi';
  const difficulty = mode === 'solo' && Object.hasOwn(DIFFICULTIES, config.difficulty)
    ? config.difficulty : 'intro';
  const preset = mode === 'solo' ? DIFFICULTIES[difficulty] : {};
  const scenario = Object.hasOwn(SCENARIOS, config.scenario) ? config.scenario : 'classic';
  const settings = { ...SETTINGS, ...preset, ...config };
  const mapId = mode === 'solo' ? preset.mapId : 'intro';
  const objectives = computeObjectives(MAPS[mapId], scenario);
  const seed = (Math.trunc(Number(config.seed ?? 18251)) >>> 0) || 1;
  return {
    phase: 'home',
    mode,
    difficulty,
    scenario,
    objectives,
    objectivePowers: SCENARIOS[scenario].powers,
    beaconVisits: [],
    publicEvents: [],
    veilCharges: SCENARIOS[scenario].powers ? 1 : 0,
    lanternCharges: SCENARIOS[scenario].powers ? 1 : 0,
    finishReason: null,
    mapId,
    map: MAPS[mapId],
    seed,
    randomState: seed,
    round: 1,
    config: settings,
    hunter: MAPS[mapId].hunterStart,
    monster: null,
    monsterTrail: [],
    hunterTrail: [MAPS[mapId].hunterStart],
    stepsLeft: settings.hunterSteps,
    collectedVisitIds: [],
    clues: [],
    nextTrailId: 1,
    winner: null,
    feedback: '',
    history: [],
    hunterStats: { attempts:0, successful:0, errors:0, totalAngleError:0 }
  };
}

function say(game, message) {
  game.feedback = message;
  return { ok: true, message };
}
function fail(game, message) {
  game.feedback = message;
  return { ok: false, message };
}
function requirePhase(game, phase) {
  if (game.phase !== phase) return fail(game, 'This action is not available now.');
  return null;
}

/** Begin either a local two-player game or an AI hunt with no Monster UI. */
export function beginGame(game) {
  if (game.phase !== 'home' && game.phase !== 'over')
    return fail(game, 'Finish this game before starting another.');
  Object.assign(game, createGame({ ...game.config, mode: game.mode, difficulty: game.difficulty, scenario: game.scenario, seed: game.seed }));
  if (game.mode === 'solo') {
    const spawn = chooseMonsterSpawn(game);
    game.monster = spawn;
    game.monsterTrail.push({ id: 'visit-0', node: spawn, round: 0 });
    game.phase = 'hunter';
    addSighting(game, true);
    return say(game, 'The monster is out there. Read the clues and plan your hunt.');
  }
  game.phase = 'pass-monster-setup';
  return say(game, 'Pass the device to the monster.');
}

export function revealTurn(game) {
  const next = {
    'pass-monster-setup': 'monster-setup',
    'pass-monster': 'monster',
    'pass-hunter': 'hunter'
  }[game.phase];
  if (!next || game.mode !== 'multi') return fail(game, 'The next turn is not ready yet.');
  game.phase = next;
  game.feedback = '';
  return { ok: true };
}

/** When the page is hidden, re-seal only pass-and-play private views. */
export function sealTurn(game) {
  if (game.mode !== 'multi') return;
  if (game.phase === 'hunter') game.phase = 'pass-hunter';
  else if (game.phase === 'monster') game.phase = 'pass-monster';
  else if (game.phase === 'monster-setup') game.phase = 'pass-monster-setup';
}

export function selectMonsterStart(game, nodeId) {
  if (requirePhase(game, 'monster-setup')) return { ok:false, message:game.feedback };
  const spawns = eligibleMonsterStarts(game.map,game.scenario,game.objectives);
  if (!spawns.includes(nodeId))
    return fail(game, 'Choose an eligible purple starting location away from the Hunter and mission objectives.');
  game.monster = nodeId;
  game.monsterTrail.push({ id: 'visit-0', node: nodeId, round: 0 });
  game.phase = 'pass-hunter';
  return say(game, 'Secret starting place chosen.');
}

/**
 * Hunter screens intentionally omit private monster location, trail, AI random
 * seed, decision history and future information. Handoff is *only* a phase.
 */
export function viewForCurrentScreen(game) {
  const base = {
    phase: game.phase, round: game.round, feedback: game.feedback,
    mapId: game.mapId, mode: game.mode, difficulty: game.difficulty,
    scenario: game.scenario,
    objectives: {exitNode:game.objectives.exitNode,beacons:[...game.objectives.beacons]},
    beaconVisits:[...game.beaconVisits],
    publicEvents:game.publicEvents.map(e=>({...e}))
  };
  if (game.phase === 'home') return { ...base, config: game.config };
  if (game.phase.startsWith('pass-')) return { phase: game.phase };
  if (game.phase === 'hunter') return {
    ...base, hunter: game.hunter, stepsLeft: game.stepsLeft,
    clues: game.clues.map(c => publicClue(game,c)),
    hunterTrail: [...game.hunterTrail],
    stats: publicStats(game),
    powers:{ lanternCharges:game.lanternCharges },
    maxRounds: game.config.maxRounds
  };
  if (game.phase === 'monster-setup') return {
    ...base, hunter: game.hunter, eligibleSpawns: eligibleMonsterStarts(game.map,game.scenario,game.objectives)
  };
  if (game.phase === 'monster') return {
    ...base, hunter: game.hunter, monster: game.monster,
    trail: game.monsterTrail.map(t => ({ ...t })),
    powers:{veilCharges:game.veilCharges},
    maxRounds: game.config.maxRounds
  };
  if (game.phase === 'over') return {
    ...base, winner: game.winner, hunter: game.hunter, monster: game.monster,
    hunterTrail: [...game.hunterTrail],
    trail: game.monsterTrail.map(t => ({ ...t })),
    clues: game.clues.map(c => publicClue(game,c)),
    stats: publicStats(game),
    finishReason:game.finishReason,
    maxRounds: game.config.maxRounds
  };
  return base;
}

function publicStats(game) {
  const s = game.hunterStats;
  return { attempts:s.attempts, successful:s.successful, errors:s.errors,
    meanAngularError:s.successful ? Math.round(s.totalAngleError/s.successful*10)/10 : null,
    trailClues:game.clues.filter(c=>c.type==='trace').length,
    sightings:game.clues.filter(c=>c.type==='sighting').length };
}

function publicClue(game, clue) {
  const copy = { ...clue };
  if (game.mode === 'solo' && clue.type === 'trace') {
    const style = game.config.clueAgeStyle;
    if (style === 'approximate') {
      copy.ageLabel = 'Trail left approximately round ' + Math.max(0,clue.visitRound) +
        ' (±1 round)';
      delete copy.visitRound;
    } else if (style === 'vague') {
      copy.ageLabel = 'A fading trace left within the last few rounds';
      delete copy.visitRound;
    }
  }
  return copy;
}

function matchedNeighbour(origin, text, game) {
  const typed = parseBearing(text);
  if (typed === null)
    return { error: 'Enter a three-figure bearing from 000° to 360° (e.g. 045°).' };
  const candidates = game.map.adjacency[origin]
    .map(to => {
      const bearing = bearingBetween(game.map.nodes[origin], game.map.nodes[to]);
      return { to, bearing, difference: angularDifference(bearing, typed) };
    })
    .filter(row => row.difference <= game.config.bearingTolerance)
    .sort((a,b) => a.difference - b.difference);
  if (!candidates.length) return {
    error: 'No connected route is within ±' + game.config.bearingTolerance +
      '° of ' + formatBearing(typed) + '. Check the compass and try again.'
  };
  if (candidates.length > 1)
    return { error: 'Ambiguous bearing: choose a more precise direction.' };
  return candidates[0];
}

/**
 * Triggered by visiting an uncollected recent Monster trail location.
 * Snapshot: Monster location after last completed Monster turn. This makes
 * every clue mathematically meaningful, even for a trace left long ago.
 */
function collectClue(game, location) {
  const fresh = game.monsterTrail
    .filter(t => t.node === location && !t.concealed && game.round - t.round <= game.config.trailLifetime
      && !game.collectedVisitIds.includes(t.id))
    .sort((a,b) => b.round - a.round);
  if (!fresh.length) return null;
  const trace = fresh[0];
  game.collectedVisitIds.push(trace.id);
  const from = game.map.nodes[location];
  const target = game.map.nodes[game.monster];
  const toward = bearingBetween(from, target);
  if (toward === null) return null; // Capture must already have been detected.
  const reverse = (game.mode === 'solo' ? game.clues.filter(c => c.type === 'trace').length : game.clues.length) % 2 === 1;
  const observedRound = game.round - 1;
  // Fixed compass sectors provide real uncertainty: the true bearing is
  // *somewhere inside*, not always at the sector midpoint.
  const trueDisplayed = reverse ? reverseBearing(toward) : toward;
  const displayed = quantizeBearing(trueDisplayed, game.config.clueHalfWidth);
  const sectorCenter = reverse ? reverseBearing(displayed) : displayed;
  const distanceHalf = game.mode === 'solo' ? game.config.distanceBandHalfWidth : null;
  const routeDistance = Number.isInteger(distanceHalf)
    ? graphDistance(location,game.monster,game.map) : null;
  const clue = {
    id: trace.id,
    type: 'trace',
    place: location,
    visitRound: trace.round,
    foundRound: game.round,
    observedRound,
    kind: reverse ? 'reverse' : 'direct',
    center: displayed,
    sectorCenter,
    halfWidth: game.config.clueHalfWidth,
    bounds: sectorBounds(displayed, game.config.clueHalfWidth),
    ...(routeDistance === null ? {} : {
      distanceMin: Math.max(0, routeDistance - distanceHalf),
      distanceMax: routeDistance + distanceHalf
    })
  };
  game.clues.unshift(clue);
  return clue;
}

/** Public directional report; never includes the private target location. */
function recordSighting(game,halfWidth,source='watcher') {
  const toward = bearingBetween(game.map.nodes[game.hunter],game.map.nodes[game.monster]);
  if(toward===null)return null;
  const center = quantizeBearing(toward,halfWidth);
  const clue={
    id:source+'-'+(game.round-1)+'-'+game.clues.length,
    type:'sighting',
    source,
    place:game.hunter,
    foundRound:game.round,
    observedRound:game.round-1,
    kind:'direct',
    center,sectorCenter:center,halfWidth,
    bounds:sectorBounds(center,halfWidth)
  };
  game.clues.unshift(clue);
  return clue;
}

/** Scheduled Solo Hunter sightings are time-stamped at the last Monster turn. */
function addSighting(game,opening=false) {
  if(game.mode!=='solo')return null;
  if(opening && !game.config.openingPulse)return null;
  if(!opening && (!game.config.sightingInterval ||
    (game.round-1)%game.config.sightingInterval!==0))return null;
  return recordSighting(game,game.config.sightingHalfWidth,'watcher');
}

/**
 * Hunter's one-use counter to the Monster's Veil. It trades a route movement
 * for a truthful but approximate public report from the current location.
 */
export function useLantern(game) {
  if(requirePhase(game,'hunter'))return {ok:false,message:game.feedback};
  if(!game.objectivePowers)return fail(game,'Signal Lantern is available in mission scenarios.');
  if(game.lanternCharges<=0)return fail(game,'Your Signal Lantern has already been used.');
  if(game.stepsLeft<=0)return fail(game,'The Signal Lantern costs one remaining move.');
  const halfWidth=game.difficulty==='expert'?45:game.difficulty==='tracker'?35:30;
  const clue=recordSighting(game,halfWidth,'lantern');
  if(!clue)return fail(game,'There is no useful bearing from this location.');
  game.lanternCharges--;
  game.stepsLeft--;
  game.publicEvents.push({type:'lantern',round:game.round});
  return say(game,'Your Signal Lantern found a fresh approximate bearing. One movement action was used.');
}

/** Shared, validated outcome for both human and AI Monster travel. */
function applyMonsterStep(game,destination,veil=false) {
  if(!game.map.adjacency[game.monster]?.includes(destination))
    throw new RangeError('Illegal Monster road');
  if(veil && (!game.objectivePowers||game.veilCharges<=0))
    throw new RangeError('The Monster has no Veil charge');
  const movedRound=game.round;
  game.monster=destination;
  game.monsterTrail.push({
    id:'visit-'+game.nextTrailId++, node:destination,round:movedRound,
    ...(veil?{concealed:true}:{})
  });
  game.history.push({role:'monster',round:movedRound,node:destination});
  if(veil) {
    game.veilCharges--;
    game.publicEvents.push({type:'veil',round:movedRound});
  }
  if(game.monster===game.hunter) {
    game.phase='over';
    game.winner='hunter';
    game.finishReason='capture';
    return {ended:true,message:'The Monster walked into the Hunter and was captured!'};
  }
  if(game.scenario==='beacons' && game.objectives.beacons.includes(destination)
      && !game.beaconVisits.includes(destination)) {
    game.beaconVisits.push(destination);
    game.publicEvents.push({type:'beacon',round:movedRound,node:destination});
    game.clues.unshift({
      id:'beacon-'+destination+'-'+movedRound,
      type:'beacon',pointNode:destination,place:destination,
      observedRound:movedRound,foundRound:movedRound+1,kind:'location'
    });
    if(game.beaconVisits.length>=game.objectives.beacons.length) {
      game.phase='over';
      game.winner='monster';
      game.finishReason='beacons';
      return {ended:true,message:'Both signal beacons have gone dark. The Monster wins!'};
    }
  }
  if(game.scenario==='escape' && destination===game.objectives.exitNode
      && movedRound>=SCENARIOS.escape.unlockRound) {
    game.phase='over';
    game.winner='monster';
    game.finishReason='escape';
    return {ended:true,message:'The Monster reached the open escape gate and vanished!'};
  }
  game.round++;
  game.stepsLeft=game.config.hunterSteps;
  return {ended:false,veiled:veil,
    beaconReached:game.publicEvents.some(e=>e.type==='beacon'&&e.round===movedRound)};
}

export function hunterMove(game, inputBearing) {
  if (requirePhase(game, 'hunter')) return { ok:false, message:game.feedback };
  if (!game.stepsLeft) return fail(game, 'You have used both routes. Finish your turn.');
  const route = matchedNeighbour(game.hunter, inputBearing, game);
  game.hunterStats.attempts++;
  if (route.error) {
    game.hunterStats.errors++;
    return fail(game, route.error);
  }
  game.hunterStats.successful++;
  game.hunterStats.totalAngleError += route.difference;
  game.hunter = route.to;
  game.hunterTrail.push(route.to);
  game.stepsLeft--;
  const destination = game.map.nodes[route.to].name;
  game.history.push({ role:'hunter', round:game.round, node:route.to });
  if (game.hunter === game.monster) {
    game.phase = 'over';
    game.winner = 'hunter';
    return say(game, 'The monster was found at ' + destination + '! The Hunter wins.');
  }
  const clue = collectClue(game, game.hunter);
  const message = 'Travelled ' + formatBearing(route.bearing) + ' to ' + destination
    + ' (error: ' + route.difference.toFixed(1) + '°; ' + game.stepsLeft + ' route'
    + (game.stepsLeft === 1 ? '' : 's') + ' left).'
    + (clue ? ' A fresh trace revealed a clue!' : '');
  return say(game, message);
}

/**
 * End a Hunter turn. In solo mode the AI moves immediately, internally, and
 * only the resulting new Hunter view is rendered. No Monster screen exists.
 */
export function endHunterTurn(game) {
  if (requirePhase(game, 'hunter')) return { ok:false, message:game.feedback };
  if (game.round >= game.config.maxRounds) {
    game.phase = 'over';
    game.winner = 'monster';
    return say(game, 'The final lantern has gone out. The Monster survived!');
  }
  if (game.mode === 'solo') {
    const destination=chooseMonsterMove(game);
    const veil=shouldAiUseVeil(game,destination);
    const outcome=applyMonsterStep(game,destination,veil);
    if(outcome.ended)return say(game,outcome.message);
    const pulse=addSighting(game);
    const notice=outcome.beaconReached?'A signal beacon went dark. Its location was recorded in the notebook. ':
      outcome.veiled?'A Veil was used. The newest trail may be concealed. ':'';
    return say(game,notice+(pulse
      ? 'A watcher reports a fresh bearing. Check your field notebook.'
      : 'The Monster moved unseen. Continue the hunt.'));
  }
  game.phase = 'pass-monster';
  return say(game, 'Pass the device to the monster.');
}

export function monsterMove(game,inputBearing,options={}) {
  if(requirePhase(game,'monster'))return {ok:false,message:game.feedback};
  const route=matchedNeighbour(game.monster,inputBearing,game);
  if(route.error)return fail(game,route.error);
  const veil=options.veil===true;
  if(veil && (!game.objectivePowers||game.veilCharges<1))
    return fail(game,'You have no Veil charges remaining.');
  const outcome=applyMonsterStep(game,route.to,veil);
  if(outcome.ended)return say(game,outcome.message);
  game.phase='pass-hunter';
  return say(game,'The Monster travelled in secret.');
}
