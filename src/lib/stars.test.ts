import { horizonShape } from './horizon';
import { layoutStars, MIN_STAR_DISTANCE, restingLabels, starPosition } from './stars';

const viewport = { width: 360, height: 560, top: 0, bottom: 140 };

describe('starPosition', () => {
  it('is deterministic for an id', () => {
    expect(starPosition('dream:a', viewport)).toEqual(starPosition('dream:a', viewport));
    expect(starPosition('dream:a', viewport)).not.toEqual(starPosition('dream:b', viewport));
  });

  it('stays inside the field and out of the horizon band', () => {
    for (let i = 0; i < 200; i++) {
      const { x, y } = starPosition(`dream:${i}`, viewport);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(viewport.width);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(viewport.height - viewport.bottom);
    }
  });

  it('keeps out of the header band too', () => {
    for (let i = 0; i < 100; i++) {
      expect(starPosition(`s${i}`, { ...viewport, top: 120 }).y).toBeGreaterThan(120);
    }
  });
});

describe('layoutStars', () => {
  it('keeps every star at least 32px from the others', () => {
    const ids = Array.from({ length: 30 }, (_, i) => `dream:${i}`);
    const points = [...layoutStars(ids, viewport).values()];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const gap = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
        expect(gap).toBeGreaterThanOrEqual(MIN_STAR_DISTANCE);
      }
    }
  });

  it('never moves existing stars when one is added', () => {
    const before = layoutStars(['a', 'b', 'c'], viewport);
    const after = layoutStars(['a', 'b', 'c', 'd'], viewport);
    for (const id of ['a', 'b', 'c']) expect(after.get(id)).toEqual(before.get(id));
  });
});

describe('restingLabels', () => {
  it('labels at most three stars, inside the field, without overlaps', () => {
    const positions = new Map([
      ['a', { x: 40, y: 60 }],
      ['b', { x: 300, y: 120 }],
      ['c', { x: 50, y: 200 }],
      ['d', { x: 200, y: 300 }],
    ]);
    const labels = restingLabels(
      ['a', 'b', 'c', 'd'].map((id) => ({ id, text: 'A studio by the sea' })),
      positions,
      360,
    );
    expect(labels).toHaveLength(3);
    expect(labels.find((l) => l.id === 'b')?.side).toBe('left');
    expect(labels.find((l) => l.id === 'a')?.side).toBe('right');
  });

  it('skips a label that would collide with an earlier one', () => {
    const positions = new Map([
      ['a', { x: 40, y: 60 }],
      ['b', { x: 300, y: 62 }],
    ]);
    const labels = restingLabels(
      ['a', 'b'].map((id) => ({ id, text: 'A studio by the sea' })),
      positions,
      360,
    );
    expect(labels.map((l) => l.id)).toEqual(['a']);
  });

  it('skips a label that would cover another star', () => {
    const positions = new Map([
      ['a', { x: 40, y: 60 }],
      ['b', { x: 90, y: 62 }],
    ]);
    const labels = restingLabels(
      [{ id: 'a', text: 'A very long dream title here' }],
      positions,
      140,
    );
    expect(labels).toEqual([]);
  });
});

describe('horizonShape', () => {
  it('makes one peak per summit, taller with more progress', () => {
    const { peaks, path } = horizonShape([0, 50, 100], 300, 120);
    expect(peaks).toHaveLength(3);
    expect(peaks[0].y).toBeGreaterThan(peaks[1].y);
    expect(peaks[1].y).toBeGreaterThan(peaks[2].y);
    expect(path.startsWith('M0 120')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
  });

  it('spreads peaks across the width', () => {
    const { peaks } = horizonShape([10, 10], 400, 100);
    expect(peaks.map((p) => p.x)).toEqual([100, 300]);
  });

  it('draws a quiet ridge with no summits', () => {
    const { peaks, path } = horizonShape([], 360, 120);
    expect(peaks).toEqual([]);
    expect(path).toMatch(/^M0 120 .* Z$/);
  });
});
