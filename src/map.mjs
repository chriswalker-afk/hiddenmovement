import { angularDifference, bearingBetween, graphDistance } from './geometry.mjs';
import { BLACKFEN_SITES } from './blackfen.mjs';
import { DUSKMERE_SITES, DUSKMERE_LANDMARKS } from './duskmere.mjs';

/** Blackfen's player-visible names and art are keyed to the stable graph IDs. */
const points=BLACKFEN_SITES.map(s=>[s.id,s.name,s.x,s.y]);

const paths = [
  'A-B','A-C','A-M','B-D','B-E','B-C','C-E','C-F','C-M',
  'D-E','D-G','E-G','E-H','E-F','F-H','F-M','F-N',
  'G-J','G-H','G-I','H-I','H-K','H-N','I-J','I-K','I-L',
  'J-L','K-L','K-N'
];

const nodes = Object.fromEntries(BLACKFEN_SITES.map(s =>
  [s.id, { id:s.id,name:s.name,x:s.x,y:s.y,landmarkKind:s.kind }]));
const edges = paths.map(path => path.split('-'));
const adjacency = Object.fromEntries(points.map(([id]) => [id, []]));
for (const [a,b] of edges) {
  adjacency[a].push(b);
  adjacency[b].push(a);
}
for (const key of Object.keys(adjacency)) adjacency[key].sort();
export const MAP = Object.freeze({
  id: 'intro',
  theme: 'moor',
  title: 'Blackfen Marsh',
  subtitle: 'The fen remembers every footstep.',
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
  if (!getMonsterSpawns(map).length) errors.push('No safe monster start');
  return errors;
}

/** The eligible starting nodes depend on the current map, not the tutorial map. */
export function getMonsterSpawns(map = MAP) {
  return Object.keys(map.nodes).filter(id => graphDistance(map.hunterStart, id, map) >= 3);
}

/**
 * A curated, staggered network. These are deterministic, connected, planar
 * coordinate graphs: every road has an unambiguous compass bearing.
 * Artwork themes and location names are independent of the geometry.
 */
function makeRegion(id, title, subtitle, theme, rowLengths, locationNames, sites=null) {
  const maxCols = Math.max(...rowLengths);
  const dx = Math.min(138, 800 / (maxCols - 0.3));
  const dy = Math.min(118, 545 / (rowLengths.length - 1));
  const dots = [];
  for (let row = 0, i = 0; row < rowLengths.length; row++) {
    const length = rowLengths[row];
    for (let col = 0; col < length; col++, i++) {
      const number = String(i + 1).padStart(2, '0');
      dots.push({
        id: id[0].toUpperCase() + number,
        name: locationNames[i],
        label: number,
        row,
        col,
        x: Math.round((95 + ((maxCols - length) / 2 + col + (row % 2) * 0.35) * dx) * 10) / 10,
        y: Math.round((75 + row * dy) * 10) / 10
      });
    }
  }
  if (dots.length !== locationNames.length) throw Error('Location name count mismatch for ' + id);
  const nodes = Object.fromEntries(dots.map(n => [n.id, n]));
  const adjacency = Object.fromEntries(dots.map(n => [n.id, []]));
  const edges = [];
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const a = dots[i];
      const b = dots[j];
      const sameRowRoad = a.row === b.row && Math.abs(a.col - b.col) === 1;
      const betweenRowsRoad = Math.abs(a.row - b.row) === 1 && Math.abs(a.x - b.x) < dx * 0.84;
      if (!sameRowRoad && !betweenRowsRoad) continue;
      edges.push([a.id, b.id]);
      adjacency[a.id].push(b.id);
      adjacency[b.id].push(a.id);
    }
  }
  for (const id of Object.keys(adjacency)) adjacency[id].sort();

  // Lay out roads with their original topology first, then expand the entire
  // network uniformly along each board axis. Earlier maps used as little as
  // 46% of the available width. Repositioning nodes AFTER connecting them
  // preserves the exact graph (and never introduces new/crossing roads).
  // Do not apply an SVG-only stretch: visual bearings must agree with the
  // coordinates used by the geometry engine and optional protractor.
  const xs = dots.map(n => n.x);
  const ys = dots.map(n => n.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const fit = (value, low, high, targetLow, targetHigh) =>
    Math.round((targetLow + (value - low) * (targetHigh - targetLow) / (high - low)) * 10) / 10;
  // Shift only the riverside bands onto their respective dry banks.
  // Moving entire short rows keeps the hand-authored routes staggered,
  // readable and non-crossing; no node is removed or renamed. The painted
  // water channels in waterways.mjs occupy the gaps between these bands.
  const riversideOffsets = {
    marsh: {1:23, 3:-18},
    eclipse: {3:-12, 4:18}
  }[theme] || {};
  for (const node of dots) {
    node.x = fit(node.x, xMin, xMax, 95, 905);
    node.y = fit(node.y, yMin, yMax, 95, 640) +
      (riversideOffsets[node.row] || 0);
    if(sites){
      const site=sites[node.id];
      if(!site || site.name!==node.name ||
        Math.abs(node.x-site.x)>0.05 || Math.abs(node.y-site.y)>0.05)
        throw new Error('Landmark does not match the real '+id+' road map: '+node.id);
      node.landmarkKind=site.kind;
    }
  }

  const middleRow = Math.floor((rowLengths.length - 1) / 2);
  const hunterStart = dots.find(n => n.row === middleRow && n.col === 0).id;
  return Object.freeze({ id, title, subtitle, theme, nodes, edges, adjacency, hunterStart });
}

const APPRENTICE_MAP = makeRegion(
  'apprentice', 'Duskmere Village',
  'The lights are on, but every lane keeps a secret.', 'woodland',
  [3,4,4,4,3],
  DUSKMERE_SITES.map(site=>site.name),
  DUSKMERE_LANDMARKS
);
const TRACKER_MAP = makeRegion(
  'tracker', 'The Sunken Lowlands', 'Mist carries every whisper.', 'marsh',
  [4,5,6,6,5],
  [
    'Mudflat','North Levee','Pale Reed','Willow Gate',
    'Tide Stone','Heron Cove','Silver Weir','Brackwater','Rope Bridge',
    'Silt Bank','Black Fen','Salt House','Floodgate','Ferry Path','Warden Tower',
    'Mire Cross','Long Quay','Marsh Light','Sedge Lane','Broken Lock','Drowned Oak',
    'Old Wharf','Wet Hollow','Lagoon Gate','South Levee','Low Beacon'
  ]
);
const EXPERT_MAP = makeRegion(
  'expert', 'The Eclipse Marches', 'The last road leads beyond the light.', 'eclipse',
  [5,6,7,7,6,5],
  [
    'Iron Arch','Glass Gate','High Spire','Cold Hearth','North Rift',
    'Black Tower','Fallen Star','Ash Market','Moon Court','Night Well','Owl Keep',
    'Wraith Hall','Cinder Path','Obsidian','Raven Bridge','Stone Maw','Echo Chamber','Pale Road',
    'Sable Cross','Ember Ford','Ruined Forge','Dusk Chapel','Silent Stair','Grave Hill','Veil End',
    'Crownless','South Rift','Old Crypt','Ghost Lantern','Vale Gate','Lost Garden',
    'Twilight','Hearthstone','Starfall','Final Gate','Eclipse Point'
  ]
);

export const MAPS = Object.freeze({
  intro: MAP,
  apprentice: APPRENTICE_MAP,
  tracker: TRACKER_MAP,
  expert: EXPERT_MAP
});
