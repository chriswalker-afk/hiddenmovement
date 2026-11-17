/** Three-figure bearings measured clockwise from north (screen y grows down). */
export function bearingBetween(from, to) {
  const dx = to.x - from.x;
  const dyNorth = from.y - to.y;
  if (dx === 0 && dyNorth === 0) return null;
  return (Math.atan2(dx, dyNorth) * 180 / Math.PI + 360) % 360;
}

export function reverseBearing(degrees) {
  return (degrees + 180) % 360;
}

export function angularDifference(a, b) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

export function formatBearing(degrees) {
  const n = ((Math.round(degrees) % 360) + 360) % 360;
  return String(n).padStart(3, '0') + '°';
}

/** Deliberately require three digits, teaching proper bearing notation. */
export function parseBearing(text) {
  const cleaned = String(text).trim();
  if (!/^\d{3}°?$/.test(cleaned)) return null;
  const num = Number(cleaned.replace('°', ''));
  return num <= 360 ? num % 360 : null;
}

export function sectorBounds(center, halfWidth) {
  return [formatBearing(center - halfWidth), formatBearing(center + halfWidth)];
}

export function withinSector(bearing, center, halfWidth) {
  return angularDifference(bearing, center) <= halfWidth + 1e-9;
}

export function routeBearing(fromId, toId, map) {
  return bearingBetween(map.nodes[fromId], map.nodes[toId]);
}

export function graphDistance(from, to, map) {
  if (from === to) return 0;
  const visited = new Set([from]);
  let current = [from];
  let depth = 0;
  while (current.length) {
    depth++;
    const next = [];
    for (const node of current) {
      for (const neighbour of map.adjacency[node]) {
        if (neighbour === to) return depth;
        if (!visited.has(neighbour)) {
          visited.add(neighbour);
          next.push(neighbour);
        }
      }
    }
    current = next;
  }
  return Infinity;
}
