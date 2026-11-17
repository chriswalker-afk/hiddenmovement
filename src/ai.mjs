import { graphDistance } from './geometry.mjs';

/**
 * Deterministic PRNG for repeatable debugging. The seed and AI state remain
 * private in the full game object and are never copied into a Hunter view.
 */
export function randomUnit(game) {
  let state = Number(game.randomState) >>> 0;
  state = (Math.imul(1664525, state) + 1013904223) >>> 0;
  game.randomState = state;
  return state / 4294967296;
}

const AI_STYLES = Object.freeze({
  intro:      {distance: .3, danger: .6, trail: .3, options: .15, future: 0, temperature: 5},
  apprentice: {distance: .9, danger: 1.6, trail: .8, options: .3, future: .15, temperature: 3.0},
  tracker:    {distance: 1.6, danger: 3.0, trail: 1.6, options: .7, future: .6, temperature: 1.8},
  expert:     {distance: 2.3, danger: 4.5, trail: 2.6, options: 1.0, future: 1.1, temperature: 1.0},
});

export function chooseMonsterSpawn(game) {
  const map = game.map;
  const choices = Object.keys(map.nodes)
    .filter(id => graphDistance(map.hunterStart, id, map) >= 3);
  if (!choices.length) throw new Error('No legal monster spawning location on ' + map.id);
  const distanceWeight = game.difficulty === 'intro' ? 0 : game.difficulty === 'expert' ? 1.2 : .4;
  const weighted = choices.map(id => ({
    id, weight: Math.exp(Math.min(6, distanceWeight * (graphDistance(map.hunterStart,id,map) - 3)))
  }));
  return weightedPick(weighted, game);
}

function weightedPick(choices, game) {
  const total = choices.reduce((sum, item) => sum + item.weight, 0);
  let draw = randomUnit(game) * total;
  for (const item of choices) {
    draw -= item.weight;
    if (draw <= 0) return item.id;
  }
  return choices.at(-1).id;
}

/**
 * Choose a legal move using information a Monster is allowed to know:
 * public Hunter position, public Hunter travel history, the network and its
 * own trail. No future Hunter action is accessible to the AI.
 */
export function chooseMonsterMove(game) {
  const map = game.map;
  if (!map?.adjacency?.[game.monster]) throw Error('Invalid monster location');
  const allowed = map.adjacency[game.monster].filter(id => id !== game.hunter);
  if (!allowed.length) throw Error('Monster has no legal unoccupied neighbour');
  if (allowed.length === 1) return allowed[0];

  const style = AI_STYLES[game.difficulty] || AI_STYLES.apprentice;
  const recent = new Set(game.monsterTrail.slice(-4).map(t => t.node));
  const hunterRecent = new Set(game.hunterTrail.slice(-3));
  const scores = allowed.map(id => {
    const dist = graphDistance(id, game.hunter, map);
    const exitCount = map.adjacency[id]
      .filter(next => next !== game.hunter && graphDistance(next, game.hunter, map) > 2).length;
    const bestNextDistance = Math.max(...map.adjacency[id].map(next => graphDistance(next, game.hunter, map)));
    let score = dist * style.distance
      - (dist <= 2 ? (3 - dist) * 2 * style.danger : 0)
      - (recent.has(id) ? 2 * style.trail : 0)
      - (hunterRecent.has(id) ? 2 * style.danger : 0)
      + exitCount * style.options
      + bestNextDistance * style.future;
    return {id, score};
  });
  const max = Math.max(...scores.map(s=>s.score));
  const choices = scores.map(item => ({
    id: item.id,
    weight: Math.exp(Math.max(-40, (item.score-max)/style.temperature))
  }));
  return weightedPick(choices, game);
}

export function describeAiStyle(difficulty) {
  return ({
    intro:'Wandering',apprentice:'Wary',tracker:'Elusive',expert:'Cunning'
  })[difficulty] ?? 'Wary';
}
