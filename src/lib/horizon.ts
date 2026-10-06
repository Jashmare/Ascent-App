import { seededRandom } from './random';

export interface Peak {
  x: number;
  y: number;
}

/**
 * The mountain silhouette along the bottom of the Sky. Each active summit is a peak whose
 * height reflects its progress: half the band at 0% (so it clears the "Add a dream" button
 * below), nearly all of it at 100%. With no summits, a low, quiet ridge.
 */
export function horizonShape(
  progresses: number[],
  width: number,
  height: number,
): { path: string; peaks: Peak[] } {
  const random = seededRandom(progresses.length * 7919 + 17);
  const floor = height * 0.82;
  const points: Peak[] = [{ x: 0, y: height * 0.68 }];
  const peaks: Peak[] = [];

  if (progresses.length === 0) {
    const hills = Math.max(3, Math.round(width / 160));
    for (let i = 0; i < hills; i++) {
      const x = ((i + 0.5) / hills) * width;
      points.push({ x: x - width / hills / 2, y: height * (0.74 + random() * 0.08) });
      points.push({ x, y: height * (0.5 + random() * 0.12) });
    }
  } else {
    const n = progresses.length;
    const spacing = width / n;
    progresses.forEach((progress, i) => {
      const x = (i + 0.5) * spacing;
      const p = Math.min(100, Math.max(0, progress)) / 100;
      const y = height - height * (0.5 + 0.45 * p);
      const drop = height - y;
      // A valley and uneven shoulders either side keep the ridge looking natural.
      points.push({ x: x - spacing / 2, y: floor - random() * height * 0.08 });
      points.push({ x: x - spacing * 0.26, y: y + drop * (0.42 + random() * 0.12) });
      points.push({ x: x - spacing * 0.1, y: y + drop * (0.12 + random() * 0.08) });
      points.push({ x, y });
      points.push({ x: x + spacing * 0.08, y: y + drop * (0.1 + random() * 0.06) });
      points.push({ x: x + spacing * 0.2, y: y + drop * (0.3 + random() * 0.12) });
      peaks.push({ x, y });
    });
  }

  points.push({ x: width, y: height * 0.7 });
  const ridge = points.map((p) => `L${round(p.x)} ${round(p.y)}`).join(' ');
  return { path: `M0 ${height} ${ridge} L${width} ${height} Z`, peaks };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
