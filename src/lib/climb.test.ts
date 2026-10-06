import { pointAlong, TRAIL, trailPath } from './climb';
import { greeting, percent, plural } from './format';

describe('climb line geometry', () => {
  it('starts at the trailhead and ends at the top', () => {
    expect(pointAlong(0)).toEqual(TRAIL[0]);
    expect(pointAlong(1)).toEqual(TRAIL[TRAIL.length - 1]);
    expect(pointAlong(-1)).toEqual(TRAIL[0]);
    expect(pointAlong(2)).toEqual(TRAIL[TRAIL.length - 1]);
  });

  it('moves steadily right and up as progress grows', () => {
    const points = [0.2, 0.4, 0.6, 0.8].map((t) => pointAlong(t));
    for (let i = 1; i < points.length; i++) {
      expect(points[i][0]).toBeGreaterThan(points[i - 1][0]);
      expect(points[i][1]).toBeLessThan(points[i - 1][1]);
    }
  });

  it('draws the trail as a path', () => {
    expect(
      trailPath([
        [0, 10],
        [5, 0],
      ]),
    ).toBe('M0 10 L5 0');
  });
});

describe('format', () => {
  it('pluralises', () => {
    expect(plural(1, 'task')).toBe('1 task');
    expect(plural(3, 'task')).toBe('3 tasks');
    expect(plural(2, 'day', 'days')).toBe('2 days');
  });

  it('greets by time of day', () => {
    expect(greeting(7)).toBe('Good morning');
    expect(greeting(13, 'Sam')).toBe('Good afternoon, Sam');
    expect(greeting(22)).toBe('Good evening');
    expect(greeting(3, '  ')).toBe('Good evening');
  });

  it('clamps percentages', () => {
    expect(percent(-5)).toBe(0);
    expect(percent(62.4)).toBe(62);
    expect(percent(140)).toBe(100);
  });
});
