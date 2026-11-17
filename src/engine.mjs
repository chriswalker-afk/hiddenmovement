import { MAP, MONSTER_SPAWNS } from './map.mjs';
import { angularDifference, bearingBetween, formatBearing, parseBearing, reverseBearing, sectorBounds } from './geometry.mjs';

export const SETTINGS = Object.freeze({
  maxRounds: 13,
  trailLifetime: 5,
  clueHalfWidth: 15,
  bearingTolerance: 6,
  hunterSteps: 2
});

export function createGame(config = {}) {
  return {
    phase: 'home',
    round: 1,
    config: { ...SETTINGS, ...config },
    hunter: MAP.hunterStart,
    monster: null,
    monsterTrail: [],
    hunterTrail: [MAP.hunterStart],
    stepsLeft: SETTINGS.hunterSteps,
    collectedVisitIds: [],
    clues: [],
    nextTrailId: 1,
    winner: null,
    feedback: '',
    history: [],
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

export function beginGame(game) {
  if (game.phase !== 'home' && game.phase !== 'over')
    return fail(game, 'Finish this game before starting another.');
  Object.assign(game, createGame(game.config));
  game.phase = 'pass-monster-setup';
  return say(game, 'Pass the device to the monster.');
}

export function revealTurn(game) {
  const next = {
    'pass-monster-setup': 'monster-setup',
    'pass-monster': 'monster',
    'pass-hunter': 'hunter'
  }[game.phase];
  if (!next) return fail(game, 'The next turn is not ready yet.');
  game.phase = next;
  game.feedback = '';
  return {ok:true};
}

/** Called on tab switch or window minimisation: never leave private information visible. */
export function sealTurn(game) {
  if (game.phase === 'hunter') game.phase = 'pass-hunter';
  else if (game.phase === 'monster') game.phase = 'pass-monster';
  else if (game.phase === 'monster-setup') game.phase = 'pass-monster-setup';
}

export function selectMonsterStart(game, nodeId) {
  if (requirePhase(game, 'monster-setup')) return { ok:false, message:game.feedback };
  if (!MONSTER_SPAWNS.includes(nodeId))
    return fail(game, 'Choose a purple starting location at least three routes from the Watchtower.');
  game.monster = nodeId;
  game.monsterTrail.push({ id: 'visit-0', node: nodeId, round: 0 });
  game.phase = 'pass-hunter';
  return say(game, 'Secret starting place chosen.');
}

/** Returns a *public/role-specific* data projection for render. */
export function viewForCurrentScreen(game) {
  const base = { phase: game.phase, round: game.round, feedback: game.feedback };
  if (game.phase === 'home') return { ...base, config: game.config };
  if (game.phase.startsWith('pass-')) {
    // Never expose current position, trail, map notes or clue data to a handoff screen.
    return { phase: game.phase };
  }
  if (game.phase === 'hunter') return {
    ...base, hunter: game.hunter, stepsLeft: game.stepsLeft,
    clues: game.clues.map(c => ({ ...c })),
    hunterTrail: [...game.hunterTrail], maxRounds: game.config.maxRounds
  };
  if (game.phase === 'monster-setup') return {
    ...base, hunter: game.hunter, eligibleSpawns: [...MONSTER_SPAWNS]
  };
  if (game.phase === 'monster') return {
    ...base, hunter: game.hunter, monster: game.monster,
    trail: game.monsterTrail.map(t => ({ ...t })),
    maxRounds: game.config.maxRounds
  };
  if (game.phase === 'over') return {
    ...base, winner: game.winner, hunter: game.hunter, monster: game.monster,
    hunterTrail: [...game.hunterTrail],
    trail: game.monsterTrail.map(t => ({ ...t })),
    clues: game.clues.map(c=>({...c})),
    maxRounds: game.config.maxRounds
  };
  return base;
}

function matchedNeighbour(origin, text, game) {
  const typed = parseBearing(text);
  if (typed === null)
    return { error: 'Enter a three-figure bearing from 000° to 360° (e.g. 045°).' };
  const candidates = MAP.adjacency[origin]
    .map(to => {
      const bearing = bearingBetween(MAP.nodes[origin], MAP.nodes[to]);
      return { to, bearing, difference: angularDifference(bearing, typed) };
    })
    .filter(row => row.difference <= game.config.bearingTolerance)
    .sort((a,b) => a.difference - b.difference);
  if (!candidates.length) return {
    error: 'No connected route is within ±' + game.config.bearingTolerance + '° of ' + formatBearing(typed) + '. Check the compass and try again.'
  };
  if (candidates.length > 1) return { error: 'Ambiguous bearing: choose a more precise direction.' };
  return candidates[0];
}

function collectClue(game, location) {
  const fresh = game.monsterTrail
    .filter(t => t.node === location && game.round - t.round <= game.config.trailLifetime
      && !game.collectedVisitIds.includes(t.id))
    .sort((a,b)=>b.round-a.round);
  if (!fresh.length) return null;
  const trace = fresh[0];
  game.collectedVisitIds.push(trace.id);
  const from = MAP.nodes[location];
  const target = MAP.nodes[game.monster];
  const toward = bearingBetween(from, target);
  if (toward === null) return null; // Capture should already have been detected.
  // Alternate direct and reverse-bearing clues; reverse wording always refers to trace location.
  const reverse = game.clues.length % 2 === 1;
  const observedRound = game.round - 1;
  const displayed = reverse ? reverseBearing(toward) : toward;
  const clue = {
    id: trace.id,
    place: location,
    visitRound: trace.round,
    foundRound: game.round,
    observedRound,
    kind: reverse ? 'reverse' : 'direct',
    center: displayed,
    sectorCenter: toward,
    halfWidth: game.config.clueHalfWidth,
    bounds: sectorBounds(displayed, game.config.clueHalfWidth),
  };
  game.clues.unshift(clue);
  return clue;
}

export function hunterMove(game, inputBearing) {
  if (requirePhase(game, 'hunter')) return { ok:false, message:game.feedback };
  if (!game.stepsLeft) return fail(game, 'You have used both routes. Finish your turn.');
  const route = matchedNeighbour(game.hunter, inputBearing, game);
  if (route.error) return fail(game, route.error);
  game.hunter = route.to;
  game.hunterTrail.push(route.to);
  game.stepsLeft--;
  const destination = MAP.nodes[route.to].name;
  game.history.push({role:'hunter',round:game.round,node:route.to});
  if (game.hunter === game.monster) {
    game.phase = 'over';
    game.winner = 'hunter';
    return say(game, 'The monster was found at ' + destination + '! The Hunter wins.');
  }
  const clue = collectClue(game, game.hunter);
  const message = 'Travelled ' + formatBearing(route.bearing) + ' to ' + destination
    + ' (' + game.stepsLeft + ' route' + (game.stepsLeft===1?'':'s') + ' left).'
    + (clue ? ' A fresh trace revealed Clue #' + game.clues.length + '!' : '');
  return say(game, message);
}

export function endHunterTurn(game) {
  if (requirePhase(game, 'hunter')) return { ok:false, message:game.feedback };
  if (game.round >= game.config.maxRounds) {
    game.phase = 'over';
    game.winner = 'monster';
    return say(game, 'The final lantern has gone out. The Monster survived!');
  }
  game.phase = 'pass-monster';
  return say(game, 'Pass the device to the monster.');
}

export function monsterMove(game, inputBearing) {
  if (requirePhase(game, 'monster')) return { ok:false, message:game.feedback };
  const route = matchedNeighbour(game.monster, inputBearing, game);
  if (route.error) return fail(game, route.error);
  game.monster = route.to;
  game.monsterTrail.push({
    id: 'visit-' + game.nextTrailId++,
    node: route.to,
    round: game.round
  });
  game.history.push({role:'monster',round:game.round,node:route.to});
  // Stepping directly onto a stationary hunter is an immediate capture.
  if (game.monster === game.hunter) {
    game.phase = 'over';
    game.winner = 'hunter';
    return say(game, 'You walked into the Hunter! The Hunter wins.');
  }
  game.round++;
  game.stepsLeft = game.config.hunterSteps;
  game.phase = 'pass-hunter';
  return say(game, 'The monster travelled in secret.');
}
