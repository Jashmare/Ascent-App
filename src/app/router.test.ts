import { travelDirection } from './altitudes';
import { parseHash, parseOpen, routeToHash } from './router';

describe('router', () => {
  it('parses screens and falls back to Camp', () => {
    expect(parseHash('')).toEqual({ screen: 'camp' });
    expect(parseHash('#/ridge')).toEqual({ screen: 'ridge' });
    expect(parseHash('#/nowhere')).toEqual({ screen: 'camp' });
  });

  it('parses an open sheet', () => {
    expect(parseHash('#/sky?open=dream%3Aabc')).toEqual({ screen: 'sky', open: 'dream:abc' });
    expect(parseOpen('dream:abc')).toEqual({ kind: 'dream', id: 'abc' });
    expect(parseOpen('new-dream')).toEqual({ kind: 'new-dream' });
    expect(parseOpen(undefined)).toBeNull();
  });

  it('round-trips routes', () => {
    const route = { screen: 'ridge' as const, open: 'objective:a b' };
    expect(parseHash(routeToHash(route))).toEqual(route);
  });

  it('slides up when climbing and down when descending', () => {
    expect(travelDirection('camp', 'sky')).toBe(1);
    expect(travelDirection('summit', 'ridge')).toBe(-1);
    expect(travelDirection('camp', 'settings')).toBe(0);
  });
});
