import { angularDifference, bearingBetween, graphDistance } from './geometry.mjs';

/** Illustrated hand-authored introductory board; all x/y positions are SVG coordinates. */
const points = [
  ['A', 'Watchtower', 100, 380],
  ['B', 'Pine Crossing', 210, 225],
  ['C', 'Old Mill', 240, 470],
  ['D', 'Briar Farm', 360, 120],
  ['E', 'Whisper Grove', 420, 345],
  ['F', 'Chapel Ruins', 390, 590],
  ['G', 'Lantern Inn', 590, 185],
  ['H', 'Moonbridge', 620, 445],
  ['I', 'Blackwater Dock', 800, 315],
  ['J', 'Ash Hill', 790, 85],
  ['K', 'Stone Circle', 800, 575],
  ['L', "Raven's Gate", 930, 410],
  ['M', 'Marsh End', 145, 640],
  ['N', 'Bone Quarry', 575, 640],
];

const paths = [
  'A-B','A-C','A-M','B-D','B-E','B-C','C-E','C-F','C-M',
  'D-E','D-G','E-G','E-H','E-F','F-H','F-M','F-N',
  'G-J','G-H','G-I','H-I','H-K','H-N','I-J','I-K','I-L',
  'J-L','K-L','K-N'
];

const nodes = Object.fromEntries(points.map(([id, name, x, y]) => [id, { id, name, x, y }]));
const edges = paths.map(path => path.split('-'));
const adjacency = Object.fromEntries(points.map(([id]) => [id, []]));
for (const [a,b] of edges) {
  adjacency[a].push(b);
  adjacency[b].push(a);
}
for (const key of Object.keys(adjacency)) adjacency[key].sort();
export const MAP = Object.freeze({
  title: 'The Hollow Moor',
  subtitle: 'The lanterns are going out, one by one.',
  nodes,
  edges,
  adjacency,
  hunterStart: 'A'
});
export const NODE_IDS = Object.keys(MAP.nodes);
export const MONSTER_SPAWNS = NODE_IDS.filter(id => graphDistance(MAP.hunterStart, id, MAP) >= 3);

/** Validate map geometry before adding any future maps. */
export function validateMap(map = MAP, minimumAngle = 12) {
  const errors = [];
  if (!map.nodes[map.hunterStart]) errors.push('Missing hunter spawn');
  for (const [id, adjacent] of Object.entries(map.adjacency)) {
    if (adjacent.length < 2) errors.push(id + ' is a dead end');
    for (const other of adjacent) {
      if (!map.nodes[other]) errors.push('Missing node ' + other);
      else if (!map.adjacency[other]?.includes(id)) errors.push('Asymmetric connection ' + id + '-' + other);
    }
    for (let i=0; i<adjacent.length; i++) {
      for (let j=i+1; j<adjacent.length; j++) {
        const a=bearingBetween(map.nodes[id], map.nodes[adjacent[i]]);
        const b=bearingBetween(map.nodes[id], map.nodes[adjacent[j]]);
        if (angularDifference(a,b) < minimumAngle)
          errors.push('Ambiguous bearings at '+id+' toward '+adjacent[i]+' and '+adjacent[j]);
      }
    }
  }
  for (const id of Object.keys(map.nodes)) {
    if (!Number.isFinite(graphDistance(map.hunterStart, id, map)))
      errors.push('Unreachable node ' + id);
  }
  if (!MONSTER_SPAWNS.length) errors.push('No safe monster start');
  return errors;
}
