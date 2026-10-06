import { hashString, seededRandom } from './random';

/** The area stars may occupy. `top` and `bottom` are bands kept clear (header, horizon). */
export interface StarViewport {
  width: number;
  height: number;
  /** Clear band at the top, in px. */
  top?: number;
  /** Clear band at the bottom (the horizon), in px. */
  bottom?: number;
  /** Clear margin at the left and right edges, in px. */
  side?: number;
}

export interface Point {
  x: number;
  y: number;
}

export const MIN_STAR_DISTANCE = 32;
const ATTEMPTS = 60;

function bounds(viewport: StarViewport) {
  const side = viewport.side ?? 28;
  const top = (viewport.top ?? 0) + 20;
  const bottom = viewport.height - (viewport.bottom ?? 0) - 20;
  return {
    left: side,
    right: Math.max(side, viewport.width - side),
    top,
    bottom: Math.max(top, bottom),
  };
}

/** The candidate positions for an id, in the order they're tried. Seeded, so stable. */
function candidates(id: string, viewport: StarViewport): Point[] {
  const random = seededRandom(hashString(id));
  const { left, right, top, bottom } = bounds(viewport);
  return Array.from({ length: ATTEMPTS }, () => ({
    x: Math.round(left + random() * (right - left)),
    y: Math.round(top + random() * (bottom - top)),
  }));
}

/**
 * Where a star sits: a deterministic position seeded from its id, inside the viewport
 * and out of the header and horizon bands. When other stars are already placed, the first
 * candidate at least `minDistance` away from all of them wins; if none is, the roomiest.
 */
export function starPosition(
  id: string,
  viewport: StarViewport,
  placed: Point[] = [],
  minDistance = MIN_STAR_DISTANCE,
): Point {
  const options = candidates(id, viewport);
  let best = options[0];
  let bestGap = -1;
  for (const option of options) {
    const gap = placed.reduce(
      (min, p) => Math.min(min, Math.hypot(p.x - option.x, p.y - option.y)),
      Infinity,
    );
    if (gap >= minDistance) return option;
    if (gap > bestGap) {
      best = option;
      bestGap = gap;
    }
  }
  return best;
}

/**
 * Places every star in order (oldest first), each at least 32px from the ones before it.
 * Adding a star never moves the existing ones.
 */
export function layoutStars(
  ids: string[],
  viewport: StarViewport,
  minDistance = MIN_STAR_DISTANCE,
): Map<string, Point> {
  const positions = new Map<string, Point>();
  const placed: Point[] = [];
  for (const id of ids) {
    const point = starPosition(id, viewport, placed, minDistance);
    positions.set(id, point);
    placed.push(point);
  }
  return positions;
}

/** A stable size and twinkle timing for each star. */
export function starStyle(id: string): { size: number; duration: number; delay: number } {
  const random = seededRandom(hashString(id, 7));
  return {
    size: random(),
    duration: 3 + random() * 3, // 3–6s
    delay: -random() * 6, // already mid-twinkle, each on its own timing
  };
}

export interface LabelBox {
  id: string;
  side: 'left' | 'right';
}

/**
 * Chooses which stars get a label at rest (up to `max`), and which side the label sits on,
 * so labels stay inside the field and don't overlap each other or other stars.
 */
export function restingLabels(
  candidatesInOrder: { id: string; text: string }[],
  positions: Map<string, Point>,
  width: number,
  max = 3,
  charWidth = 8,
): LabelBox[] {
  const chosen: LabelBox[] = [];
  const boxes: { left: number; right: number; top: number; bottom: number }[] = [];
  const stars = [...positions.values()];

  for (const { id, text } of candidatesInOrder) {
    if (chosen.length >= max) break;
    const point = positions.get(id);
    if (!point) continue;
    const labelWidth = Math.min(text.length * charWidth + 16, 220);
    const sides: ('right' | 'left')[] = point.x > width / 2 ? ['left', 'right'] : ['right', 'left'];
    for (const side of sides) {
      const left = side === 'right' ? point.x + 14 : point.x - 14 - labelWidth;
      const box = { left, right: left + labelWidth, top: point.y - 13, bottom: point.y + 13 };
      const inside = box.left >= 4 && box.right <= width - 4;
      const hitsLabel = boxes.some(
        (b) => box.left < b.right && box.right > b.left && box.top < b.bottom && box.bottom > b.top,
      );
      const hitsStar = stars.some(
        (s) =>
          s !== point &&
          s.x > box.left - 6 &&
          s.x < box.right + 6 &&
          s.y > box.top - 6 &&
          s.y < box.bottom + 6,
      );
      if (inside && !hitsLabel && !hitsStar) {
        chosen.push({ id, side });
        boxes.push(box);
        break;
      }
    }
  }
  return chosen;
}
