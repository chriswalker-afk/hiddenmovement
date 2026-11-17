import {
  angularDifference, bearingBetween, graphDistance, reverseBearing
} from './geometry.mjs';

/**
 * Turn a true bearing into a truthful but genuinely uncertain angular interval.
 * The real bearing can lie anywhere inside a fixed compass sector: unlike a
 * sector centred on the true value, its midpoint does NOT reveal the answer.
 * halfWidth=0 is the exact-bearing tutorial case.
 */
export function quantizeBearing(trueBearing, halfWidth) {
  if (!Number.isFinite(trueBearing)) return null;
  if (!Number.isFinite(halfWidth) || halfWidth < 0 || halfWidth > 179)
    throw new RangeError('Invalid sector half-width');
  const normalized = ((trueBearing % 360) + 360) % 360;
  if (halfWidth === 0) return normalized;
  const width = halfWidth * 2;
  return ((Math.floor((normalized + halfWidth) / width) * width) % 360 + 360) % 360;
}

/** Return candidate Monster nodes at the observation round of a clue. */
export function locationsAtObservation(map, clue) {
  const origin = map.nodes[clue.place];
  if (!origin) return [];
  const bearingCenter = Number.isFinite(clue.sectorCenter)
    ? clue.sectorCenter
    : clue.kind === 'reverse' ? reverseBearing(clue.center) : clue.center;
  const tolerance = clue.halfWidth ?? 0;
  if (!Number.isFinite(bearingCenter) || !Number.isFinite(tolerance)) return [];
  return Object.keys(map.nodes).filter(id => {
    if (id === clue.place) return false; // A bearing to itself is undefined.
    const angle = bearingBetween(origin, map.nodes[id]);
    if (angularDifference(angle, bearingCenter) > tolerance + 1e-7) return false;
    if (Number.isInteger(clue.distanceMin) && graphDistance(clue.place,id,map) < clue.distanceMin) return false;
    if (Number.isInteger(clue.distanceMax) && graphDistance(clue.place,id,map) > clue.distanceMax) return false;
    return true;
  });
}

/**
 * Monster moves exactly one connected road each completed round.
 * Compute nodes reachable in EXACTLY the specified number of moves, allowing
 * cycles/backtracking, never stationary teleportation. This deliberately does
 * not exclude paths through former Hunter squares (safe over-approximation).
 */
export function reachableAfter(map, starts, steps) {
  if (!Number.isInteger(steps) || steps < 0)
    throw new RangeError('Movement steps must be a non-negative integer');
  let possible = new Set(starts);
  for (let i=0; i<steps; i++) {
    const next = new Set();
    for (const id of possible) for (const to of map.adjacency[id] || []) next.add(to);
    possible = next;
  }
  return possible;
}

/**
 * Intersect all selected clues after advancing each from its own observation
 * round to the start of the current Hunter round.
 *
 * Only public time-stamped clues and the map graph are read; do not pass the
 * full game object or secret Monster position. Empty selections display zero
 * active constraints, not a false claim that the Monster has no locations.
 */
export function analyseClues(map, clues, currentRound, options = {}) {
  const allIds = Object.keys(map.nodes);
  const selected = clues.filter(c => c && c.place && Number.isInteger(c.observedRound)
    && c.observedRound <= currentRound - 1);
  if (!selected.length) {
    return {candidates:allIds, constrained:false, total:allIds.length,
      eliminated:0, cluesUsed:0, stepsByClue:[]};
  }
  let intersection = new Set(allIds);
  const stepsByClue = [];
  for (const clue of selected) {
    const elapsed = Math.max(0, currentRound - 1 - clue.observedRound);
    const initial = locationsAtObservation(map, clue);
    const possible = reachableAfter(map, initial, elapsed);
    intersection = new Set([...intersection].filter(id=>possible.has(id)));
    stepsByClue.push({id:clue.id,observedRound:clue.observedRound,
      elapsed,initialCount:initial.length,possibleNow:possible.size});
  }
  // When the Hunter is active, the game is not over, so the Monster cannot be
  // occupying the same node, including after a Monster turn.
  if(options.hunterLocation) intersection.delete(options.hunterLocation);
  const candidates = allIds.filter(id => intersection.has(id));
  return {candidates, constrained:true, total:allIds.length,
    eliminated:allIds.length-candidates.length, cluesUsed:selected.length,
    stepsByClue};
}

/** A compact explanation for interactive teaching displays. */
export function clueMathExplanation(clue, round) {
  const elapsed = Math.max(0,round-1-clue.observedRound);
  const angle = clue.kind === 'reverse' ? 'Reverse the clue bearing by 180° first. ' : '';
  const when = clue.observedRound === 0 ? 'at the beginning of the hunt' :
    'at the end of round ' + clue.observedRound;
  return angle + 'The clue was observed ' + when +
    '. The monster has had ' + elapsed + ' move' + (elapsed===1?'':'s') +
    ' since then, so its possible locations must be advanced along that many roads.';
}
