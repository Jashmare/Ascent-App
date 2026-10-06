/**
 * Geometry for the climb line: a trail with switchbacks that rises from left to right.
 * Coordinates are in a 320 × 64 viewBox; the SVG scales uniformly to the panel width.
 */
export const TRAIL_VIEWBOX = { width: 320, height: 64 } as const;

export type Point = readonly [number, number];

export const TRAIL: readonly Point[] = [
  [6, 56],
  [44, 50],
  [62, 53],
  [98, 42],
  [122, 45],
  [160, 33],
  [182, 36],
  [222, 23],
  [244, 26],
  [282, 13],
  [314, 8],
];

function segmentLengths(points: readonly Point[]): number[] {
  return points.slice(1).map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
}

/** The point a fraction `t` (0–1) of the way along the trail, measured by distance walked. */
export function pointAlong(t: number, points: readonly Point[] = TRAIL): Point {
  const clamped = Math.min(1, Math.max(0, t));
  const lengths = segmentLengths(points);
  const total = lengths.reduce((sum, l) => sum + l, 0);
  let remaining = clamped * total;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] === 0 ? 0 : Math.min(1, remaining / lengths[i]);
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      return [x1 + (x2 - x1) * f, y1 + (y2 - y1) * f];
    }
    remaining -= lengths[i];
  }
  return points[points.length - 1];
}

export function trailPath(points: readonly Point[] = TRAIL): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
}
