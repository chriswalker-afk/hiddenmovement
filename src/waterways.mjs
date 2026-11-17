/**
 * Illustrated river centrelines for the two densest maps.
 *
 * All coordinates are in the game's 1000 x 720 world (SVG) units. These
 * channels deliberately pass between land-based location rows, never through
 * the centre of a map node. Roads crossing them are traversable bridges/ways.
 * Keeping SVG water geometry here allows tests to check actual bank clearance
 * against the *same* geometry used to paint the waterways.
 *
 * Each cubic segment: [[startX,startY],[ctrl1X,ctrl1Y],
 *                      [ctrl2X,ctrl2Y],[endX,endY]]
 */
export const WATERWAYS = Object.freeze({
  marsh: Object.freeze([
    Object.freeze({
      id: 'northern-river', width: 72,
      segments: [
        [[-60,174],[80,170],[155,179],[263,175]],
        [[263,175],[375,174],[500,174],[603,175]],
        [[603,175],[745,177],[907,170],[1060,175]]
      ]
    }),
    Object.freeze({
      id: 'southern-creek', width: 46,
      segments: [
        [[-50,571],[115,560],[244,580],[365,571]],
        [[365,571],[520,568],[635,565],[734,570]],
        [[734,570],[846,574],[930,569],[1060,571]]
      ]
    })
  ]),
  eclipse: Object.freeze([
    Object.freeze({
      id: 'eclipse-waterway', width: 46,
      segments: [
        [[-50,477],[100,473],[231,479],[365,476]],
        [[365,476],[494,474],[615,476],[734,477]],
        [[734,477],[859,479],[930,475],[1060,477]]
      ]
    })
  ])
});

/** Generate the actual SVG path from the shared Bezier control points. */
export function waterwayPath(channel) {
  const segments = channel.segments;
  if (!segments?.length) throw new RangeError('Waterway requires a cubic segment');
  const first = segments[0][0];
  return 'M' + first.join(' ') + ' ' +
    segments.map(([start,c1,c2,end]) =>
      'C' + c1.join(' ') + ' ' + c2.join(' ') + ' ' + end.join(' ')).join(' ');
}

/**
 * Sample along painted cubic centreline to estimate a node's clearance.
 * Testing helper; normal rendering uses waterwayPath(). Not a navigation hint.
 */
export function riverCenterlineDistance(point, channel, subdivisions=250) {
  let closest = Infinity;
  for (const [p0,p1,p2,p3] of channel.segments) {
    for (let i=0; i<=subdivisions; i++) {
      const t=i/subdivisions;
      const u=1-t;
      const x=u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0];
      const y=u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1];
      closest=Math.min(closest,Math.hypot(point.x-x, point.y-y));
    }
  }
  return closest;
}
